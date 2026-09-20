namespace LogiTrack.Application.DTOs.Report;

public class ShipmentReportItemDto
{
    public string ShipmentNumber { get; set; } = string.Empty;
    public string TrackingNumber { get; set; } = string.Empty;
    public string BookingNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? VehicleNumber { get; set; }
    public string? DriverName { get; set; }
    public decimal FreightAmount { get; set; }
    public DateTime BookingDate { get; set; }
    public DateTime? ActualDeliveryDate { get; set; }
    public bool IsDelivered => ActualDeliveryDate.HasValue;
}

public class FinancialReportItemDto
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public DateTime InvoiceDate { get; set; }
    public DateTime DueDate { get; set; }
    public decimal SubTotal { get; set; }
    public decimal Tax { get; set; }
    public decimal Discount { get; set; }
    public decimal Total { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal Balance { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class VehicleExpenseReportItemDto
{
    public string VehicleNumber { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
    public int CompletedTrips { get; set; }
    public decimal FuelExpenses { get; set; }
    public decimal TollExpenses { get; set; }
    public decimal MaintenanceExpenses { get; set; }
    public decimal OtherExpenses { get; set; }
    public decimal TotalExpenses => FuelExpenses + TollExpenses + MaintenanceExpenses + OtherExpenses;
}

public class DriverPerformanceReportItemDto
{
    public string DriverName { get; set; } = string.Empty;
    public string DriverCode { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string LicenseNumber { get; set; } = string.Empty;
    public int TotalAssignments { get; set; }
    public int CompletedDeliveries { get; set; }
    public decimal TotalAllowances { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class ReportFilterParams
{
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int? CustomerId { get; set; }
    public int? VehicleId { get; set; }
}
