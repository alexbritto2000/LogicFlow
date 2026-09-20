using LogiTrack.Domain.Common;
using LogiTrack.Domain.Enums;

namespace LogiTrack.Domain.Entities;

public class Invoice : AuditableEntity
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;
    public int? BookingId { get; set; }
    public Booking? Booking { get; set; }
    public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
    public DateTime DueDate { get; set; }
    public decimal SubTotal { get; set; }
    public decimal Tax { get; set; } // GST / VAT
    public decimal Discount { get; set; }
    public decimal Total { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal Balance => Total - PaidAmount;
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;

    public ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}

public class InvoiceItem : BaseEntity
{
    public int InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = null!;
    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public decimal Amount => Quantity * UnitPrice;
}

public class Payment : AuditableEntity
{
    public string PaymentNumber { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;
    public int? BookingId { get; set; }
    public Booking? Booking { get; set; }
    public int? InvoiceId { get; set; }
    public Invoice? Invoice { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.BankTransfer;
    public string? ReferenceNumber { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Paid;
    public string? Remarks { get; set; }
}

public class Expense : AuditableEntity
{
    public int? VehicleId { get; set; }
    public Vehicle? Vehicle { get; set; }
    public int? ShipmentId { get; set; }
    public Shipment? Shipment { get; set; }
    public ExpenseType ExpenseType { get; set; } = ExpenseType.Fuel;
    public decimal Amount { get; set; }
    public DateTime ExpenseDate { get; set; } = DateTime.UtcNow;
    public string Description { get; set; } = string.Empty;
    public string? ReceiptFile { get; set; }
}

public class Notification : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; } = NotificationType.Info;
    public bool IsRead { get; set; } = false;
    public string? TargetRole { get; set; }
    public string? ReferenceUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class AuditLog : BaseEntity
{
    public int? UserId { get; set; }
    public string? UserName { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Entity { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? IpAddress { get; set; }
    public string? Details { get; set; }
}
