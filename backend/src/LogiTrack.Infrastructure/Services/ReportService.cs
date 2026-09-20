using System.Text;
using LogiTrack.Application.DTOs.Report;
using LogiTrack.Application.Interfaces;
using LogiTrack.Domain.Enums;
using LogiTrack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LogiTrack.Infrastructure.Services;

public class ReportService : IReportService
{
    private readonly LogiTrackDbContext _context;

    public ReportService(LogiTrackDbContext context)
    {
        _context = context;
    }

    public async Task<List<ShipmentReportItemDto>> GetShipmentReportAsync(ReportFilterParams filters)
    {
        var query = _context.Shipments
            .AsNoTracking()
            .Include(s => s.Booking)
                .ThenInclude(b => b.Customer)
            .Include(s => s.VehicleAssignments)
                .ThenInclude(va => va.Vehicle)
            .Include(s => s.VehicleAssignments)
                .ThenInclude(va => va.Driver)
            .AsQueryable();

        if (filters.FromDate.HasValue)
        {
            query = query.Where(s => s.CreatedAt >= filters.FromDate.Value);
        }

        if (filters.ToDate.HasValue)
        {
            query = query.Where(s => s.CreatedAt <= filters.ToDate.Value);
        }

        if (filters.CustomerId.HasValue)
        {
            query = query.Where(s => s.Booking.CustomerId == filters.CustomerId.Value);
        }

        var list = await query
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new ShipmentReportItemDto
            {
                ShipmentNumber = s.ShipmentNumber,
                TrackingNumber = s.TrackingNumber,
                BookingNumber = s.Booking.BookingNumber,
                CustomerName = s.Booking.Customer.CompanyName,
                Origin = s.Origin,
                Destination = s.Destination,
                Status = s.CurrentStatus.ToString(),
                VehicleNumber = s.VehicleAssignments.OrderByDescending(va => va.AssignedDate).Select(va => va.Vehicle.VehicleNumber).FirstOrDefault(),
                DriverName = s.VehicleAssignments.OrderByDescending(va => va.AssignedDate).Select(va => va.Driver.Name).FirstOrDefault(),
                FreightAmount = s.Booking.FreightAmount,
                BookingDate = s.Booking.BookingDate,
                ActualDeliveryDate = s.ActualDeliveryDate
            })
            .ToListAsync();

        return list;
    }

    public async Task<byte[]> ExportShipmentReportCsvAsync(ReportFilterParams filters)
    {
        var items = await GetShipmentReportAsync(filters);
        var sb = new StringBuilder();
        sb.AppendLine("Shipment Number,Tracking Number,Booking Number,Customer,Origin,Destination,Status,Vehicle,Driver,Freight Amount,Booking Date,Delivered Date");

        foreach (var item in items)
        {
            sb.AppendLine($"\"{EscapeCsv(item.ShipmentNumber)}\",\"{EscapeCsv(item.TrackingNumber)}\",\"{EscapeCsv(item.BookingNumber)}\",\"{EscapeCsv(item.CustomerName)}\",\"{EscapeCsv(item.Origin)}\",\"{EscapeCsv(item.Destination)}\",\"{EscapeCsv(item.Status)}\",\"{EscapeCsv(item.VehicleNumber ?? "N/A")}\",\"{EscapeCsv(item.DriverName ?? "N/A")}\",{item.FreightAmount:F2},\"{item.BookingDate:yyyy-MM-dd}\",\"{item.ActualDeliveryDate?.ToString("yyyy-MM-dd") ?? "Pending"}\"");
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public async Task<List<FinancialReportItemDto>> GetFinancialReportAsync(ReportFilterParams filters)
    {
        var query = _context.Invoices
            .AsNoTracking()
            .Include(i => i.Customer)
            .AsQueryable();

        if (filters.FromDate.HasValue)
        {
            query = query.Where(i => i.InvoiceDate >= filters.FromDate.Value);
        }

        if (filters.ToDate.HasValue)
        {
            query = query.Where(i => i.InvoiceDate <= filters.ToDate.Value);
        }

        if (filters.CustomerId.HasValue)
        {
            query = query.Where(i => i.CustomerId == filters.CustomerId.Value);
        }

        var list = await query
            .OrderByDescending(i => i.InvoiceDate)
            .Select(i => new FinancialReportItemDto
            {
                InvoiceNumber = i.InvoiceNumber,
                CustomerName = i.Customer.CompanyName,
                InvoiceDate = i.InvoiceDate,
                DueDate = i.DueDate,
                SubTotal = i.SubTotal,
                Tax = i.Tax,
                Discount = i.Discount,
                Total = i.Total,
                PaidAmount = i.PaidAmount,
                Balance = i.Balance,
                Status = i.Status.ToString()
            })
            .ToListAsync();

        return list;
    }

    public async Task<byte[]> ExportFinancialReportCsvAsync(ReportFilterParams filters)
    {
        var items = await GetFinancialReportAsync(filters);
        var sb = new StringBuilder();
        sb.AppendLine("Invoice Number,Customer Name,Invoice Date,Due Date,SubTotal,Tax,Discount,Grand Total,Paid Amount,Balance Due,Status");

        foreach (var item in items)
        {
            sb.AppendLine($"\"{EscapeCsv(item.InvoiceNumber)}\",\"{EscapeCsv(item.CustomerName)}\",\"{item.InvoiceDate:yyyy-MM-dd}\",\"{item.DueDate:yyyy-MM-dd}\",{item.SubTotal:F2},{item.Tax:F2},{item.Discount:F2},{item.Total:F2},{item.PaidAmount:F2},{item.Balance:F2},\"{EscapeCsv(item.Status)}\"");
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public async Task<List<VehicleExpenseReportItemDto>> GetVehicleExpenseReportAsync(ReportFilterParams filters)
    {
        var vehicles = await _context.Vehicles
            .AsNoTracking()
            .Include(v => v.Assignments)
            .Include(v => v.Expenses)
            .ToListAsync();

        return vehicles.Select(v => new VehicleExpenseReportItemDto
        {
            VehicleNumber = v.VehicleNumber,
            VehicleType = v.VehicleType,
            CompletedTrips = v.Assignments.Count,
            FuelExpenses = v.Expenses.Where(e => e.ExpenseType == ExpenseType.Fuel).Sum(e => e.Amount),
            TollExpenses = v.Expenses.Where(e => e.ExpenseType == ExpenseType.Toll).Sum(e => e.Amount),
            MaintenanceExpenses = v.Expenses.Where(e => e.ExpenseType == ExpenseType.Maintenance).Sum(e => e.Amount),
            OtherExpenses = v.Expenses.Where(e => e.ExpenseType == ExpenseType.DriverAllowance || e.ExpenseType == ExpenseType.Parking || e.ExpenseType == ExpenseType.Other).Sum(e => e.Amount)
        }).ToList();
    }

    public async Task<byte[]> ExportVehicleExpenseReportCsvAsync(ReportFilterParams filters)
    {
        var items = await GetVehicleExpenseReportAsync(filters);
        var sb = new StringBuilder();
        sb.AppendLine("Vehicle Number,Vehicle Type,Completed Trips,Fuel Expenses,Toll Expenses,Maintenance Expenses,Other Expenses,Total Expenses");

        foreach (var item in items)
        {
            sb.AppendLine($"\"{EscapeCsv(item.VehicleNumber)}\",\"{EscapeCsv(item.VehicleType)}\",{item.CompletedTrips},{item.FuelExpenses:F2},{item.TollExpenses:F2},{item.MaintenanceExpenses:F2},{item.OtherExpenses:F2},{item.TotalExpenses:F2}");
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public async Task<List<DriverPerformanceReportItemDto>> GetDriverPerformanceReportAsync(ReportFilterParams filters)
    {
        var drivers = await _context.Drivers
            .AsNoTracking()
            .Include(d => d.Assignments)
                .ThenInclude(a => a.Shipment)
            .ToListAsync();

        return drivers.Select(d => new DriverPerformanceReportItemDto
        {
            DriverName = d.Name,
            DriverCode = d.DriverCode,
            Phone = d.Phone,
            LicenseNumber = d.DrivingLicenseNumber,
            TotalAssignments = d.Assignments.Count,
            CompletedDeliveries = d.Assignments.Count(a => a.Shipment != null && a.Shipment.CurrentStatus == ShipmentStatus.Delivered),
            TotalAllowances = 0m,
            Status = d.Status.ToString()
        }).ToList();
    }

    public async Task<byte[]> ExportDriverPerformanceReportCsvAsync(ReportFilterParams filters)
    {
        var items = await GetDriverPerformanceReportAsync(filters);
        var sb = new StringBuilder();
        sb.AppendLine("Driver Name,Driver Code,Phone,License Number,Total Assignments,Completed Deliveries,Status");

        foreach (var item in items)
        {
            sb.AppendLine($"\"{EscapeCsv(item.DriverName)}\",\"{EscapeCsv(item.DriverCode)}\",\"{EscapeCsv(item.Phone)}\",\"{EscapeCsv(item.LicenseNumber)}\",{item.TotalAssignments},{item.CompletedDeliveries},\"{EscapeCsv(item.Status)}\"");
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private static string EscapeCsv(string val)
    {
        return val.Replace("\"", "\"\"");
    }
}
