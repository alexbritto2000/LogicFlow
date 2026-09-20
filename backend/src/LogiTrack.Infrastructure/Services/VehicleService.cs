using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Vehicle;
using LogiTrack.Application.Interfaces;
using LogiTrack.Domain.Entities;
using LogiTrack.Domain.Enums;
using LogiTrack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LogiTrack.Infrastructure.Services;

public class VehicleService : IVehicleService
{
    private readonly LogiTrackDbContext _context;

    public VehicleService(LogiTrackDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<PagedResult<VehicleDto>>> GetVehiclesAsync(VehicleQueryParameters queryParams, CancellationToken cancellationToken = default)
    {
        var query = _context.Vehicles
            .AsNoTracking()
            .Include(v => v.Documents)
            .AsQueryable();

        if (queryParams.Status.HasValue)
        {
            query = query.Where(v => v.Status == queryParams.Status.Value);
        }

        if (!string.IsNullOrWhiteSpace(queryParams.VehicleType))
        {
            var vt = queryParams.VehicleType.Trim().ToLower();
            query = query.Where(v => v.VehicleType.ToLower().Contains(vt));
        }

        if (!string.IsNullOrWhiteSpace(queryParams.Search))
        {
            var search = queryParams.Search.Trim().ToLower();
            query = query.Where(v =>
                v.VehicleNumber.ToLower().Contains(search) ||
                v.Make.ToLower().Contains(search) ||
                v.Model.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        query = queryParams.SortBy?.ToLower() switch
        {
            "vehiclenumber" => queryParams.IsAscending ? query.OrderBy(v => v.VehicleNumber) : query.OrderByDescending(v => v.VehicleNumber),
            "capacity" => queryParams.IsAscending ? query.OrderBy(v => v.Capacity) : query.OrderByDescending(v => v.Capacity),
            "status" => queryParams.IsAscending ? query.OrderBy(v => v.Status) : query.OrderByDescending(v => v.Status),
            _ => queryParams.IsAscending ? query.OrderBy(v => v.Id) : query.OrderByDescending(v => v.Id)
        };

        var today = DateTime.UtcNow.Date;
        var thirtyDaysLater = today.AddDays(30);

        var vehicles = await query
            .Skip((queryParams.PageNumber - 1) * queryParams.PageSize)
            .Take(queryParams.PageSize)
            .ToListAsync(cancellationToken);

        var items = vehicles.Select(v => new VehicleDto
        {
            Id = v.Id,
            VehicleNumber = v.VehicleNumber,
            VehicleType = v.VehicleType,
            Make = v.Make,
            Model = v.Model,
            Year = v.Year,
            Capacity = v.Capacity,
            FuelType = v.FuelType,
            CurrentOdometer = v.CurrentOdometer,
            Status = v.Status,
            IsActive = v.IsActive,
            ExpiredDocumentsCount = v.Documents.Count(d => d.ExpiryDate.Date < today),
            ExpiringSoonDocumentsCount = v.Documents.Count(d => d.ExpiryDate.Date >= today && d.ExpiryDate.Date <= thirtyDaysLater)
        }).ToList();

        var pagedResult = new PagedResult<VehicleDto>(items, totalCount, queryParams.PageNumber, queryParams.PageSize);
        return ApiResponse<PagedResult<VehicleDto>>.SuccessResult(pagedResult);
    }

    public async Task<ApiResponse<VehicleDetailDto>> GetVehicleByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var vehicle = await _context.Vehicles
            .AsNoTracking()
            .Include(v => v.Documents)
            .Include(v => v.Assignments)
                .ThenInclude(a => a.Driver)
            .Include(v => v.Assignments)
                .ThenInclude(a => a.Shipment)
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);

        if (vehicle == null)
        {
            return ApiResponse<VehicleDetailDto>.FailureResult("Vehicle not found.");
        }

        var today = DateTime.UtcNow.Date;
        var thirtyDaysLater = today.AddDays(30);

        var detail = new VehicleDetailDto
        {
            Id = vehicle.Id,
            VehicleNumber = vehicle.VehicleNumber,
            VehicleType = vehicle.VehicleType,
            Make = vehicle.Make,
            Model = vehicle.Model,
            Year = vehicle.Year,
            Capacity = vehicle.Capacity,
            FuelType = vehicle.FuelType,
            CurrentOdometer = vehicle.CurrentOdometer,
            Status = vehicle.Status,
            IsActive = vehicle.IsActive,
            ExpiredDocumentsCount = vehicle.Documents.Count(d => d.ExpiryDate.Date < today),
            ExpiringSoonDocumentsCount = vehicle.Documents.Count(d => d.ExpiryDate.Date >= today && d.ExpiryDate.Date <= thirtyDaysLater),
            Documents = vehicle.Documents.Select(d => new VehicleDocumentSummaryDto
            {
                Id = d.Id,
                DocumentType = d.DocumentType,
                DocumentNumber = d.DocumentNumber,
                IssueDate = d.IssueDate,
                ExpiryDate = d.ExpiryDate,
                ExpiryStatus = d.ExpiryStatus.ToString(),
                FilePath = d.FilePath,
                Remarks = d.Remarks
            }).ToList(),
            RecentAssignments = vehicle.Assignments
                .OrderByDescending(a => a.AssignedDate)
                .Take(10)
                .Select(a => new VehicleAssignmentSummaryDto
                {
                    Id = a.Id,
                    ShipmentId = a.ShipmentId,
                    ShipmentNumber = a.Shipment.ShipmentNumber,
                    TrackingNumber = a.Shipment.TrackingNumber,
                    DriverName = a.Driver.Name,
                    AssignedDate = a.AssignedDate,
                    ReleasedDate = a.ReleasedDate,
                    IsActive = a.IsActive
                }).ToList()
        };

        return ApiResponse<VehicleDetailDto>.SuccessResult(detail);
    }

    public async Task<ApiResponse<List<VehicleDto>>> GetAvailableVehiclesAsync(CancellationToken cancellationToken = default)
    {
        var vehicles = await _context.Vehicles
            .AsNoTracking()
            .Where(v => v.Status == VehicleStatus.Available && v.IsActive)
            .OrderBy(v => v.VehicleNumber)
            .Select(v => new VehicleDto
            {
                Id = v.Id,
                VehicleNumber = v.VehicleNumber,
                VehicleType = v.VehicleType,
                Make = v.Make,
                Model = v.Model,
                Year = v.Year,
                Capacity = v.Capacity,
                FuelType = v.FuelType,
                CurrentOdometer = v.CurrentOdometer,
                Status = v.Status,
                IsActive = v.IsActive
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<List<VehicleDto>>.SuccessResult(vehicles);
    }

    public async Task<ApiResponse<VehicleDto>> CreateVehicleAsync(CreateVehicleDto dto, string? createdBy = null, CancellationToken cancellationToken = default)
    {
        var vehicleNumber = dto.VehicleNumber.Trim().ToUpper();

        var exists = await _context.Vehicles.AnyAsync(v => v.VehicleNumber == vehicleNumber, cancellationToken);
        if (exists)
        {
            return ApiResponse<VehicleDto>.FailureResult($"Vehicle number '{vehicleNumber}' is already registered.");
        }

        var vehicle = new Vehicle
        {
            VehicleNumber = vehicleNumber,
            VehicleType = dto.VehicleType.Trim(),
            Make = dto.Make.Trim(),
            Model = dto.Model.Trim(),
            Year = dto.Year,
            Capacity = dto.Capacity,
            FuelType = dto.FuelType.Trim(),
            CurrentOdometer = dto.CurrentOdometer,
            Status = dto.Status,
            CreatedBy = createdBy,
            IsActive = true
        };

        _context.Vehicles.Add(vehicle);

        _context.AuditLogs.Add(new AuditLog
        {
            UserName = createdBy,
            Action = "Create Vehicle",
            Entity = "Vehicle",
            EntityId = vehicle.VehicleNumber,
            Timestamp = DateTime.UtcNow,
            Details = $"Added vehicle {vehicle.VehicleNumber} ({vehicle.Make} {vehicle.Model})"
        });

        await _context.SaveChangesAsync(cancellationToken);

        var resultDto = new VehicleDto
        {
            Id = vehicle.Id,
            VehicleNumber = vehicle.VehicleNumber,
            VehicleType = vehicle.VehicleType,
            Make = vehicle.Make,
            Model = vehicle.Model,
            Year = vehicle.Year,
            Capacity = vehicle.Capacity,
            FuelType = vehicle.FuelType,
            CurrentOdometer = vehicle.CurrentOdometer,
            Status = vehicle.Status,
            IsActive = vehicle.IsActive
        };

        return ApiResponse<VehicleDto>.SuccessResult(resultDto, "Vehicle added successfully.");
    }

    public async Task<ApiResponse<VehicleDto>> UpdateVehicleAsync(int id, UpdateVehicleDto dto, string? updatedBy = null, CancellationToken cancellationToken = default)
    {
        var vehicle = await _context.Vehicles.FindAsync(new object[] { id }, cancellationToken);
        if (vehicle == null)
        {
            return ApiResponse<VehicleDto>.FailureResult("Vehicle not found.");
        }

        var vehicleNumber = dto.VehicleNumber.Trim().ToUpper();
        if (vehicleNumber != vehicle.VehicleNumber)
        {
            var exists = await _context.Vehicles.AnyAsync(v => v.VehicleNumber == vehicleNumber && v.Id != id, cancellationToken);
            if (exists)
            {
                return ApiResponse<VehicleDto>.FailureResult($"Vehicle number '{vehicleNumber}' is already registered.");
            }
            vehicle.VehicleNumber = vehicleNumber;
        }

        vehicle.VehicleType = dto.VehicleType.Trim();
        vehicle.Make = dto.Make.Trim();
        vehicle.Model = dto.Model.Trim();
        vehicle.Year = dto.Year;
        vehicle.Capacity = dto.Capacity;
        vehicle.FuelType = dto.FuelType.Trim();
        vehicle.CurrentOdometer = dto.CurrentOdometer;
        vehicle.Status = dto.Status;
        vehicle.IsActive = dto.IsActive;
        vehicle.UpdatedBy = updatedBy;

        _context.AuditLogs.Add(new AuditLog
        {
            UserName = updatedBy,
            Action = "Update Vehicle",
            Entity = "Vehicle",
            EntityId = vehicle.VehicleNumber,
            Timestamp = DateTime.UtcNow,
            Details = $"Updated vehicle {vehicle.VehicleNumber}"
        });

        await _context.SaveChangesAsync(cancellationToken);

        var resultDto = new VehicleDto
        {
            Id = vehicle.Id,
            VehicleNumber = vehicle.VehicleNumber,
            VehicleType = vehicle.VehicleType,
            Make = vehicle.Make,
            Model = vehicle.Model,
            Year = vehicle.Year,
            Capacity = vehicle.Capacity,
            FuelType = vehicle.FuelType,
            CurrentOdometer = vehicle.CurrentOdometer,
            Status = vehicle.Status,
            IsActive = vehicle.IsActive
        };

        return ApiResponse<VehicleDto>.SuccessResult(resultDto, "Vehicle updated successfully.");
    }

    public async Task<ApiResponse<bool>> DeleteVehicleAsync(int id, string? deletedBy = null, CancellationToken cancellationToken = default)
    {
        var vehicle = await _context.Vehicles.FindAsync(new object[] { id }, cancellationToken);
        if (vehicle == null)
        {
            return ApiResponse<bool>.FailureResult("Vehicle not found.");
        }

        vehicle.IsActive = false;
        vehicle.Status = VehicleStatus.Inactive;
        vehicle.UpdatedBy = deletedBy;

        _context.AuditLogs.Add(new AuditLog
        {
            UserName = deletedBy,
            Action = "Deactivate Vehicle",
            Entity = "Vehicle",
            EntityId = vehicle.VehicleNumber,
            Timestamp = DateTime.UtcNow,
            Details = $"Deactivated vehicle {vehicle.VehicleNumber}"
        });

        await _context.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.SuccessResult(true, "Vehicle deactivated successfully.");
    }
}
