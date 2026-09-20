using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Payment;

namespace LogiTrack.Application.Interfaces;

public interface IPaymentService
{
    Task<PaymentDto> RecordPaymentAsync(CreatePaymentDto dto, string? recordedBy = null);
    Task<PagedResult<PaymentDto>> GetPaymentsAsync(PaymentQueryParameters query);
    Task<PaymentDto?> GetPaymentByIdAsync(int id);
    Task<List<PaymentDto>> GetPaymentsByInvoiceIdAsync(int invoiceId);
}
