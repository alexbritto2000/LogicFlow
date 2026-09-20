using LogiTrack.Application.Common;
using LogiTrack.Domain.Enums;

namespace LogiTrack.Application.DTOs.Vehicle;

public class VehicleDto
{
    public int Id { get; set; }
    public string VehicleNumber { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
    public string Make { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int Year { get; set; }
    public decimal Capacity { get; set; }
    public string FuelType { get; set; } = string.Empty;
    public decimal CurrentOdometer { get; set; }
    public VehicleStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public int ExpiredDocumentsCount { get; set; }
    public int ExpiringSoonDocumentsCount { get; set; }
    public bool IsActive { get; set; }
}

public class VehicleDetailDto : VehicleDto
{
    public List<VehicleDocumentSummaryDto> Documents { get; set; } = new();
    public List<VehicleAssignmentSummaryDto> RecentAssignments { get; set; } = new();
}

public class VehicleDocumentSummaryDto
{
    public int Id { get; set; }
    public VehicleDocumentType DocumentType { get; set; }
    public string DocumentTypeName => DocumentType.ToString();
    public string DocumentNumber { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public string ExpiryStatus { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string? Remarks { get; set; }
}

public class VehicleAssignmentSummaryDto
{
    public int Id { get; set; }
    public int ShipmentId { get; set; }
    public string ShipmentNumber { get; set; } = string.Empty;
    public string TrackingNumber { get; set; } = string.Empty;
    public string DriverName { get; set; } = string.Empty;
    public DateTime AssignedDate { get; set; }
    public DateTime? ReleasedDate { get; set; }
    public bool IsActive { get; set; }
}

public class CreateVehicleDto
{
    public string VehicleNumber { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
    public string Make { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int Year { get; set; }
    public decimal Capacity { get; set; }
    public string FuelType { get; set; } = "Diesel";
    public decimal CurrentOdometer { get; set; }
    public VehicleStatus Status { get; set; } = VehicleStatus.Available;
}

public class UpdateVehicleDto : CreateVehicleDto
{
    public bool IsActive { get; set; } = true;
}

public class VehicleQueryParameters : PaginationParams
{
    public VehicleStatus? Status { get; set; }
    public string? VehicleType { get; set; }
}
