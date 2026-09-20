using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Vehicle;

namespace LogiTrack.Application.Interfaces;

public interface IVehicleService
{
    Task<ApiResponse<PagedResult<VehicleDto>>> GetVehiclesAsync(VehicleQueryParameters queryParams, CancellationToken cancellationToken = default);
    Task<ApiResponse<VehicleDetailDto>> GetVehicleByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<VehicleDto>>> GetAvailableVehiclesAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<VehicleDto>> CreateVehicleAsync(CreateVehicleDto dto, string? createdBy = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<VehicleDto>> UpdateVehicleAsync(int id, UpdateVehicleDto dto, string? updatedBy = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteVehicleAsync(int id, string? deletedBy = null, CancellationToken cancellationToken = default);
}
