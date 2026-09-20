using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Driver;

namespace LogiTrack.Application.Interfaces;

public interface IDriverService
{
    Task<ApiResponse<PagedResult<DriverDto>>> GetDriversAsync(DriverQueryParameters queryParams, CancellationToken cancellationToken = default);
    Task<ApiResponse<DriverDetailDto>> GetDriverByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<DriverDto>>> GetAvailableDriversAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<DriverDto>> CreateDriverAsync(CreateDriverDto dto, string? createdBy = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<DriverDto>> UpdateDriverAsync(int id, UpdateDriverDto dto, string? updatedBy = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteDriverAsync(int id, string? deletedBy = null, CancellationToken cancellationToken = default);
}
