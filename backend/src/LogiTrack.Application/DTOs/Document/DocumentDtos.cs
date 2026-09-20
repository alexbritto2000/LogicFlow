using LogiTrack.Domain.Enums;
using Microsoft.AspNetCore.Http;

namespace LogiTrack.Application.DTOs.Document;

public class UploadVehicleDocumentDto
{
    public int VehicleId { get; set; }
    public VehicleDocumentType DocumentType { get; set; }
    public string DocumentNumber { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public IFormFile File { get; set; } = null!;
    public string? Remarks { get; set; }
}

public class UploadDriverDocumentDto
{
    public int DriverId { get; set; }
    public DriverDocumentType DocumentType { get; set; }
    public string DocumentNumber { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public IFormFile File { get; set; } = null!;
    public string? Remarks { get; set; }
}

public class DocumentItemDto
{
    public int Id { get; set; }
    public string EntityType { get; set; } = string.Empty; // "Vehicle" or "Driver"
    public int EntityId { get; set; }
    public string EntityIdentifier { get; set; } = string.Empty; // e.g. "TN-01-AB-1234" or "Rajesh Kumar (DRV-0001)"
    public string DocumentType { get; set; } = string.Empty;
    public string DocumentNumber { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public string ExpiryStatus { get; set; } = string.Empty; // "Expired", "ExpiringSoon", "Valid"
    public int DaysUntilExpiry { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public string? Remarks { get; set; }
}

public class DocumentSummaryDto
{
    public int ExpiredCount { get; set; }
    public int ExpiringIn7DaysCount { get; set; }
    public int ExpiringIn30DaysCount { get; set; }
    public int TotalDocumentsCount { get; set; }
}
