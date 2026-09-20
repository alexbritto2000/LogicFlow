using LogiTrack.Application.Common;
using LogiTrack.Domain.Enums;

namespace LogiTrack.Application.DTOs.Shipment;

public class ShipmentDto
{
    public int Id { get; set; }
    public string ShipmentNumber { get; set; } = string.Empty;
    public int BookingId { get; set; }
    public string BookingNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string TrackingNumber { get; set; } = string.Empty;
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public string CurrentLocation { get; set; } = string.Empty;
    public ShipmentStatus CurrentStatus { get; set; }
    public string StatusName => CurrentStatus.ToString();
    public DateTime EstimatedDeliveryDate { get; set; }
    public DateTime? ActualDeliveryDate { get; set; }
    public string? AssignedVehicleNumber { get; set; }
    public string? AssignedDriverName { get; set; }
    public string? AssignedDriverPhone { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ShipmentDetailDto : ShipmentDto
{
    public string PickupAddress { get; set; } = string.Empty;
    public string DeliveryAddress { get; set; } = string.Empty;
    public string CargoDescription { get; set; } = string.Empty;
    public decimal CargoWeight { get; set; }
    public int NumberOfPackages { get; set; }
    public decimal FreightAmount { get; set; }
    public List<ShipmentStatusHistoryDto> StatusHistories { get; set; } = new();
    public List<ShipmentAssignmentHistoryDto> AssignmentHistories { get; set; } = new();
    public DeliveryInfoSummaryDto? DeliveryInfo { get; set; }
}

public class ShipmentStatusHistoryDto
{
    public int Id { get; set; }
    public ShipmentStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public string Location { get; set; } = string.Empty;
    public string? Remarks { get; set; }
    public string? UpdatedBy { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class ShipmentAssignmentHistoryDto
{
    public int Id { get; set; }
    public int VehicleId { get; set; }
    public string VehicleNumber { get; set; } = string.Empty;
    public int DriverId { get; set; }
    public string DriverName { get; set; } = string.Empty;
    public string DriverPhone { get; set; } = string.Empty;
    public DateTime AssignedDate { get; set; }
    public DateTime? ReleasedDate { get; set; }
    public bool IsActive { get; set; }
    public string? Notes { get; set; }
}

public class DeliveryInfoSummaryDto
{
    public DateTime DeliveryDate { get; set; }
    public string ReceiverName { get; set; } = string.Empty;
    public string ReceiverPhone { get; set; } = string.Empty;
    public string? DeliveryRemarks { get; set; }
    public string? ProofOfDeliveryFile { get; set; }
    public string? DeliveredBy { get; set; }
}

public class CreateShipmentDto
{
    public int BookingId { get; set; }
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public string CurrentLocation { get; set; } = string.Empty;
    public DateTime EstimatedDeliveryDate { get; set; }
}

public class UpdateShipmentStatusRequest
{
    public ShipmentStatus Status { get; set; }
    public string Location { get; set; } = string.Empty;
    public string? Remarks { get; set; }
}

public class TrackingResultDto
{
    public string TrackingNumber { get; set; } = string.Empty;
    public string ShipmentNumber { get; set; } = string.Empty;
    public string BookingNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public string CurrentLocation { get; set; } = string.Empty;
    public string CurrentStatus { get; set; } = string.Empty;
    public DateTime EstimatedDeliveryDate { get; set; }
    public DateTime? ActualDeliveryDate { get; set; }
    public string? AssignedVehicle { get; set; }
    public string? AssignedDriver { get; set; }
    public List<ShipmentStatusHistoryDto> Timeline { get; set; } = new();
}

public class ShipmentQueryParameters : PaginationParams
{
    public int? BookingId { get; set; }
    public ShipmentStatus? Status { get; set; }
    public int? VehicleId { get; set; }
    public int? DriverId { get; set; }
}
