using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Document;
using LogiTrack.Application.Interfaces;
using LogiTrack.Domain.Entities;
using LogiTrack.Domain.Enums;
using LogiTrack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LogiTrack.Infrastructure.Services;

public class DocumentService : IDocumentService
{
    private readonly LogiTrackDbContext _context;
    private readonly IFileStorageService _fileStorage;

    public DocumentService(LogiTrackDbContext context, IFileStorageService fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
    }

    public async Task<ApiResponse<DocumentSummaryDto>> GetDocumentSummaryAsync(CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;
        var in7Days = today.AddDays(7);
        var in30Days = today.AddDays(30);

        var vDocs = await _context.VehicleDocuments.AsNoTracking().ToListAsync(cancellationToken);
        var dDocs = await _context.DriverDocuments.AsNoTracking().ToListAsync(cancellationToken);

        var allExpiries = vDocs.Select(v => v.ExpiryDate.Date)
            .Concat(dDocs.Select(d => d.ExpiryDate.Date))
            .ToList();

        var summary = new DocumentSummaryDto
        {
            TotalDocumentsCount = allExpiries.Count,
            ExpiredCount = allExpiries.Count(e => e < today),
            ExpiringIn7DaysCount = allExpiries.Count(e => e >= today && e <= in7Days),
            ExpiringIn30DaysCount = allExpiries.Count(e => e >= today && e <= in30Days)
        };

        return ApiResponse<DocumentSummaryDto>.SuccessResult(summary);
    }

    public async Task<ApiResponse<List<DocumentItemDto>>> GetVehicleDocumentsAsync(int? vehicleId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.VehicleDocuments
            .AsNoTracking()
            .Include(vd => vd.Vehicle)
            .AsQueryable();

        if (vehicleId.HasValue)
        {
            query = query.Where(vd => vd.VehicleId == vehicleId.Value);
        }

        var today = DateTime.UtcNow.Date;
        var docs = await query.OrderBy(vd => vd.ExpiryDate).ToListAsync(cancellationToken);

        var list = docs.Select(d => new DocumentItemDto
        {
            Id = d.Id,
            EntityType = "Vehicle",
            EntityId = d.VehicleId,
            EntityIdentifier = d.Vehicle.VehicleNumber,
            DocumentType = d.DocumentType.ToString(),
            DocumentNumber = d.DocumentNumber,
            IssueDate = d.IssueDate,
            ExpiryDate = d.ExpiryDate,
            ExpiryStatus = d.ExpiryStatus.ToString(),
            DaysUntilExpiry = (int)(d.ExpiryDate.Date - today).TotalDays,
            FilePath = d.FilePath,
            Remarks = d.Remarks
        }).ToList();

        return ApiResponse<List<DocumentItemDto>>.SuccessResult(list);
    }

    public async Task<ApiResponse<List<DocumentItemDto>>> GetDriverDocumentsAsync(int? driverId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.DriverDocuments
            .AsNoTracking()
            .Include(dd => dd.Driver)
            .AsQueryable();

        if (driverId.HasValue)
        {
            query = query.Where(dd => dd.DriverId == driverId.Value);
        }

        var today = DateTime.UtcNow.Date;
        var docs = await query.OrderBy(dd => dd.ExpiryDate).ToListAsync(cancellationToken);

        var list = docs.Select(d => new DocumentItemDto
        {
            Id = d.Id,
            EntityType = "Driver",
            EntityId = d.DriverId,
            EntityIdentifier = $"{d.Driver.Name} ({d.Driver.DriverCode})",
            DocumentType = d.DocumentType.ToString(),
            DocumentNumber = d.DocumentNumber,
            IssueDate = d.IssueDate,
            ExpiryDate = d.ExpiryDate,
            ExpiryStatus = d.ExpiryStatus.ToString(),
            DaysUntilExpiry = (int)(d.ExpiryDate.Date - today).TotalDays,
            FilePath = d.FilePath,
            Remarks = d.Remarks
        }).ToList();

        return ApiResponse<List<DocumentItemDto>>.SuccessResult(list);
    }

    public async Task<ApiResponse<List<DocumentItemDto>>> GetExpiringDocumentsAsync(int daysThreshold = 30, CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;
        var thresholdDate = today.AddDays(daysThreshold);

        var vDocs = await _context.VehicleDocuments
            .AsNoTracking()
            .Include(v => v.Vehicle)
            .Where(v => v.ExpiryDate.Date <= thresholdDate)
            .ToListAsync(cancellationToken);

        var dDocs = await _context.DriverDocuments
            .AsNoTracking()
            .Include(d => d.Driver)
            .Where(d => d.ExpiryDate.Date <= thresholdDate)
            .ToListAsync(cancellationToken);

        var result = new List<DocumentItemDto>();

        result.AddRange(vDocs.Select(v => new DocumentItemDto
        {
            Id = v.Id,
            EntityType = "Vehicle",
            EntityId = v.VehicleId,
            EntityIdentifier = v.Vehicle.VehicleNumber,
            DocumentType = v.DocumentType.ToString(),
            DocumentNumber = v.DocumentNumber,
            IssueDate = v.IssueDate,
            ExpiryDate = v.ExpiryDate,
            ExpiryStatus = v.ExpiryStatus.ToString(),
            DaysUntilExpiry = (int)(v.ExpiryDate.Date - today).TotalDays,
            FilePath = v.FilePath,
            Remarks = v.Remarks
        }));

        result.AddRange(dDocs.Select(d => new DocumentItemDto
        {
            Id = d.Id,
            EntityType = "Driver",
            EntityId = d.DriverId,
            EntityIdentifier = $"{d.Driver.Name} ({d.Driver.DriverCode})",
            DocumentType = d.DocumentType.ToString(),
            DocumentNumber = d.DocumentNumber,
            IssueDate = d.IssueDate,
            ExpiryDate = d.ExpiryDate,
            ExpiryStatus = d.ExpiryStatus.ToString(),
            DaysUntilExpiry = (int)(d.ExpiryDate.Date - today).TotalDays,
            FilePath = d.FilePath,
            Remarks = d.Remarks
        }));

        result = result.OrderBy(r => r.ExpiryDate).ToList();
        return ApiResponse<List<DocumentItemDto>>.SuccessResult(result);
    }

    public async Task<ApiResponse<DocumentItemDto>> UploadVehicleDocumentAsync(UploadVehicleDocumentDto dto, string? createdBy = null, CancellationToken cancellationToken = default)
    {
        var vehicle = await _context.Vehicles.FindAsync(new object[] { dto.VehicleId }, cancellationToken);
        if (vehicle == null)
        {
            return ApiResponse<DocumentItemDto>.FailureResult("Vehicle not found.");
        }

        var filePath = await _fileStorage.SaveFileAsync(dto.File, "vehicle-documents", cancellationToken);

        var doc = new VehicleDocument
        {
            VehicleId = dto.VehicleId,
            DocumentType = dto.DocumentType,
            DocumentNumber = dto.DocumentNumber.Trim(),
            IssueDate = dto.IssueDate,
            ExpiryDate = dto.ExpiryDate,
            FilePath = filePath,
            Remarks = dto.Remarks?.Trim(),
            CreatedBy = createdBy
        };

        _context.VehicleDocuments.Add(doc);

        _context.AuditLogs.Add(new AuditLog
        {
            UserName = createdBy,
            Action = "Upload Vehicle Document",
            Entity = "VehicleDocument",
            EntityId = $"{vehicle.VehicleNumber}:{doc.DocumentNumber}",
            Timestamp = DateTime.UtcNow,
            Details = $"Uploaded {doc.DocumentType} for vehicle {vehicle.VehicleNumber}"
        });

        await _context.SaveChangesAsync(cancellationToken);

        var today = DateTime.UtcNow.Date;
        var item = new DocumentItemDto
        {
            Id = doc.Id,
            EntityType = "Vehicle",
            EntityId = doc.VehicleId,
            EntityIdentifier = vehicle.VehicleNumber,
            DocumentType = doc.DocumentType.ToString(),
            DocumentNumber = doc.DocumentNumber,
            IssueDate = doc.IssueDate,
            ExpiryDate = doc.ExpiryDate,
            ExpiryStatus = doc.ExpiryStatus.ToString(),
            DaysUntilExpiry = (int)(doc.ExpiryDate.Date - today).TotalDays,
            FilePath = doc.FilePath,
            Remarks = doc.Remarks
        };

        return ApiResponse<DocumentItemDto>.SuccessResult(item, "Vehicle document uploaded successfully.");
    }

    public async Task<ApiResponse<DocumentItemDto>> UploadDriverDocumentAsync(UploadDriverDocumentDto dto, string? createdBy = null, CancellationToken cancellationToken = default)
    {
        var driver = await _context.Drivers.FindAsync(new object[] { dto.DriverId }, cancellationToken);
        if (driver == null)
        {
            return ApiResponse<DocumentItemDto>.FailureResult("Driver not found.");
        }

        var filePath = await _fileStorage.SaveFileAsync(dto.File, "driver-documents", cancellationToken);

        var doc = new DriverDocument
        {
            DriverId = dto.DriverId,
            DocumentType = dto.DocumentType,
            DocumentNumber = dto.DocumentNumber.Trim(),
            IssueDate = dto.IssueDate,
            ExpiryDate = dto.ExpiryDate,
            FilePath = filePath,
            Remarks = dto.Remarks?.Trim(),
            CreatedBy = createdBy
        };

        _context.DriverDocuments.Add(doc);

        _context.AuditLogs.Add(new AuditLog
        {
            UserName = createdBy,
            Action = "Upload Driver Document",
            Entity = "DriverDocument",
            EntityId = $"{driver.DriverCode}:{doc.DocumentNumber}",
            Timestamp = DateTime.UtcNow,
            Details = $"Uploaded {doc.DocumentType} for driver {driver.Name}"
        });

        await _context.SaveChangesAsync(cancellationToken);

        var today = DateTime.UtcNow.Date;
        var item = new DocumentItemDto
        {
            Id = doc.Id,
            EntityType = "Driver",
            EntityId = doc.DriverId,
            EntityIdentifier = $"{driver.Name} ({driver.DriverCode})",
            DocumentType = doc.DocumentType.ToString(),
            DocumentNumber = doc.DocumentNumber,
            IssueDate = doc.IssueDate,
            ExpiryDate = doc.ExpiryDate,
            ExpiryStatus = doc.ExpiryStatus.ToString(),
            DaysUntilExpiry = (int)(doc.ExpiryDate.Date - today).TotalDays,
            FilePath = doc.FilePath,
            Remarks = doc.Remarks
        };

        return ApiResponse<DocumentItemDto>.SuccessResult(item, "Driver document uploaded successfully.");
    }

    public async Task<ApiResponse<bool>> DeleteVehicleDocumentAsync(int id, string? deletedBy = null, CancellationToken cancellationToken = default)
    {
        var doc = await _context.VehicleDocuments
            .Include(v => v.Vehicle)
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);

        if (doc == null)
        {
            return ApiResponse<bool>.FailureResult("Document not found.");
        }

        _fileStorage.DeleteFile(doc.FilePath);
        _context.VehicleDocuments.Remove(doc);

        _context.AuditLogs.Add(new AuditLog
        {
            UserName = deletedBy,
            Action = "Delete Vehicle Document",
            Entity = "VehicleDocument",
            EntityId = $"{doc.Vehicle.VehicleNumber}:{doc.DocumentNumber}",
            Timestamp = DateTime.UtcNow,
            Details = $"Deleted {doc.DocumentType} for vehicle {doc.Vehicle.VehicleNumber}"
        });

        await _context.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.SuccessResult(true, "Vehicle document deleted successfully.");
    }

    public async Task<ApiResponse<bool>> DeleteDriverDocumentAsync(int id, string? deletedBy = null, CancellationToken cancellationToken = default)
    {
        var doc = await _context.DriverDocuments
            .Include(d => d.Driver)
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);

        if (doc == null)
        {
            return ApiResponse<bool>.FailureResult("Document not found.");
        }

        _fileStorage.DeleteFile(doc.FilePath);
        _context.DriverDocuments.Remove(doc);

        _context.AuditLogs.Add(new AuditLog
        {
            UserName = deletedBy,
            Action = "Delete Driver Document",
            Entity = "DriverDocument",
            EntityId = $"{doc.Driver.DriverCode}:{doc.DocumentNumber}",
            Timestamp = DateTime.UtcNow,
            Details = $"Deleted {doc.DocumentType} for driver {doc.Driver.Name}"
        });

        await _context.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.SuccessResult(true, "Driver document deleted successfully.");
    }
}
