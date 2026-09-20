using System.Security.Claims;
using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Notification;
using LogiTrack.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LogiTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<NotificationDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNotifications([FromQuery] bool unreadOnly = false, [FromQuery] int limit = 20)
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        var result = await _notificationService.GetNotificationsAsync(role, unreadOnly, limit);
        return Ok(ApiResponse<List<NotificationDto>>.SuccessResult(result));
    }

    [HttpGet("unread-count")]
    [ProducesResponseType(typeof(ApiResponse<int>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUnreadCount()
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        var count = await _notificationService.GetUnreadCountAsync(role);
        return Ok(ApiResponse<int>.SuccessResult(count));
    }

    [HttpPost("{id:int}/read")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var result = await _notificationService.MarkAsReadAsync(id);
        return Ok(ApiResponse<bool>.SuccessResult(result));
    }

    [HttpPost("mark-all-read")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        var result = await _notificationService.MarkAllAsReadAsync(role);
        return Ok(ApiResponse<bool>.SuccessResult(result, "All notifications marked as read."));
    }

    [HttpPost("sync-alerts")]
    [ProducesResponseType(typeof(ApiResponse<int>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SyncAlerts()
    {
        var count = await _notificationService.SyncSystemAlertsAsync();
        return Ok(ApiResponse<int>.SuccessResult(count, $"Generated {count} new system alert notifications."));
    }
}
