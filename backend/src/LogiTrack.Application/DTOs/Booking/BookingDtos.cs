using LogiTrack.Application.Common;
using LogiTrack.Domain.Enums;

namespace LogiTrack.Application.DTOs.Booking;

public class BookingDto
{
    public int Id { get; set; }
    public string BookingNumber { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerCode { get; set; } = string.Empty;
    public DateTime BookingDate { get; set; }
    public string PickupAddress { get; set; } = string.Empty;
    public string PickupCity { get; set; } = string.Empty;
    public string DeliveryAddress { get; set; } = string.Empty;
    public string DeliveryCity { get; set; } = string.Empty;
    public DateTime PickupDate { get; set; }
    public DateTime ExpectedDeliveryDate { get; set; }
    public string CargoDescription { get; set; } = string.Empty;
    public decimal CargoWeight { get; set; }
    public int NumberOfPackages { get; set; }
    public string? SpecialInstructions { get; set; }
    public decimal FreightAmount { get; set; }
    public string PaymentType { get; set; } = string.Empty;
    public BookingStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public int ShipmentsCount { get; set; }
    public bool IsActive { get; set; }
}

public class BookingDetailDto : BookingDto
{
    public List<BookingShipmentSummaryDto> Shipments { get; set; } = new();
}

public class BookingShipmentSummaryDto
{
    public int Id { get; set; }
    public string ShipmentNumber { get; set; } = string.Empty;
    public string TrackingNumber { get; set; } = string.Empty;
    public string CurrentLocation { get; set; } = string.Empty;
    public string CurrentStatus { get; set; } = string.Empty;
    public DateTime EstimatedDeliveryDate { get; set; }
    public string? AssignedVehicle { get; set; }
    public string? AssignedDriver { get; set; }
}

public class CreateBookingDto
{
    public int CustomerId { get; set; }
    public string PickupAddress { get; set; } = string.Empty;
    public string PickupCity { get; set; } = string.Empty;
    public string DeliveryAddress { get; set; } = string.Empty;
    public string DeliveryCity { get; set; } = string.Empty;
    public DateTime PickupDate { get; set; }
    public DateTime ExpectedDeliveryDate { get; set; }
    public string CargoDescription { get; set; } = string.Empty;
    public decimal CargoWeight { get; set; }
    public int NumberOfPackages { get; set; }
    public string? SpecialInstructions { get; set; }
    public decimal FreightAmount { get; set; }
    public string PaymentType { get; set; } = "Prepaid";
    public bool AutoCreateShipment { get; set; } = true;
}

public class UpdateBookingStatusDto
{
    public BookingStatus Status { get; set; }
    public string? Remarks { get; set; }
}

public class BookingQueryParameters : PaginationParams
{
    public int? CustomerId { get; set; }
    public BookingStatus? Status { get; set; }
    public string? OriginCity { get; set; }
    public string? DestinationCity { get; set; }
}
