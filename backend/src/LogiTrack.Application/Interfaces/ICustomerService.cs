using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Customer;

namespace LogiTrack.Application.Interfaces;

public interface ICustomerService
{
    Task<ApiResponse<PagedResult<CustomerDto>>> GetCustomersAsync(CustomerQueryParameters queryParams, CancellationToken cancellationToken = default);
    Task<ApiResponse<CustomerDetailDto>> GetCustomerByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<CustomerDto>> CreateCustomerAsync(CreateCustomerDto dto, string? createdBy = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<CustomerDto>> UpdateCustomerAsync(int id, UpdateCustomerDto dto, string? updatedBy = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteCustomerAsync(int id, string? deletedBy = null, CancellationToken cancellationToken = default);
}
