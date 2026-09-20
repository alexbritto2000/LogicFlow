using LogiTrack.Application.Common;
using LogiTrack.Domain.Enums;
using Microsoft.AspNetCore.Http;

namespace LogiTrack.Application.DTOs.Expense;

public class CreateExpenseDto
{
    public int? VehicleId { get; set; }
    public int? ShipmentId { get; set; }
    public ExpenseType ExpenseType { get; set; } = ExpenseType.Fuel;
    public decimal Amount { get; set; }
    public DateTime ExpenseDate { get; set; } = DateTime.UtcNow;
    public string Description { get; set; } = string.Empty;
    public IFormFile? ReceiptFile { get; set; }
}

public class ExpenseDto
{
    public int Id { get; set; }
    public int? VehicleId { get; set; }
    public string? VehicleNumber { get; set; }
    public int? ShipmentId { get; set; }
    public string? ShipmentNumber { get; set; }
    public ExpenseType ExpenseType { get; set; }
    public string ExpenseTypeName => ExpenseType.ToString();
    public decimal Amount { get; set; }
    public DateTime ExpenseDate { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? ReceiptFile { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
}

public class ExpenseSummaryDto
{
    public decimal TotalExpenses { get; set; }
    public decimal FuelExpenses { get; set; }
    public decimal TollExpenses { get; set; }
    public decimal MaintenanceExpenses { get; set; }
    public decimal DriverAllowanceExpenses { get; set; }
    public decimal OtherExpenses { get; set; }
}

public class ExpenseQueryParameters : PaginationParams
{
    public int? VehicleId { get; set; }
    public int? ShipmentId { get; set; }
    public ExpenseType? ExpenseType { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}
