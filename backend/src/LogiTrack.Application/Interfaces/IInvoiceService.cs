using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Invoice;
using LogiTrack.Domain.Enums;

namespace LogiTrack.Application.Interfaces;

public interface IInvoiceService
{
    Task<InvoiceDto> CreateInvoiceAsync(CreateInvoiceDto dto, string? createdBy = null);
    Task<InvoiceDto> CreateFromBookingAsync(int bookingId, decimal taxRatePercent = 18m, decimal discount = 0m, string? createdBy = null);
    Task<PagedResult<InvoiceDto>> GetInvoicesAsync(InvoiceQueryParameters query);
    Task<InvoiceDto?> GetInvoiceByIdAsync(int id);
    Task<InvoiceDto> UpdateStatusAsync(int id, InvoiceStatus status, string? updatedBy = null);
}
