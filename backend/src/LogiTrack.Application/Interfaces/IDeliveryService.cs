using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Delivery;

namespace LogiTrack.Application.Interfaces;

public interface IDeliveryService
{
    Task<DeliveryDto> RecordDeliveryAsync(CreateDeliveryDto dto, string? performedBy = null);
    Task<PagedResult<DeliveryDto>> GetDeliveriesAsync(DeliveryQueryParameters query);
    Task<DeliveryDto?> GetDeliveryByIdAsync(int id);
    Task<DeliveryDto?> GetDeliveryByShipmentIdAsync(int shipmentId);
}
