using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Assignment;
using LogiTrack.Application.Interfaces;
using LogiTrack.Domain.Entities;
using LogiTrack.Domain.Enums;
using LogiTrack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LogiTrack.Infrastructure.Services;

public class AssignmentService : IAssignmentService
{
    private readonly LogiTrackDbContext _context;

    public AssignmentService(LogiTrackDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<List<AssignmentDto>>> GetActiveAssignmentsAsync(CancellationToken cancellationToken = default)
    {
        var assignments = await _context.VehicleAssignments
            .AsNoTracking()
            .Include(va => va.Shipment)
                .ThenInclude(s => s.Booking)
                    .ThenInclude(b => b.Customer)
            .Include(va => va.Vehicle)
            .Include(va => va.Driver)
            .Where(va => va.IsActive)
            .OrderByDescending(va => va.AssignedDate)
            .Select(va => new AssignmentDto
            {
                Id = va.Id,
                ShipmentId = va.ShipmentId,
                ShipmentNumber = va.Shipment.ShipmentNumber,
                TrackingNumber = va.Shipment.TrackingNumber,
                CustomerName = va.Shipment.Booking.Customer.CompanyName,
                Origin = va.Shipment.Origin,
                Destination = va.Shipment.Destination,
                VehicleId = va.VehicleId,
                VehicleNumber = va.Vehicle.VehicleNumber,
                VehicleType = va.Vehicle.VehicleType,
                DriverId = va.DriverId,
                DriverName = va.Driver.Name,
                DriverPhone = va.Driver.Phone,
                AssignedDate = va.AssignedDate,
                ReleasedDate = va.ReleasedDate,
                IsActive = va.IsActive,
                Notes = va.Notes
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<List<AssignmentDto>>.SuccessResult(assignments);
    }

    public async Task<ApiResponse<AssignmentDto>> AssignFleetAsync(CreateAssignmentDto dto, string? assignedBy = null, CancellationToken cancellationToken = default)
    {
        // 1. Fetch and validate Shipment
        var shipment = await _context.Shipments
            .Include(s => s.Booking)
                .ThenInclude(b => b.Customer)
            .Include(s => s.VehicleAssignments)
            .FirstOrDefaultAsync(s => s.Id == dto.ShipmentId, cancellationToken);

        if (shipment == null)
        {
            return ApiResponse<AssignmentDto>.FailureResult("Shipment not found.");
        }

        if (shipment.CurrentStatus == ShipmentStatus.Delivered || shipment.CurrentStatus == ShipmentStatus.Cancelled)
        {
            return ApiResponse<AssignmentDto>.FailureResult($"Cannot assign fleet to a shipment that is {shipment.CurrentStatus}.");
        }

        // 2. Fetch and validate Vehicle
        var vehicle = await _context.Vehicles.FindAsync(new object[] { dto.VehicleId }, cancellationToken);
        if (vehicle == null)
        {
            return ApiResponse<AssignmentDto>.FailureResult("Vehicle not found.");
        }

        if (!vehicle.IsActive || vehicle.Status == VehicleStatus.Inactive)
        {
            return ApiResponse<AssignmentDto>.FailureResult($"Vehicle {vehicle.VehicleNumber} is inactive and cannot be assigned.");
        }

        if (vehicle.Status == VehicleStatus.Maintenance)
        {
            return ApiResponse<AssignmentDto>.FailureResult($"Vehicle {vehicle.VehicleNumber} is under maintenance and cannot be assigned.");
        }

        // Check if vehicle has active assignment conflict
        var vehicleConflict = await _context.VehicleAssignments
            .AnyAsync(va => va.VehicleId == dto.VehicleId && va.IsActive && va.ShipmentId != dto.ShipmentId, cancellationToken);
        if (vehicleConflict)
        {
            return ApiResponse<AssignmentDto>.FailureResult($"Vehicle {vehicle.VehicleNumber} is already actively assigned to another shipment.");
        }

        // 3. Fetch and validate Driver
        var driver = await _context.Drivers.FindAsync(new object[] { dto.DriverId }, cancellationToken);
        if (driver == null)
        {
            return ApiResponse<AssignmentDto>.FailureResult("Driver not found.");
        }

        if (!driver.IsActive || driver.Status == DriverStatus.Inactive)
        {
            return ApiResponse<AssignmentDto>.FailureResult($"Driver {driver.Name} is inactive and cannot be assigned.");
        }

        if (driver.Status == DriverStatus.OnLeave)
        {
            return ApiResponse<AssignmentDto>.FailureResult($"Driver {driver.Name} is currently on leave.");
        }

        if (driver.LicenseExpiryDate.Date < DateTime.UtcNow.Date)
        {
            return ApiResponse<AssignmentDto>.FailureResult($"Cannot assign driver {driver.Name} whose commercial driving license expired on {driver.LicenseExpiryDate:d}.");
        }

        // Check if driver has active assignment conflict
        var driverConflict = await _context.VehicleAssignments
            .AnyAsync(va => va.DriverId == dto.DriverId && va.IsActive && va.ShipmentId != dto.ShipmentId, cancellationToken);
        if (driverConflict)
        {
            return ApiResponse<AssignmentDto>.FailureResult($"Driver {driver.Name} is already actively assigned to another shipment.");
        }

        // 4. Release any existing active assignment on this shipment first
        var existingActive = shipment.VehicleAssignments.Where(va => va.IsActive).ToList();
        foreach (var oldVa in existingActive)
        {
            oldVa.IsActive = false;
            oldVa.ReleasedDate = DateTime.UtcNow;

            var oldV = await _context.Vehicles.FindAsync(new object[] { oldVa.VehicleId }, cancellationToken);
            if (oldV != null && oldV.Status == VehicleStatus.Assigned) oldV.Status = VehicleStatus.Available;

            var oldD = await _context.Drivers.FindAsync(new object[] { oldVa.DriverId }, cancellationToken);
            if (oldD != null && oldD.Status == DriverStatus.Assigned) oldD.Status = DriverStatus.Available;
        }

        // 5. Create new Assignment
        var assignment = new VehicleAssignment
        {
            ShipmentId = dto.ShipmentId,
            VehicleId = dto.VehicleId,
            DriverId = dto.DriverId,
            AssignedDate = DateTime.UtcNow,
            IsActive = true,
            Notes = dto.Notes?.Trim(),
            CreatedBy = assignedBy
        };

        _context.VehicleAssignments.Add(assignment);

        // 6. Update statuses
        vehicle.Status = VehicleStatus.Assigned;
        driver.Status = DriverStatus.Assigned;

        if (shipment.CurrentStatus == ShipmentStatus.Created)
        {
            shipment.CurrentStatus = ShipmentStatus.Assigned;
            shipment.CurrentLocation = $"{shipment.Origin} Depot (Assigned)";
            shipment.Booking.Status = BookingStatus.Assigned;
        }

        // 7. Add status timeline
        _context.ShipmentStatusHistories.Add(new ShipmentStatusHistory
        {
            ShipmentId = shipment.Id,
            Status = ShipmentStatus.Assigned,
            Location = shipment.CurrentLocation,
            Remarks = $"Assigned vehicle {vehicle.VehicleNumber} and driver {driver.Name} ({driver.Phone}). Notes: {dto.Notes}",
            UpdatedBy = assignedBy,
            UpdatedAt = DateTime.UtcNow
        });

        // 8. Audit Log
        _context.AuditLogs.Add(new AuditLog
        {
            UserName = assignedBy,
            Action = "Assign Fleet",
            Entity = "VehicleAssignment",
            EntityId = shipment.ShipmentNumber,
            Timestamp = DateTime.UtcNow,
            Details = $"Assigned vehicle {vehicle.VehicleNumber} & driver {driver.Name} to shipment {shipment.ShipmentNumber}"
        });

        await _context.SaveChangesAsync(cancellationToken);

        var resultDto = new AssignmentDto
        {
            Id = assignment.Id,
            ShipmentId = shipment.Id,
            ShipmentNumber = shipment.ShipmentNumber,
            TrackingNumber = shipment.TrackingNumber,
            CustomerName = shipment.Booking.Customer.CompanyName,
            Origin = shipment.Origin,
            Destination = shipment.Destination,
            VehicleId = vehicle.Id,
            VehicleNumber = vehicle.VehicleNumber,
            VehicleType = vehicle.VehicleType,
            DriverId = driver.Id,
            DriverName = driver.Name,
            DriverPhone = driver.Phone,
            AssignedDate = assignment.AssignedDate,
            IsActive = assignment.IsActive,
            Notes = assignment.Notes
        };

        return ApiResponse<AssignmentDto>.SuccessResult(resultDto, "Vehicle and driver assigned successfully.");
    }

    public async Task<ApiResponse<bool>> ReleaseAssignmentAsync(int assignmentId, ReleaseAssignmentDto dto, string? releasedBy = null, CancellationToken cancellationToken = default)
    {
        var assignment = await _context.VehicleAssignments
            .Include(va => va.Vehicle)
            .Include(va => va.Driver)
            .Include(va => va.Shipment)
            .FirstOrDefaultAsync(va => va.Id == assignmentId, cancellationToken);

        if (assignment == null)
        {
            return ApiResponse<bool>.FailureResult("Assignment record not found.");
        }

        if (!assignment.IsActive)
        {
            return ApiResponse<bool>.FailureResult("Assignment is already released.");
        }

        assignment.IsActive = false;
        assignment.ReleasedDate = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(dto.Notes))
        {
            assignment.Notes = string.IsNullOrWhiteSpace(assignment.Notes)
                ? dto.Notes
                : $"{assignment.Notes} | Release note: {dto.Notes}";
        }

        assignment.Vehicle.Status = VehicleStatus.Available;
        assignment.Driver.Status = DriverStatus.Available;

        _context.AuditLogs.Add(new AuditLog
        {
            UserName = releasedBy,
            Action = "Release Assignment",
            Entity = "VehicleAssignment",
            EntityId = assignment.Id.ToString(),
            Timestamp = DateTime.UtcNow,
            Details = $"Released vehicle {assignment.Vehicle.VehicleNumber} and driver {assignment.Driver.Name} from shipment {assignment.Shipment.ShipmentNumber}"
        });

        await _context.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.SuccessResult(true, "Vehicle and driver released to available fleet.");
    }
}
