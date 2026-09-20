using LogiTrack.Application.DTOs.Notification;

namespace LogiTrack.Application.Interfaces;

public interface INotificationService
{
    Task<List<NotificationDto>> GetNotificationsAsync(string? role = null, bool unreadOnly = false, int limit = 20);
    Task<int> GetUnreadCountAsync(string? role = null);
    Task<bool> MarkAsReadAsync(int id);
    Task<bool> MarkAllAsReadAsync(string? role = null);
    Task<int> SyncSystemAlertsAsync();
}
