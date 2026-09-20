using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Driver;
using LogiTrack.Application.Interfaces;
using LogiTrack.Domain.Entities;
using LogiTrack.Domain.Enums;
using LogiTrack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LogiTrack.Infrastructure.Services;

public class DriverService : IDriverService
{
    private readonly LogiTrackDbContext _context;

    public DriverService(LogiTrackDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<PagedResult<DriverDto>>> GetDriversAsync(DriverQueryParameters queryParams, CancellationToken cancellationToken = default)
    {
        var query = _context.Drivers.AsNoTracking().AsQueryable();

        if (queryParams.Status.HasValue)
        {
            query = query.Where(d => d.Status == queryParams.Status.Value);
        }

        if (!string.IsNullOrWhiteSpace(queryParams.Search))
        {
            var search = queryParams.Search.Trim().ToLower();
            query = query.Where(d =>
                d.DriverCode.ToLower().Contains(search) ||
                d.Name.ToLower().Contains(search) ||
                d.Phone.Contains(search) ||
                (d.Email != null && d.Email.ToLower().Contains(search)) ||
                d.DrivingLicenseNumber.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        query = queryParams.SortBy?.ToLower() switch
        {
            "name" => queryParams.IsAscending ? query.OrderBy(d => d.Name) : query.OrderByDescending(d => d.Name),
            "drivercode" => queryParams.IsAscending ? query.OrderBy(d => d.DriverCode) : query.OrderByDescending(d => d.DriverCode),
            "licenseexpiry" => queryParams.IsAscending ? query.OrderBy(d => d.LicenseExpiryDate) : query.OrderByDescending(d => d.LicenseExpiryDate),
            "status" => queryParams.IsAscending ? query.OrderBy(d => d.Status) : query.OrderByDescending(d => d.Status),
            _ => queryParams.IsAscending ? query.OrderBy(d => d.Id) : query.OrderByDescending(d => d.Id)
        };

        var drivers = await query
            .Skip((queryParams.PageNumber - 1) * queryParams.PageSize)
            .Take(queryParams.PageSize)
            .ToListAsync(cancellationToken);

        var items = drivers.Select(d => new DriverDto
        {
            Id = d.Id,
            DriverCode = d.DriverCode,
            Name = d.Name,
            Phone = d.Phone,
            Email = d.Email,
            Address = d.Address,
            DrivingLicenseNumber = d.DrivingLicenseNumber,
            LicenseExpiryDate = d.LicenseExpiryDate,
            LicenseExpiryStatus = d.LicenseExpiryStatus.ToString(),
            JoiningDate = d.JoiningDate,
            Status = d.Status,
            UserId = d.UserId,
            IsActive = d.IsActive
        }).ToList();

        var pagedResult = new PagedResult<DriverDto>(items, totalCount, queryParams.PageNumber, queryParams.PageSize);
        return ApiResponse<PagedResult<DriverDto>>.SuccessResult(pagedResult);
    }

    public async Task<ApiResponse<DriverDetailDto>> GetDriverByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var driver = await _context.Drivers
            .AsNoTracking()
            .Include(d => d.Documents)
            .Include(d => d.Assignments)
                .ThenInclude(a => a.Vehicle)
            .Include(d => d.Assignments)
                .ThenInclude(a => a.Shipment)
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);

        if (driver == null)
        {
            return ApiResponse<DriverDetailDto>.FailureResult("Driver not found.");
        }

        var detail = new DriverDetailDto
        {
            Id = driver.Id,
            DriverCode = driver.DriverCode,
            Name = driver.Name,
            Phone = driver.Phone,
            Email = driver.Email,
            Address = driver.Address,
            DrivingLicenseNumber = driver.DrivingLicenseNumber,
            LicenseExpiryDate = driver.LicenseExpiryDate,
            LicenseExpiryStatus = driver.LicenseExpiryStatus.ToString(),
            JoiningDate = driver.JoiningDate,
            Status = driver.Status,
            UserId = driver.UserId,
            IsActive = driver.IsActive,
            Documents = driver.Documents.Select(doc => new DriverDocumentSummaryDto
            {
                Id = doc.Id,
                DocumentType = doc.DocumentType,
                DocumentNumber = doc.DocumentNumber,
                IssueDate = doc.IssueDate,
                ExpiryDate = doc.ExpiryDate,
                ExpiryStatus = doc.ExpiryStatus.ToString(),
                FilePath = doc.FilePath,
                Remarks = doc.Remarks
            }).ToList(),
            RecentAssignments = driver.Assignments
                .OrderByDescending(a => a.AssignedDate)
                .Take(10)
                .Select(a => new DriverAssignmentSummaryDto
                {
                    Id = a.Id,
                    ShipmentId = a.ShipmentId,
                    ShipmentNumber = a.Shipment.ShipmentNumber,
                    TrackingNumber = a.Shipment.TrackingNumber,
                    VehicleNumber = a.Vehicle.VehicleNumber,
                    AssignedDate = a.AssignedDate,
                    ReleasedDate = a.ReleasedDate,
                    IsActive = a.IsActive
                }).ToList()
        };

        return ApiResponse<DriverDetailDto>.SuccessResult(detail);
    }

    public async Task<ApiResponse<List<DriverDto>>> GetAvailableDriversAsync(CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;

        var drivers = await _context.Drivers
            .AsNoTracking()
            .Where(d => d.Status == DriverStatus.Available && d.IsActive && d.LicenseExpiryDate > today)
            .OrderBy(d => d.Name)
            .ToListAsync(cancellationToken);

        var list = drivers.Select(d => new DriverDto
        {
            Id = d.Id,
            DriverCode = d.DriverCode,
            Name = d.Name,
            Phone = d.Phone,
            Email = d.Email,
            Address = d.Address,
            DrivingLicenseNumber = d.DrivingLicenseNumber,
            LicenseExpiryDate = d.LicenseExpiryDate,
            LicenseExpiryStatus = d.LicenseExpiryStatus.ToString(),
            JoiningDate = d.JoiningDate,
            Status = d.Status,
            UserId = d.UserId,
            IsActive = d.IsActive
        }).ToList();

        return ApiResponse<List<DriverDto>>.SuccessResult(list);
    }

    public async Task<ApiResponse<DriverDto>> CreateDriverAsync(CreateDriverDto dto, string? createdBy = null, CancellationToken cancellationToken = default)
    {
        var code = dto.DriverCode?.Trim();
        if (string.IsNullOrWhiteSpace(code))
        {
            var count = await _context.Drivers.CountAsync(cancellationToken);
            code = $"DRV-{(count + 1):D4}";
        }

        var exists = await _context.Drivers.AnyAsync(d => d.DriverCode == code, cancellationToken);
        if (exists)
        {
            return ApiResponse<DriverDto>.FailureResult($"Driver code '{code}' already exists.");
        }

        var licenseExists = await _context.Drivers.AnyAsync(d => d.DrivingLicenseNumber == dto.DrivingLicenseNumber.Trim(), cancellationToken);
        if (licenseExists)
        {
            return ApiResponse<DriverDto>.FailureResult($"Driving license number '{dto.DrivingLicenseNumber}' is already registered to another driver.");
        }

        var driver = new Driver
        {
            DriverCode = code,
            Name = dto.Name.Trim(),
            Phone = dto.Phone.Trim(),
            Email = dto.Email?.Trim(),
            Address = dto.Address.Trim(),
            DrivingLicenseNumber = dto.DrivingLicenseNumber.Trim(),
            LicenseExpiryDate = dto.LicenseExpiryDate,
            JoiningDate = dto.JoiningDate,
            Status = dto.Status,
            CreatedBy = createdBy,
            IsActive = true
        };

        _context.Drivers.Add(driver);

        _context.AuditLogs.Add(new AuditLog
        {
            UserName = createdBy,
            Action = "Create Driver",
            Entity = "Driver",
            EntityId = driver.DriverCode,
            Timestamp = DateTime.UtcNow,
            Details = $"Added driver {driver.Name} ({driver.DriverCode})"
        });

        await _context.SaveChangesAsync(cancellationToken);

        var resultDto = new DriverDto
        {
            Id = driver.Id,
            DriverCode = driver.DriverCode,
            Name = driver.Name,
            Phone = driver.Phone,
            Email = driver.Email,
            Address = driver.Address,
            DrivingLicenseNumber = driver.DrivingLicenseNumber,
            LicenseExpiryDate = driver.LicenseExpiryDate,
            LicenseExpiryStatus = driver.LicenseExpiryStatus.ToString(),
            JoiningDate = driver.JoiningDate,
            Status = driver.Status,
            IsActive = driver.IsActive
        };

        return ApiResponse<DriverDto>.SuccessResult(resultDto, "Driver created successfully.");
    }

    public async Task<ApiResponse<DriverDto>> UpdateDriverAsync(int id, UpdateDriverDto dto, string? updatedBy = null, CancellationToken cancellationToken = default)
    {
        var driver = await _context.Drivers.FindAsync(new object[] { id }, cancellationToken);
        if (driver == null)
        {
            return ApiResponse<DriverDto>.FailureResult("Driver not found.");
        }

        if (!string.IsNullOrWhiteSpace(dto.DriverCode) && dto.DriverCode != driver.DriverCode)
        {
            var codeExists = await _context.Drivers.AnyAsync(d => d.DriverCode == dto.DriverCode && d.Id != id, cancellationToken);
            if (codeExists)
            {
                return ApiResponse<DriverDto>.FailureResult($"Driver code '{dto.DriverCode}' already exists.");
            }
            driver.DriverCode = dto.DriverCode.Trim();
        }

        var licenseNumber = dto.DrivingLicenseNumber.Trim();
        if (licenseNumber != driver.DrivingLicenseNumber)
        {
            var licenseExists = await _context.Drivers.AnyAsync(d => d.DrivingLicenseNumber == licenseNumber && d.Id != id, cancellationToken);
            if (licenseExists)
            {
                return ApiResponse<DriverDto>.FailureResult($"Driving license number '{licenseNumber}' is already registered.");
            }
            driver.DrivingLicenseNumber = licenseNumber;
        }

        driver.Name = dto.Name.Trim();
        driver.Phone = dto.Phone.Trim();
        driver.Email = dto.Email?.Trim();
        driver.Address = dto.Address.Trim();
        driver.LicenseExpiryDate = dto.LicenseExpiryDate;
        driver.Status = dto.Status;
        driver.IsActive = dto.IsActive;
        driver.UpdatedBy = updatedBy;

        _context.AuditLogs.Add(new AuditLog
        {
            UserName = updatedBy,
            Action = "Update Driver",
            Entity = "Driver",
            EntityId = driver.DriverCode,
            Timestamp = DateTime.UtcNow,
            Details = $"Updated driver {driver.Name} ({driver.DriverCode})"
        });

        await _context.SaveChangesAsync(cancellationToken);

        var resultDto = new DriverDto
        {
            Id = driver.Id,
            DriverCode = driver.DriverCode,
            Name = driver.Name,
            Phone = driver.Phone,
            Email = driver.Email,
            Address = driver.Address,
            DrivingLicenseNumber = driver.DrivingLicenseNumber,
            LicenseExpiryDate = driver.LicenseExpiryDate,
            LicenseExpiryStatus = driver.LicenseExpiryStatus.ToString(),
            JoiningDate = driver.JoiningDate,
            Status = driver.Status,
            IsActive = driver.IsActive
        };

        return ApiResponse<DriverDto>.SuccessResult(resultDto, "Driver updated successfully.");
    }

    public async Task<ApiResponse<bool>> DeleteDriverAsync(int id, string? deletedBy = null, CancellationToken cancellationToken = default)
    {
        var driver = await _context.Drivers.FindAsync(new object[] { id }, cancellationToken);
        if (driver == null)
        {
            return ApiResponse<bool>.FailureResult("Driver not found.");
        }

        driver.IsActive = false;
        driver.Status = DriverStatus.Inactive;
        driver.UpdatedBy = deletedBy;

        _context.AuditLogs.Add(new AuditLog
        {
            UserName = deletedBy,
            Action = "Deactivate Driver",
            Entity = "Driver",
            EntityId = driver.DriverCode,
            Timestamp = DateTime.UtcNow,
            Details = $"Deactivated driver {driver.Name} ({driver.DriverCode})"
        });

        await _context.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.SuccessResult(true, "Driver deactivated successfully.");
    }
}
