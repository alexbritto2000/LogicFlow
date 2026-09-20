namespace LogiTrack.Application.DTOs.Dashboard;

public class DashboardSummaryDto
{
    // Fleet
    public int TotalVehicles { get; set; }
    public int AvailableVehicles { get; set; }
    public int AssignedVehicles { get; set; }
    public int InTransitVehicles { get; set; }
    public int MaintenanceVehicles { get; set; }

    // Drivers
    public int TotalDrivers { get; set; }
    public int AvailableDrivers { get; set; }
    public int AssignedDrivers { get; set; }
    public int OnLeaveDrivers { get; set; }

    // Customers & Bookings
    public int TotalCustomers { get; set; }
    public int TotalBookings { get; set; }
    public int ActiveShipments { get; set; }
    public int DeliveredToday { get; set; }

    // Finance
    public decimal TotalRevenue { get; set; }
    public decimal TotalCollected { get; set; }
    public decimal OutstandingReceivables { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal NetProfit => TotalRevenue - TotalExpenses;

    // Compliance / Alerts
    public int ExpiredDocuments { get; set; }
    public int ExpiringSoonDocuments { get; set; }
}

public class MonthlyFinancialTrendDto
{
    public string Month { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public decimal Expenses { get; set; }
    public decimal Profit => Revenue - Expenses;
}

public class StatusDistributionDto
{
    public string Status { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class RecentActivityDto
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty; // Shipment, Delivery, Payment, Expense
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string? ReferenceId { get; set; }
}
