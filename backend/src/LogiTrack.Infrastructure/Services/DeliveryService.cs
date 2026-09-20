using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Delivery;
using LogiTrack.Application.Interfaces;
using LogiTrack.Domain.Entities;
using LogiTrack.Domain.Enums;
using LogiTrack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LogiTrack.Infrastructure.Services;

public class DeliveryService : IDeliveryService
{
    private readonly LogiTrackDbContext _context;
    private readonly IFileStorageService _fileStorage;

    public DeliveryService(LogiTrackDbContext context, IFileStorageService fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
    }

    public async Task<DeliveryDto> RecordDeliveryAsync(CreateDeliveryDto dto, string? performedBy = null)
    {
        var shipment = await _context.Shipments
            .Include(s => s.Booking)
                .ThenInclude(b => b.Customer)
            .Include(s => s.VehicleAssignments)
                .ThenInclude(va => va.Vehicle)
            .Include(s => s.VehicleAssignments)
                .ThenInclude(va => va.Driver)
            .FirstOrDefaultAsync(s => s.Id == dto.ShipmentId);

        if (shipment == null)
        {
            throw new KeyNotFoundException($"Shipment with ID {dto.ShipmentId} was not found.");
        }

        if (shipment.CurrentStatus == ShipmentStatus.Delivered)
        {
            throw new InvalidOperationException($"Shipment {shipment.ShipmentNumber} has already been marked as Delivered.");
        }

        if (shipment.CurrentStatus == ShipmentStatus.Cancelled)
        {
            throw new InvalidOperationException($"Cannot record delivery for a cancelled shipment.");
        }

        string? podFilePath = null;
        if (dto.ProofOfDeliveryFile != null && dto.ProofOfDeliveryFile.Length > 0)
        {
            podFilePath = await _fileStorage.SaveFileAsync(dto.ProofOfDeliveryFile, "pod");
        }

        var delivery = new Delivery
        {
            ShipmentId = shipment.Id,
            DeliveryDate = dto.DeliveryDate,
            ReceiverName = dto.ReceiverName,
            ReceiverPhone = dto.ReceiverPhone,
            DeliveryRemarks = dto.DeliveryRemarks,
            ProofOfDeliveryFile = podFilePath,
            DeliveredBy = performedBy,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = performedBy
        };

        _context.Deliveries.Add(delivery);

        // Update Shipment Status
        shipment.CurrentStatus = ShipmentStatus.Delivered;
        shipment.ActualDeliveryDate = dto.DeliveryDate;
        shipment.CurrentLocation = shipment.Destination;
        shipment.UpdatedAt = DateTime.UtcNow;
        shipment.UpdatedBy = performedBy;

        // Record Status History
        var history = new ShipmentStatusHistory
        {
            ShipmentId = shipment.Id,
            Status = ShipmentStatus.Delivered,
            Location = shipment.Destination,
            Remarks = $"Delivered to {dto.ReceiverName} ({dto.ReceiverPhone}). {dto.DeliveryRemarks}".Trim(),
            UpdatedBy = performedBy,
            UpdatedAt = DateTime.UtcNow
        };
        _context.ShipmentStatusHistories.Add(history);

        // Check active assignment and release assets
        var activeAssignment = shipment.VehicleAssignments.FirstOrDefault(va => va.IsActive);
        string? vehicleNum = null;
        string? driverName = null;

        if (activeAssignment != null)
        {
            activeAssignment.IsActive = false;
            activeAssignment.ReleasedDate = DateTime.UtcNow;
            activeAssignment.Notes = string.IsNullOrWhiteSpace(activeAssignment.Notes)
                ? "Auto-released upon delivery."
                : $"{activeAssignment.Notes} | Auto-released upon delivery.";

            var vehicle = await _context.Vehicles.FindAsync(activeAssignment.VehicleId);
            if (vehicle != null && vehicle.Status == VehicleStatus.Assigned)
            {
                vehicle.Status = VehicleStatus.Available;
                vehicle.UpdatedAt = DateTime.UtcNow;
                vehicleNum = vehicle.VehicleNumber;
            }

            var driver = await _context.Drivers.FindAsync(activeAssignment.DriverId);
            if (driver != null && driver.Status == DriverStatus.Assigned)
            {
                driver.Status = DriverStatus.Available;
                driver.UpdatedAt = DateTime.UtcNow;
                driverName = driver.Name;
            }
        }

        // Update Booking Status if all shipments delivered
        var allShipmentsDelivered = await _context.Shipments
            .Where(s => s.BookingId == shipment.BookingId && s.Id != shipment.Id)
            .AllAsync(s => s.CurrentStatus == ShipmentStatus.Delivered);

        if (allShipmentsDelivered)
        {
            shipment.Booking.Status = BookingStatus.Delivered;
            shipment.Booking.UpdatedAt = DateTime.UtcNow;
            shipment.Booking.UpdatedBy = performedBy;
        }

        // Audit Log
        _context.AuditLogs.Add(new AuditLog
        {
            Action = "RECORD_DELIVERY",
            Entity = "Shipment",
            EntityId = shipment.Id.ToString(),
            UserName = performedBy,
            Timestamp = DateTime.UtcNow,
            Details = $"Shipment {shipment.ShipmentNumber} delivered to {dto.ReceiverName}. POD uploaded: {podFilePath != null}"
        });

        await _context.SaveChangesAsync();

        return new DeliveryDto
        {
            Id = delivery.Id,
            ShipmentId = shipment.Id,
            ShipmentNumber = shipment.ShipmentNumber,
            TrackingNumber = shipment.TrackingNumber,
            CustomerName = shipment.Booking.Customer.CompanyName,
            Origin = shipment.Origin,
            Destination = shipment.Destination,
            DeliveryDate = delivery.DeliveryDate,
            ReceiverName = delivery.ReceiverName,
            ReceiverPhone = delivery.ReceiverPhone,
            DeliveryRemarks = delivery.DeliveryRemarks,
            ProofOfDeliveryFile = delivery.ProofOfDeliveryFile,
            DeliveredBy = delivery.DeliveredBy,
            VehicleNumber = vehicleNum,
            DriverName = driverName
        };
    }

    public async Task<PagedResult<DeliveryDto>> GetDeliveriesAsync(DeliveryQueryParameters query)
    {
        var dbQuery = _context.Deliveries
            .AsNoTracking()
            .Include(d => d.Shipment)
                .ThenInclude(s => s.Booking)
                    .ThenInclude(b => b.Customer)
            .Include(d => d.Shipment)
                .ThenInclude(s => s.VehicleAssignments)
                    .ThenInclude(va => va.Vehicle)
            .Include(d => d.Shipment)
                .ThenInclude(s => s.VehicleAssignments)
                    .ThenInclude(va => va.Driver)
            .AsQueryable();

        if (query.CustomerId.HasValue)
        {
            dbQuery = dbQuery.Where(d => d.Shipment.Booking.CustomerId == query.CustomerId.Value);
        }

        if (query.FromDate.HasValue)
        {
            dbQuery = dbQuery.Where(d => d.DeliveryDate >= query.FromDate.Value);
        }

        if (query.ToDate.HasValue)
        {
            dbQuery = dbQuery.Where(d => d.DeliveryDate <= query.ToDate.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            dbQuery = dbQuery.Where(d =>
                d.Shipment.ShipmentNumber.ToLower().Contains(search) ||
                d.Shipment.TrackingNumber.ToLower().Contains(search) ||
                d.ReceiverName.ToLower().Contains(search) ||
                d.ReceiverPhone.ToLower().Contains(search) ||
                d.Shipment.Booking.Customer.CompanyName.ToLower().Contains(search));
        }

        var totalItems = await dbQuery.CountAsync();

        var items = await dbQuery
            .OrderByDescending(d => d.DeliveryDate)
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(d => new DeliveryDto
            {
                Id = d.Id,
                ShipmentId = d.ShipmentId,
                ShipmentNumber = d.Shipment.ShipmentNumber,
                TrackingNumber = d.Shipment.TrackingNumber,
                CustomerName = d.Shipment.Booking.Customer.CompanyName,
                Origin = d.Shipment.Origin,
                Destination = d.Shipment.Destination,
                DeliveryDate = d.DeliveryDate,
                ReceiverName = d.ReceiverName,
                ReceiverPhone = d.ReceiverPhone,
                DeliveryRemarks = d.DeliveryRemarks,
                ProofOfDeliveryFile = d.ProofOfDeliveryFile,
                DeliveredBy = d.DeliveredBy,
                VehicleNumber = d.Shipment.VehicleAssignments.OrderByDescending(va => va.AssignedDate).Select(va => va.Vehicle.VehicleNumber).FirstOrDefault(),
                DriverName = d.Shipment.VehicleAssignments.OrderByDescending(va => va.AssignedDate).Select(va => va.Driver.Name).FirstOrDefault()
            })
            .ToListAsync();

        return new PagedResult<DeliveryDto>
        {
            Items = items,
            TotalCount = totalItems,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize
        };
    }

    public async Task<DeliveryDto?> GetDeliveryByIdAsync(int id)
    {
        var d = await _context.Deliveries
            .AsNoTracking()
            .Include(d => d.Shipment)
                .ThenInclude(s => s.Booking)
                    .ThenInclude(b => b.Customer)
            .Include(d => d.Shipment)
                .ThenInclude(s => s.VehicleAssignments)
                    .ThenInclude(va => va.Vehicle)
            .Include(d => d.Shipment)
                .ThenInclude(s => s.VehicleAssignments)
                    .ThenInclude(va => va.Driver)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (d == null) return null;

        return new DeliveryDto
        {
            Id = d.Id,
            ShipmentId = d.ShipmentId,
            ShipmentNumber = d.Shipment.ShipmentNumber,
            TrackingNumber = d.Shipment.TrackingNumber,
            CustomerName = d.Shipment.Booking.Customer.CompanyName,
            Origin = d.Shipment.Origin,
            Destination = d.Shipment.Destination,
            DeliveryDate = d.DeliveryDate,
            ReceiverName = d.ReceiverName,
            ReceiverPhone = d.ReceiverPhone,
            DeliveryRemarks = d.DeliveryRemarks,
            ProofOfDeliveryFile = d.ProofOfDeliveryFile,
            DeliveredBy = d.DeliveredBy,
            VehicleNumber = d.Shipment.VehicleAssignments.OrderByDescending(va => va.AssignedDate).Select(va => va.Vehicle.VehicleNumber).FirstOrDefault(),
            DriverName = d.Shipment.VehicleAssignments.OrderByDescending(va => va.AssignedDate).Select(va => va.Driver.Name).FirstOrDefault()
        };
    }

    public async Task<DeliveryDto?> GetDeliveryByShipmentIdAsync(int shipmentId)
    {
        var d = await _context.Deliveries
            .AsNoTracking()
            .Include(d => d.Shipment)
                .ThenInclude(s => s.Booking)
                    .ThenInclude(b => b.Customer)
            .Include(d => d.Shipment)
                .ThenInclude(s => s.VehicleAssignments)
                    .ThenInclude(va => va.Vehicle)
            .Include(d => d.Shipment)
                .ThenInclude(s => s.VehicleAssignments)
                    .ThenInclude(va => va.Driver)
            .OrderByDescending(d => d.DeliveryDate)
            .FirstOrDefaultAsync(d => d.ShipmentId == shipmentId);

        if (d == null) return null;

        return new DeliveryDto
        {
            Id = d.Id,
            ShipmentId = d.ShipmentId,
            ShipmentNumber = d.Shipment.ShipmentNumber,
            TrackingNumber = d.Shipment.TrackingNumber,
            CustomerName = d.Shipment.Booking.Customer.CompanyName,
            Origin = d.Shipment.Origin,
            Destination = d.Shipment.Destination,
            DeliveryDate = d.DeliveryDate,
            ReceiverName = d.ReceiverName,
            ReceiverPhone = d.ReceiverPhone,
            DeliveryRemarks = d.DeliveryRemarks,
            ProofOfDeliveryFile = d.ProofOfDeliveryFile,
            DeliveredBy = d.DeliveredBy,
            VehicleNumber = d.Shipment.VehicleAssignments.OrderByDescending(va => va.AssignedDate).Select(va => va.Vehicle.VehicleNumber).FirstOrDefault(),
            DriverName = d.Shipment.VehicleAssignments.OrderByDescending(va => va.AssignedDate).Select(va => va.Driver.Name).FirstOrDefault()
        };
    }
}
