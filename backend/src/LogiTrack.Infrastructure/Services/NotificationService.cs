using LogiTrack.Application.DTOs.Notification;
using LogiTrack.Application.Interfaces;
using LogiTrack.Domain.Entities;
using LogiTrack.Domain.Enums;
using LogiTrack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LogiTrack.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly LogiTrackDbContext _context;

    public NotificationService(LogiTrackDbContext context)
    {
        _context = context;
    }

    public async Task<List<NotificationDto>> GetNotificationsAsync(string? role = null, bool unreadOnly = false, int limit = 20)
    {
        var query = _context.Notifications.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(role) && role != "SuperAdmin" && role != "Admin")
        {
            query = query.Where(n => n.TargetRole == null || n.TargetRole.Contains(role));
        }

        if (unreadOnly)
        {
            query = query.Where(n => !n.IsRead);
        }

        return await query
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                Title = n.Title,
                Message = n.Message,
                Type = n.Type,
                IsRead = n.IsRead,
                TargetRole = n.TargetRole,
                ReferenceUrl = n.ReferenceUrl,
                CreatedAt = n.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<int> GetUnreadCountAsync(string? role = null)
    {
        var query = _context.Notifications.AsNoTracking().Where(n => !n.IsRead);

        if (!string.IsNullOrWhiteSpace(role) && role != "SuperAdmin" && role != "Admin")
        {
            query = query.Where(n => n.TargetRole == null || n.TargetRole.Contains(role));
        }

        return await query.CountAsync();
    }

    public async Task<bool> MarkAsReadAsync(int id)
    {
        var notification = await _context.Notifications.FindAsync(id);
        if (notification == null) return false;

        notification.IsRead = true;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> MarkAllAsReadAsync(string? role = null)
    {
        var query = _context.Notifications.Where(n => !n.IsRead);

        if (!string.IsNullOrWhiteSpace(role) && role != "SuperAdmin" && role != "Admin")
        {
            query = query.Where(n => n.TargetRole == null || n.TargetRole.Contains(role));
        }

        var unread = await query.ToListAsync();
        foreach (var n in unread)
        {
            n.IsRead = true;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<int> SyncSystemAlertsAsync()
    {
        var now = DateTime.UtcNow;
        var thirtyDaysLater = now.AddDays(30);
        var oneDayAgo = now.AddDays(-1);
        int newAlerts = 0;

        // 1. Vehicle Documents
        var vehicleDocs = await _context.VehicleDocuments
            .Include(d => d.Vehicle)
            .Where(d => d.ExpiryDate <= thirtyDaysLater)
            .ToListAsync();

        foreach (var doc in vehicleDocs)
        {
            var isExpired = doc.ExpiryDate < now;
            var title = isExpired
                ? $"EXPIRED: {doc.DocumentType} for {doc.Vehicle.VehicleNumber}"
                : $"Expiring Soon: {doc.DocumentType} for {doc.Vehicle.VehicleNumber}";

            var alreadyAlerted = await _context.Notifications
                .AnyAsync(n => n.Title == title && n.CreatedAt >= oneDayAgo);

            if (!alreadyAlerted)
            {
                _context.Notifications.Add(new Notification
                {
                    Title = title,
                    Message = isExpired
                        ? $"Document expired on {doc.ExpiryDate:yyyy-MM-dd}. Fleet assignment is blocked until updated."
                        : $"Document expires on {doc.ExpiryDate:yyyy-MM-dd}. Please renew promptly.",
                    Type = isExpired ? NotificationType.Alert : NotificationType.Warning,
                    TargetRole = "Admin,Dispatcher,Operations",
                    ReferenceUrl = "/documents",
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                });
                newAlerts++;
            }
        }

        // 2. Driver Documents
        var driverDocs = await _context.DriverDocuments
            .Include(d => d.Driver)
            .Where(d => d.ExpiryDate <= thirtyDaysLater)
            .ToListAsync();

        foreach (var doc in driverDocs)
        {
            var isExpired = doc.ExpiryDate < now;
            var title = isExpired
                ? $"EXPIRED: {doc.DocumentType} for Driver {doc.Driver.Name}"
                : $"Expiring Soon: {doc.DocumentType} for Driver {doc.Driver.Name}";

            var alreadyAlerted = await _context.Notifications
                .AnyAsync(n => n.Title == title && n.CreatedAt >= oneDayAgo);

            if (!alreadyAlerted)
            {
                _context.Notifications.Add(new Notification
                {
                    Title = title,
                    Message = isExpired
                        ? $"License/Document expired on {doc.ExpiryDate:yyyy-MM-dd}. Driver assignment restricted."
                        : $"Document expires on {doc.ExpiryDate:yyyy-MM-dd}. Please arrange renewal.",
                    Type = isExpired ? NotificationType.Alert : NotificationType.Warning,
                    TargetRole = "Admin,Dispatcher,Operations",
                    ReferenceUrl = "/documents",
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                });
                newAlerts++;
            }
        }

        // 3. Overdue Invoices
        var overdueInvoices = await _context.Invoices
            .Include(i => i.Customer)
            .Where(i => i.DueDate < now && (i.Total - i.PaidAmount) > 0)
            .ToListAsync();

        foreach (var inv in overdueInvoices)
        {
            var title = $"Overdue Invoice: {inv.InvoiceNumber} ({inv.Customer.CompanyName})";
            var alreadyAlerted = await _context.Notifications
                .AnyAsync(n => n.Title == title && n.CreatedAt >= oneDayAgo);

            if (!alreadyAlerted)
            {
                var daysOverdue = (now - inv.DueDate).Days;
                _context.Notifications.Add(new Notification
                {
                    Title = title,
                    Message = $"Invoice is {daysOverdue} days past due date. Outstanding balance: ₹{inv.Balance:N2}.",
                    Type = NotificationType.Warning,
                    TargetRole = "Admin,Accountant",
                    ReferenceUrl = "/invoices",
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                });
                newAlerts++;
            }
        }

        if (newAlerts > 0)
        {
            await _context.SaveChangesAsync();
        }

        return newAlerts;
    }
}
