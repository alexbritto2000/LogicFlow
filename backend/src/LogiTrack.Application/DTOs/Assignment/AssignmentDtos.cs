namespace LogiTrack.Application.DTOs.Assignment;

public class CreateAssignmentDto
{
    public int ShipmentId { get; set; }
    public int VehicleId { get; set; }
    public int DriverId { get; set; }
    public string? Notes { get; set; }
}

public class AssignmentDto
{
    public int Id { get; set; }
    public int ShipmentId { get; set; }
    public string ShipmentNumber { get; set; } = string.Empty;
    public string TrackingNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public int VehicleId { get; set; }
    public string VehicleNumber { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
    public int DriverId { get; set; }
    public string DriverName { get; set; } = string.Empty;
    public string DriverPhone { get; set; } = string.Empty;
    public DateTime AssignedDate { get; set; }
    public DateTime? ReleasedDate { get; set; }
    public bool IsActive { get; set; }
    public string? Notes { get; set; }
}

public class ReleaseAssignmentDto
{
    public string? Notes { get; set; }
}
