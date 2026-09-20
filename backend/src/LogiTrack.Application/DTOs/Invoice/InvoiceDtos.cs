using LogiTrack.Application.Common;
using LogiTrack.Domain.Enums;

namespace LogiTrack.Application.DTOs.Invoice;

public class CreateInvoiceItemDto
{
    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
}

public class CreateInvoiceDto
{
    public int CustomerId { get; set; }
    public int? BookingId { get; set; }
    public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
    public DateTime DueDate { get; set; } = DateTime.UtcNow.AddDays(15);
    public decimal TaxRatePercent { get; set; } = 18m; // Default GST 18%
    public decimal Discount { get; set; } = 0m;
    public List<CreateInvoiceItemDto> Items { get; set; } = new();
}

public class InvoiceItemDto
{
    public int Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Amount { get; set; }
}

public class InvoiceDto
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerGst { get; set; }
    public string? CustomerEmail { get; set; }
    public string? CustomerPhone { get; set; }
    public string? CustomerAddress { get; set; }
    public int? BookingId { get; set; }
    public string? BookingNumber { get; set; }
    public DateTime InvoiceDate { get; set; }
    public DateTime DueDate { get; set; }
    public decimal SubTotal { get; set; }
    public decimal Tax { get; set; }
    public decimal Discount { get; set; }
    public decimal Total { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal Balance { get; set; }
    public InvoiceStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public List<InvoiceItemDto> Items { get; set; } = new();
}

public class InvoiceQueryParameters : PaginationParams
{
    public int? CustomerId { get; set; }
    public InvoiceStatus? Status { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}

public class UpdateInvoiceStatusDto
{
    public InvoiceStatus Status { get; set; }
}
