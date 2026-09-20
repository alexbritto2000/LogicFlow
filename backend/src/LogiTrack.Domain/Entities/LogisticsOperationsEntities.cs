using LogiTrack.Domain.Common;
using LogiTrack.Domain.Enums;

namespace LogiTrack.Domain.Entities;

public class Booking : AuditableEntity
{
    public string BookingNumber { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;
    public DateTime BookingDate { get; set; } = DateTime.UtcNow;
    public string PickupAddress { get; set; } = string.Empty;
    public string PickupCity { get; set; } = string.Empty;
    public string DeliveryAddress { get; set; } = string.Empty;
    public string DeliveryCity { get; set; } = string.Empty;
    public DateTime PickupDate { get; set; }
    public DateTime ExpectedDeliveryDate { get; set; }
    public string CargoDescription { get; set; } = string.Empty;
    public decimal CargoWeight { get; set; } // in kg
    public int NumberOfPackages { get; set; }
    public string? SpecialInstructions { get; set; }
    public decimal FreightAmount { get; set; }
    public string PaymentType { get; set; } = "Prepaid"; // Prepaid, ToPay, Credit
    public BookingStatus Status { get; set; } = BookingStatus.Confirmed;

    public ICollection<Shipment> Shipments { get; set; } = new List<Shipment>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}

public class Shipment : AuditableEntity
{
    public string ShipmentNumber { get; set; } = string.Empty;
    public int BookingId { get; set; }
    public Booking Booking { get; set; } = null!;
    public string TrackingNumber { get; set; } = string.Empty;
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public string CurrentLocation { get; set; } = string.Empty;
    public ShipmentStatus CurrentStatus { get; set; } = ShipmentStatus.Created;
    public DateTime EstimatedDeliveryDate { get; set; }
    public DateTime? ActualDeliveryDate { get; set; }

    public ICollection<ShipmentStatusHistory> StatusHistories { get; set; } = new List<ShipmentStatusHistory>();
    public ICollection<VehicleAssignment> VehicleAssignments { get; set; } = new List<VehicleAssignment>();
    public ICollection<Delivery> Deliveries { get; set; } = new List<Delivery>();
    public ICollection<Expense> Expenses { get; set; } = new List<Expense>();
}

public class ShipmentStatusHistory : BaseEntity
{
    public int ShipmentId { get; set; }
    public Shipment Shipment { get; set; } = null!;
    public ShipmentStatus Status { get; set; }
    public string Location { get; set; } = string.Empty;
    public string? Remarks { get; set; }
    public string? UpdatedBy { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class VehicleAssignment : AuditableEntity
{
    public int ShipmentId { get; set; }
    public Shipment Shipment { get; set; } = null!;
    public int VehicleId { get; set; }
    public Vehicle Vehicle { get; set; } = null!;
    public int DriverId { get; set; }
    public Driver Driver { get; set; } = null!;
    public DateTime AssignedDate { get; set; } = DateTime.UtcNow;
    public DateTime? ReleasedDate { get; set; }
    public new bool IsActive { get; set; } = true;
    public string? Notes { get; set; }
}

public class Delivery : AuditableEntity
{
    public int ShipmentId { get; set; }
    public Shipment Shipment { get; set; } = null!;
    public DateTime DeliveryDate { get; set; } = DateTime.UtcNow;
    public string ReceiverName { get; set; } = string.Empty;
    public string ReceiverPhone { get; set; } = string.Empty;
    public string? DeliveryRemarks { get; set; }
    public string? ProofOfDeliveryFile { get; set; }
    public string? DeliveredBy { get; set; }
}
