using LogiTrack.Application.Common;
using LogiTrack.Domain.Enums;

namespace LogiTrack.Application.DTOs.Payment;

public class CreatePaymentDto
{
    public int CustomerId { get; set; }
    public int? InvoiceId { get; set; }
    public int? BookingId { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.BankTransfer;
    public string? ReferenceNumber { get; set; }
    public string? Remarks { get; set; }
}

public class PaymentDto
{
    public int Id { get; set; }
    public string PaymentNumber { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public int? InvoiceId { get; set; }
    public string? InvoiceNumber { get; set; }
    public int? BookingId { get; set; }
    public string? BookingNumber { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public string PaymentMethodName => PaymentMethod.ToString();
    public string? ReferenceNumber { get; set; }
    public PaymentStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
}

public class PaymentQueryParameters : PaginationParams
{
    public int? CustomerId { get; set; }
    public int? InvoiceId { get; set; }
    public PaymentMethod? PaymentMethod { get; set; }
    public PaymentStatus? Status { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}
