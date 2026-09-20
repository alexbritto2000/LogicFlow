using LogiTrack.Domain.Common;
using LogiTrack.Domain.Enums;

namespace LogiTrack.Domain.Entities;

public class Vehicle : AuditableEntity
{
    public string VehicleNumber { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
    public string Make { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int Year { get; set; }
    public decimal Capacity { get; set; } // in tons
    public string FuelType { get; set; } = "Diesel";
    public decimal CurrentOdometer { get; set; }
    public VehicleStatus Status { get; set; } = VehicleStatus.Available;

    public ICollection<VehicleDocument> Documents { get; set; } = new List<VehicleDocument>();
    public ICollection<VehicleAssignment> Assignments { get; set; } = new List<VehicleAssignment>();
    public ICollection<Expense> Expenses { get; set; } = new List<Expense>();
}

public class VehicleDocument : AuditableEntity
{
    public int VehicleId { get; set; }
    public Vehicle Vehicle { get; set; } = null!;
    public VehicleDocumentType DocumentType { get; set; }
    public string DocumentNumber { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public string? Remarks { get; set; }

    public DocumentExpiryStatus ExpiryStatus =>
        ExpiryDate.Date < DateTime.UtcNow.Date ? DocumentExpiryStatus.Expired :
        (ExpiryDate.Date - DateTime.UtcNow.Date).TotalDays <= 30 ? DocumentExpiryStatus.ExpiringSoon :
        DocumentExpiryStatus.Valid;
}

public class Driver : AuditableEntity
{
    public string DriverCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Address { get; set; } = string.Empty;
    public string DrivingLicenseNumber { get; set; } = string.Empty;
    public DateTime LicenseExpiryDate { get; set; }
    public DateTime JoiningDate { get; set; }
    public DriverStatus Status { get; set; } = DriverStatus.Available;

    public int? UserId { get; set; }
    public User? User { get; set; }

    public ICollection<DriverDocument> Documents { get; set; } = new List<DriverDocument>();
    public ICollection<VehicleAssignment> Assignments { get; set; } = new List<VehicleAssignment>();

    public DocumentExpiryStatus LicenseExpiryStatus =>
        LicenseExpiryDate.Date < DateTime.UtcNow.Date ? DocumentExpiryStatus.Expired :
        (LicenseExpiryDate.Date - DateTime.UtcNow.Date).TotalDays <= 30 ? DocumentExpiryStatus.ExpiringSoon :
        DocumentExpiryStatus.Valid;
}

public class DriverDocument : AuditableEntity
{
    public int DriverId { get; set; }
    public Driver Driver { get; set; } = null!;
    public DriverDocumentType DocumentType { get; set; }
    public string DocumentNumber { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public string? Remarks { get; set; }

    public DocumentExpiryStatus ExpiryStatus =>
        ExpiryDate.Date < DateTime.UtcNow.Date ? DocumentExpiryStatus.Expired :
        (ExpiryDate.Date - DateTime.UtcNow.Date).TotalDays <= 30 ? DocumentExpiryStatus.ExpiringSoon :
        DocumentExpiryStatus.Valid;
}
