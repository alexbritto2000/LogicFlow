using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Shipment;

namespace LogiTrack.Application.Interfaces;

public interface IShipmentService
{
    Task<ApiResponse<PagedResult<ShipmentDto>>> GetShipmentsAsync(ShipmentQueryParameters queryParams, CancellationToken cancellationToken = default);
    Task<ApiResponse<ShipmentDetailDto>> GetShipmentByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<TrackingResultDto>> TrackByNumberAsync(string trackingNumber, CancellationToken cancellationToken = default);
    Task<ApiResponse<ShipmentDto>> CreateShipmentAsync(CreateShipmentDto dto, string? createdBy = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<ShipmentDto>> UpdateShipmentStatusAsync(int id, UpdateShipmentStatusRequest request, string? updatedBy = null, CancellationToken cancellationToken = default);
}
