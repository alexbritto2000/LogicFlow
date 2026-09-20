using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Payment;
using LogiTrack.Application.Interfaces;
using LogiTrack.Domain.Entities;
using LogiTrack.Domain.Enums;
using LogiTrack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LogiTrack.Infrastructure.Services;

public class PaymentService : IPaymentService
{
    private readonly LogiTrackDbContext _context;

    public PaymentService(LogiTrackDbContext context)
    {
        _context = context;
    }

    public async Task<PaymentDto> RecordPaymentAsync(CreatePaymentDto dto, string? recordedBy = null)
    {
        var customer = await _context.Customers.FindAsync(dto.CustomerId);
        if (customer == null)
        {
            throw new KeyNotFoundException($"Customer with ID {dto.CustomerId} was not found.");
        }

        if (dto.Amount <= 0)
        {
            throw new ArgumentException("Payment amount must be greater than zero.");
        }

        var count = await _context.Payments.CountAsync();
        var paymentNumber = $"PAY-{DateTime.UtcNow:yyyy}-{(count + 1):D6}";

        var payment = new Payment
        {
            PaymentNumber = paymentNumber,
            CustomerId = dto.CustomerId,
            InvoiceId = dto.InvoiceId,
            BookingId = dto.BookingId,
            Amount = dto.Amount,
            PaymentDate = dto.PaymentDate,
            PaymentMethod = dto.PaymentMethod,
            ReferenceNumber = dto.ReferenceNumber,
            Status = PaymentStatus.Paid,
            Remarks = dto.Remarks,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = recordedBy
        };

        _context.Payments.Add(payment);

        string? invoiceNum = null;
        string? bookingNum = null;

        // If payment is applied to an Invoice
        if (dto.InvoiceId.HasValue)
        {
            var invoice = await _context.Invoices.FindAsync(dto.InvoiceId.Value);
            if (invoice != null)
            {
                invoiceNum = invoice.InvoiceNumber;
                invoice.PaidAmount += dto.Amount;
                if (invoice.PaidAmount >= invoice.Total)
                {
                    invoice.Status = InvoiceStatus.Paid;
                }
                else if (invoice.PaidAmount > 0)
                {
                    invoice.Status = InvoiceStatus.PartiallyPaid;
                }
                invoice.UpdatedAt = DateTime.UtcNow;
                invoice.UpdatedBy = recordedBy;
            }
        }

        // If payment is applied to a Booking
        if (dto.BookingId.HasValue)
        {
            var booking = await _context.Bookings.FindAsync(dto.BookingId.Value);
            if (booking != null)
            {
                bookingNum = booking.BookingNumber;
            }
        }

        _context.AuditLogs.Add(new AuditLog
        {
            Action = "RECORD_PAYMENT",
            Entity = "Payment",
            UserName = recordedBy,
            Timestamp = DateTime.UtcNow,
            Details = $"Recorded payment {paymentNumber} of {dto.Amount:C} for {customer.CompanyName} via {dto.PaymentMethod}."
        });

        await _context.SaveChangesAsync();

        return new PaymentDto
        {
            Id = payment.Id,
            PaymentNumber = payment.PaymentNumber,
            CustomerId = payment.CustomerId,
            CustomerName = customer.CompanyName,
            InvoiceId = payment.InvoiceId,
            InvoiceNumber = invoiceNum,
            BookingId = payment.BookingId,
            BookingNumber = bookingNum,
            Amount = payment.Amount,
            PaymentDate = payment.PaymentDate,
            PaymentMethod = payment.PaymentMethod,
            ReferenceNumber = payment.ReferenceNumber,
            Status = payment.Status,
            Remarks = payment.Remarks,
            CreatedAt = payment.CreatedAt,
            CreatedBy = payment.CreatedBy
        };
    }

    public async Task<PagedResult<PaymentDto>> GetPaymentsAsync(PaymentQueryParameters query)
    {
        var dbQuery = _context.Payments
            .AsNoTracking()
            .Include(p => p.Customer)
            .Include(p => p.Invoice)
            .Include(p => p.Booking)
            .AsQueryable();

        if (query.CustomerId.HasValue)
        {
            dbQuery = dbQuery.Where(p => p.CustomerId == query.CustomerId.Value);
        }

        if (query.InvoiceId.HasValue)
        {
            dbQuery = dbQuery.Where(p => p.InvoiceId == query.InvoiceId.Value);
        }

        if (query.PaymentMethod.HasValue)
        {
            dbQuery = dbQuery.Where(p => p.PaymentMethod == query.PaymentMethod.Value);
        }

        if (query.Status.HasValue)
        {
            dbQuery = dbQuery.Where(p => p.Status == query.Status.Value);
        }

        if (query.FromDate.HasValue)
        {
            dbQuery = dbQuery.Where(p => p.PaymentDate >= query.FromDate.Value);
        }

        if (query.ToDate.HasValue)
        {
            dbQuery = dbQuery.Where(p => p.PaymentDate <= query.ToDate.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            dbQuery = dbQuery.Where(p =>
                p.PaymentNumber.ToLower().Contains(search) ||
                p.Customer.CompanyName.ToLower().Contains(search) ||
                (p.ReferenceNumber != null && p.ReferenceNumber.ToLower().Contains(search)) ||
                (p.Invoice != null && p.Invoice.InvoiceNumber.ToLower().Contains(search)));
        }

        var totalCount = await dbQuery.CountAsync();

        var items = await dbQuery
            .OrderByDescending(p => p.PaymentDate)
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(p => new PaymentDto
            {
                Id = p.Id,
                PaymentNumber = p.PaymentNumber,
                CustomerId = p.CustomerId,
                CustomerName = p.Customer.CompanyName,
                InvoiceId = p.InvoiceId,
                InvoiceNumber = p.Invoice != null ? p.Invoice.InvoiceNumber : null,
                BookingId = p.BookingId,
                BookingNumber = p.Booking != null ? p.Booking.BookingNumber : null,
                Amount = p.Amount,
                PaymentDate = p.PaymentDate,
                PaymentMethod = p.PaymentMethod,
                ReferenceNumber = p.ReferenceNumber,
                Status = p.Status,
                Remarks = p.Remarks,
                CreatedAt = p.CreatedAt,
                CreatedBy = p.CreatedBy
            })
            .ToListAsync();

        return new PagedResult<PaymentDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize
        };
    }

    public async Task<PaymentDto?> GetPaymentByIdAsync(int id)
    {
        var p = await _context.Payments
            .AsNoTracking()
            .Include(p => p.Customer)
            .Include(p => p.Invoice)
            .Include(p => p.Booking)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (p == null) return null;

        return new PaymentDto
        {
            Id = p.Id,
            PaymentNumber = p.PaymentNumber,
            CustomerId = p.CustomerId,
            CustomerName = p.Customer.CompanyName,
            InvoiceId = p.InvoiceId,
            InvoiceNumber = p.Invoice?.InvoiceNumber,
            BookingId = p.BookingId,
            BookingNumber = p.Booking?.BookingNumber,
            Amount = p.Amount,
            PaymentDate = p.PaymentDate,
            PaymentMethod = p.PaymentMethod,
            ReferenceNumber = p.ReferenceNumber,
            Status = p.Status,
            Remarks = p.Remarks,
            CreatedAt = p.CreatedAt,
            CreatedBy = p.CreatedBy
        };
    }

    public async Task<List<PaymentDto>> GetPaymentsByInvoiceIdAsync(int invoiceId)
    {
        return await _context.Payments
            .AsNoTracking()
            .Include(p => p.Customer)
            .Include(p => p.Invoice)
            .Include(p => p.Booking)
            .Where(p => p.InvoiceId == invoiceId)
            .OrderByDescending(p => p.PaymentDate)
            .Select(p => new PaymentDto
            {
                Id = p.Id,
                PaymentNumber = p.PaymentNumber,
                CustomerId = p.CustomerId,
                CustomerName = p.Customer.CompanyName,
                InvoiceId = p.InvoiceId,
                InvoiceNumber = p.Invoice != null ? p.Invoice.InvoiceNumber : null,
                BookingId = p.BookingId,
                BookingNumber = p.Booking != null ? p.Booking.BookingNumber : null,
                Amount = p.Amount,
                PaymentDate = p.PaymentDate,
                PaymentMethod = p.PaymentMethod,
                ReferenceNumber = p.ReferenceNumber,
                Status = p.Status,
                Remarks = p.Remarks,
                CreatedAt = p.CreatedAt,
                CreatedBy = p.CreatedBy
            })
            .ToListAsync();
    }
}
