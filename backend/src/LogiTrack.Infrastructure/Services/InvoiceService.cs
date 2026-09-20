using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Invoice;
using LogiTrack.Application.Interfaces;
using LogiTrack.Domain.Entities;
using LogiTrack.Domain.Enums;
using LogiTrack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LogiTrack.Infrastructure.Services;

public class InvoiceService : IInvoiceService
{
    private readonly LogiTrackDbContext _context;

    public InvoiceService(LogiTrackDbContext context)
    {
        _context = context;
    }

    public async Task<InvoiceDto> CreateInvoiceAsync(CreateInvoiceDto dto, string? createdBy = null)
    {
        var customer = await _context.Customers.FindAsync(dto.CustomerId);
        if (customer == null)
        {
            throw new KeyNotFoundException($"Customer with ID {dto.CustomerId} was not found.");
        }

        var count = await _context.Invoices.CountAsync();
        var invoiceNumber = $"INV-{DateTime.UtcNow:yyyy}-{(count + 1):D6}";

        var invoice = new Invoice
        {
            InvoiceNumber = invoiceNumber,
            CustomerId = dto.CustomerId,
            BookingId = dto.BookingId,
            InvoiceDate = dto.InvoiceDate,
            DueDate = dto.DueDate,
            Discount = dto.Discount,
            Status = InvoiceStatus.Draft,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        decimal subTotal = 0m;
        foreach (var item in dto.Items)
        {
            var lineAmount = item.Quantity * item.UnitPrice;
            subTotal += lineAmount;
            invoice.Items.Add(new InvoiceItem
            {
                Description = item.Description,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice
            });
        }

        invoice.SubTotal = subTotal;
        invoice.Tax = Math.Round(subTotal * (dto.TaxRatePercent / 100m), 2);
        invoice.Total = Math.Max(0, invoice.SubTotal + invoice.Tax - invoice.Discount);
        invoice.PaidAmount = 0m;

        _context.Invoices.Add(invoice);
        _context.AuditLogs.Add(new AuditLog
        {
            Action = "CREATE_INVOICE",
            Entity = "Invoice",
            UserName = createdBy,
            Timestamp = DateTime.UtcNow,
            Details = $"Created invoice {invoiceNumber} for {customer.CompanyName} with total {invoice.Total:C}."
        });

        await _context.SaveChangesAsync();
        return MapToDto(invoice, customer);
    }

    public async Task<InvoiceDto> CreateFromBookingAsync(int bookingId, decimal taxRatePercent = 18m, decimal discount = 0m, string? createdBy = null)
    {
        var booking = await _context.Bookings
            .Include(b => b.Customer)
            .FirstOrDefaultAsync(b => b.Id == bookingId);

        if (booking == null)
        {
            throw new KeyNotFoundException($"Booking with ID {bookingId} was not found.");
        }

        // Check if an invoice already exists for this booking
        var existing = await _context.Invoices
            .Include(i => i.Customer)
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.BookingId == bookingId);

        if (existing != null)
        {
            return MapToDto(existing, existing.Customer, booking.BookingNumber);
        }

        var count = await _context.Invoices.CountAsync();
        var invoiceNumber = $"INV-{DateTime.UtcNow:yyyy}-{(count + 1):D6}";

        var invoice = new Invoice
        {
            InvoiceNumber = invoiceNumber,
            CustomerId = booking.CustomerId,
            BookingId = booking.Id,
            InvoiceDate = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(15),
            SubTotal = booking.FreightAmount,
            Discount = discount,
            Status = InvoiceStatus.Draft,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        invoice.Tax = Math.Round(invoice.SubTotal * (taxRatePercent / 100m), 2);
        invoice.Total = Math.Max(0, invoice.SubTotal + invoice.Tax - invoice.Discount);
        invoice.PaidAmount = 0m;

        invoice.Items.Add(new InvoiceItem
        {
            Description = $"Freight transportation: {booking.BookingNumber} ({booking.PickupCity} to {booking.DeliveryCity}) - {booking.CargoDescription} ({booking.CargoWeight} kg, {booking.NumberOfPackages} pkgs)",
            Quantity = 1,
            UnitPrice = booking.FreightAmount
        });

        _context.Invoices.Add(invoice);
        _context.AuditLogs.Add(new AuditLog
        {
            Action = "CREATE_INVOICE_FROM_BOOKING",
            Entity = "Invoice",
            UserName = createdBy,
            Timestamp = DateTime.UtcNow,
            Details = $"Generated invoice {invoiceNumber} from booking {booking.BookingNumber} for {booking.Customer.CompanyName}."
        });

        await _context.SaveChangesAsync();
        return MapToDto(invoice, booking.Customer, booking.BookingNumber);
    }

    public async Task<PagedResult<InvoiceDto>> GetInvoicesAsync(InvoiceQueryParameters query)
    {
        var dbQuery = _context.Invoices
            .AsNoTracking()
            .Include(i => i.Customer)
            .Include(i => i.Booking)
            .Include(i => i.Items)
            .AsQueryable();

        if (query.CustomerId.HasValue)
        {
            dbQuery = dbQuery.Where(i => i.CustomerId == query.CustomerId.Value);
        }

        if (query.Status.HasValue)
        {
            dbQuery = dbQuery.Where(i => i.Status == query.Status.Value);
        }

        if (query.FromDate.HasValue)
        {
            dbQuery = dbQuery.Where(i => i.InvoiceDate >= query.FromDate.Value);
        }

        if (query.ToDate.HasValue)
        {
            dbQuery = dbQuery.Where(i => i.InvoiceDate <= query.ToDate.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            dbQuery = dbQuery.Where(i =>
                i.InvoiceNumber.ToLower().Contains(search) ||
                i.Customer.CompanyName.ToLower().Contains(search) ||
                (i.Booking != null && i.Booking.BookingNumber.ToLower().Contains(search)));
        }

        var totalCount = await dbQuery.CountAsync();

        var items = await dbQuery
            .OrderByDescending(i => i.InvoiceDate)
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(i => new InvoiceDto
            {
                Id = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                CustomerId = i.CustomerId,
                CustomerName = i.Customer.CompanyName,
                CustomerGst = i.Customer.GSTNumber,
                CustomerEmail = i.Customer.Email,
                CustomerPhone = i.Customer.Phone,
                CustomerAddress = i.Customer.Address,
                BookingId = i.BookingId,
                BookingNumber = i.Booking != null ? i.Booking.BookingNumber : null,
                InvoiceDate = i.InvoiceDate,
                DueDate = i.DueDate,
                SubTotal = i.SubTotal,
                Tax = i.Tax,
                Discount = i.Discount,
                Total = i.Total,
                PaidAmount = i.PaidAmount,
                Balance = i.Balance,
                Status = i.Status,
                Items = i.Items.Select(item => new InvoiceItemDto
                {
                    Id = item.Id,
                    Description = item.Description,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    Amount = item.Amount
                }).ToList()
            })
            .ToListAsync();

        return new PagedResult<InvoiceDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize
        };
    }

    public async Task<InvoiceDto?> GetInvoiceByIdAsync(int id)
    {
        var i = await _context.Invoices
            .AsNoTracking()
            .Include(i => i.Customer)
            .Include(i => i.Booking)
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (i == null) return null;

        return MapToDto(i, i.Customer, i.Booking?.BookingNumber);
    }

    public async Task<InvoiceDto> UpdateStatusAsync(int id, InvoiceStatus status, string? updatedBy = null)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Customer)
            .Include(i => i.Booking)
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (invoice == null)
        {
            throw new KeyNotFoundException($"Invoice with ID {id} was not found.");
        }

        invoice.Status = status;
        invoice.UpdatedAt = DateTime.UtcNow;
        invoice.UpdatedBy = updatedBy;

        _context.AuditLogs.Add(new AuditLog
        {
            Action = "UPDATE_INVOICE_STATUS",
            Entity = "Invoice",
            EntityId = invoice.Id.ToString(),
            UserName = updatedBy,
            Timestamp = DateTime.UtcNow,
            Details = $"Updated invoice {invoice.InvoiceNumber} status to {status}."
        });

        await _context.SaveChangesAsync();
        return MapToDto(invoice, invoice.Customer, invoice.Booking?.BookingNumber);
    }

    private static InvoiceDto MapToDto(Invoice i, Customer customer, string? bookingNumber = null)
    {
        return new InvoiceDto
        {
            Id = i.Id,
            InvoiceNumber = i.InvoiceNumber,
            CustomerId = i.CustomerId,
            CustomerName = customer.CompanyName,
            CustomerGst = customer.GSTNumber,
            CustomerEmail = customer.Email,
            CustomerPhone = customer.Phone,
            CustomerAddress = customer.Address,
            BookingId = i.BookingId,
            BookingNumber = bookingNumber ?? i.Booking?.BookingNumber,
            InvoiceDate = i.InvoiceDate,
            DueDate = i.DueDate,
            SubTotal = i.SubTotal,
            Tax = i.Tax,
            Discount = i.Discount,
            Total = i.Total,
            PaidAmount = i.PaidAmount,
            Balance = i.Balance,
            Status = i.Status,
            Items = i.Items.Select(item => new InvoiceItemDto
            {
                Id = item.Id,
                Description = item.Description,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                Amount = item.Amount
            }).ToList()
        };
    }
}
