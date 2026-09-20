using LogiTrack.Application.Common;
using LogiTrack.Domain.Enums;

namespace LogiTrack.Application.DTOs.Driver;

public class DriverDto
{
    public int Id { get; set; }
    public string DriverCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Address { get; set; } = string.Empty;
    public string DrivingLicenseNumber { get; set; } = string.Empty;
    public DateTime LicenseExpiryDate { get; set; }
    public string LicenseExpiryStatus { get; set; } = string.Empty;
    public DateTime JoiningDate { get; set; }
    public DriverStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public int? UserId { get; set; }
    public bool IsActive { get; set; }
}

public class DriverDetailDto : DriverDto
{
    public List<DriverDocumentSummaryDto> Documents { get; set; } = new();
    public List<DriverAssignmentSummaryDto> RecentAssignments { get; set; } = new();
}

public class DriverDocumentSummaryDto
{
    public int Id { get; set; }
    public DriverDocumentType DocumentType { get; set; }
    public string DocumentTypeName => DocumentType.ToString();
    public string DocumentNumber { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public string ExpiryStatus { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string? Remarks { get; set; }
}

public class DriverAssignmentSummaryDto
{
    public int Id { get; set; }
    public int ShipmentId { get; set; }
    public string ShipmentNumber { get; set; } = string.Empty;
    public string TrackingNumber { get; set; } = string.Empty;
    public string VehicleNumber { get; set; } = string.Empty;
    public DateTime AssignedDate { get; set; }
    public DateTime? ReleasedDate { get; set; }
    public bool IsActive { get; set; }
}

public class CreateDriverDto
{
    public string? DriverCode { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Address { get; set; } = string.Empty;
    public string DrivingLicenseNumber { get; set; } = string.Empty;
    public DateTime LicenseExpiryDate { get; set; }
    public DateTime JoiningDate { get; set; } = DateTime.UtcNow;
    public DriverStatus Status { get; set; } = DriverStatus.Available;
}

public class UpdateDriverDto : CreateDriverDto
{
    public bool IsActive { get; set; } = true;
}

public class DriverQueryParameters : PaginationParams
{
    public DriverStatus? Status { get; set; }
}
