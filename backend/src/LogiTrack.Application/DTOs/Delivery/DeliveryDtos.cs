using LogiTrack.Application.Common;
using Microsoft.AspNetCore.Http;

namespace LogiTrack.Application.DTOs.Delivery;

public class CreateDeliveryDto
{
    public int ShipmentId { get; set; }
    public DateTime DeliveryDate { get; set; } = DateTime.UtcNow;
    public string ReceiverName { get; set; } = string.Empty;
    public string ReceiverPhone { get; set; } = string.Empty;
    public string? DeliveryRemarks { get; set; }
    public IFormFile? ProofOfDeliveryFile { get; set; }
}

public class DeliveryDto
{
    public int Id { get; set; }
    public int ShipmentId { get; set; }
    public string ShipmentNumber { get; set; } = string.Empty;
    public string TrackingNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public DateTime DeliveryDate { get; set; }
    public string ReceiverName { get; set; } = string.Empty;
    public string ReceiverPhone { get; set; } = string.Empty;
    public string? DeliveryRemarks { get; set; }
    public string? ProofOfDeliveryFile { get; set; }
    public string? DeliveredBy { get; set; }
    public string? VehicleNumber { get; set; }
    public string? DriverName { get; set; }
}

public class DeliveryQueryParameters : PaginationParams
{
    public int? CustomerId { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}
