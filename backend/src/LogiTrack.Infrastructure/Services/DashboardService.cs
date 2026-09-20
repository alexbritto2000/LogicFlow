using System.Globalization;
using LogiTrack.Application.DTOs.Dashboard;
using LogiTrack.Application.Interfaces;
using LogiTrack.Domain.Enums;
using LogiTrack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LogiTrack.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly LogiTrackDbContext _context;

    public DashboardService(LogiTrackDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardSummaryDto> GetSummaryAsync()
    {
        var now = DateTime.UtcNow;
        var today = DateTime.UtcNow.Date;
        var thirtyDaysLater = now.AddDays(30);

        // Vehicles
        var vehicles = await _context.Vehicles.AsNoTracking().ToListAsync();
        var totalVehicles = vehicles.Count;
        var availVehicles = vehicles.Count(v => v.Status == VehicleStatus.Available);
        var assignedVehicles = vehicles.Count(v => v.Status == VehicleStatus.Assigned);
        var inTransitVehicles = vehicles.Count(v => v.Status == VehicleStatus.InTransit);
        var maintVehicles = vehicles.Count(v => v.Status == VehicleStatus.Maintenance);

        // Drivers
        var drivers = await _context.Drivers.AsNoTracking().ToListAsync();
        var totalDrivers = drivers.Count;
        var availDrivers = drivers.Count(d => d.Status == DriverStatus.Available);
        var assignedDrivers = drivers.Count(d => d.Status == DriverStatus.Assigned);
        var onLeaveDrivers = drivers.Count(d => d.Status == DriverStatus.OnLeave);

        // Customers & Bookings
        var totalCustomers = await _context.Customers.CountAsync();
        var totalBookings = await _context.Bookings.CountAsync();

        // Shipments
        var shipments = await _context.Shipments.AsNoTracking().ToListAsync();
        var activeShipments = shipments.Count(s => s.CurrentStatus != ShipmentStatus.Delivered && s.CurrentStatus != ShipmentStatus.Cancelled);
        var deliveredToday = shipments.Count(s => s.CurrentStatus == ShipmentStatus.Delivered && s.ActualDeliveryDate.HasValue && s.ActualDeliveryDate.Value >= today);

        // Financials
        var invoices = await _context.Invoices.AsNoTracking().ToListAsync();
        var totalRevenue = invoices.Sum(i => i.Total);
        var outstandingReceivables = invoices.Sum(i => i.Balance);

        var payments = await _context.Payments.AsNoTracking().ToListAsync();
        var totalCollected = payments.Sum(p => p.Amount);

        var expenses = await _context.Expenses.AsNoTracking().ToListAsync();
        var totalExpenses = expenses.Sum(e => e.Amount);

        // Compliance
        var vDocs = await _context.VehicleDocuments.AsNoTracking().ToListAsync();
        var dDocs = await _context.DriverDocuments.AsNoTracking().ToListAsync();

        var expiredDocs = vDocs.Count(d => d.ExpiryDate < now) + dDocs.Count(d => d.ExpiryDate < now);
        var expiringSoonDocs = vDocs.Count(d => d.ExpiryDate >= now && d.ExpiryDate <= thirtyDaysLater) +
                               dDocs.Count(d => d.ExpiryDate >= now && d.ExpiryDate <= thirtyDaysLater);

        return new DashboardSummaryDto
        {
            TotalVehicles = totalVehicles,
            AvailableVehicles = availVehicles,
            AssignedVehicles = assignedVehicles,
            InTransitVehicles = inTransitVehicles,
            MaintenanceVehicles = maintVehicles,

            TotalDrivers = totalDrivers,
            AvailableDrivers = availDrivers,
            AssignedDrivers = assignedDrivers,
            OnLeaveDrivers = onLeaveDrivers,

            TotalCustomers = totalCustomers,
            TotalBookings = totalBookings,
            ActiveShipments = activeShipments,
            DeliveredToday = deliveredToday,

            TotalRevenue = totalRevenue,
            TotalCollected = totalCollected,
            OutstandingReceivables = outstandingReceivables,
            TotalExpenses = totalExpenses,

            ExpiredDocuments = expiredDocs,
            ExpiringSoonDocuments = expiringSoonDocs
        };
    }

    public async Task<List<MonthlyFinancialTrendDto>> GetFinancialTrendsAsync(int monthsCount = 6)
    {
        var trends = new List<MonthlyFinancialTrendDto>();
        var now = DateTime.UtcNow;

        for (int i = monthsCount - 1; i >= 0; i--)
        {
            var targetMonth = now.AddMonths(-i);
            var startOfMonth = new DateTime(targetMonth.Year, targetMonth.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var endOfMonth = startOfMonth.AddMonths(1).AddTicks(-1);

            var revenue = await _context.Invoices
                .AsNoTracking()
                .Where(inv => inv.InvoiceDate >= startOfMonth && inv.InvoiceDate <= endOfMonth)
                .SumAsync(inv => (decimal?)inv.Total) ?? 0m;

            // Also check payments in that month if invoices are not yet generated
            var payments = await _context.Payments
                .AsNoTracking()
                .Where(p => p.PaymentDate >= startOfMonth && p.PaymentDate <= endOfMonth)
                .SumAsync(p => (decimal?)p.Amount) ?? 0m;

            var expenses = await _context.Expenses
                .AsNoTracking()
                .Where(e => e.ExpenseDate >= startOfMonth && e.ExpenseDate <= endOfMonth)
                .SumAsync(e => (decimal?)e.Amount) ?? 0m;

            var monthRev = revenue > 0 ? revenue : payments;

            trends.Add(new MonthlyFinancialTrendDto
            {
                Month = targetMonth.ToString("MMM yyyy", CultureInfo.InvariantCulture),
                Revenue = monthRev,
                Expenses = expenses
            });
        }

        return trends;
    }

    public async Task<List<StatusDistributionDto>> GetShipmentDistributionAsync()
    {
        var groups = await _context.Shipments
            .AsNoTracking()
            .GroupBy(s => s.CurrentStatus)
            .Select(g => new
            {
                Status = g.Key,
                Count = g.Count()
            })
            .ToListAsync();

        return groups.Select(g => new StatusDistributionDto
        {
            Status = g.Status.ToString(),
            Count = g.Count
        }).ToList();
    }

    public async Task<List<RecentActivityDto>> GetRecentActivitiesAsync(int limit = 10)
    {
        var auditLogs = await _context.AuditLogs
            .AsNoTracking()
            .OrderByDescending(a => a.Timestamp)
            .Take(limit)
            .Select(a => new RecentActivityDto
            {
                Id = a.Id,
                Type = a.Entity,
                Title = a.Action.Replace("_", " "),
                Description = a.Details ?? $"Action performed by {a.UserName ?? "System"}",
                Timestamp = a.Timestamp,
                ReferenceId = a.EntityId
            })
            .ToListAsync();

        return auditLogs;
    }
}
