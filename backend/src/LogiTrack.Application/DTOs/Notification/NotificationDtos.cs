using LogiTrack.Domain.Enums;

namespace LogiTrack.Application.DTOs.Notification;

public class NotificationDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public string TypeName => Type.ToString();
    public bool IsRead { get; set; }
    public string? TargetRole { get; set; }
    public string? ReferenceUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateNotificationDto
{
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; } = NotificationType.Info;
    public string? TargetRole { get; set; }
    public string? ReferenceUrl { get; set; }
}
