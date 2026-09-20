using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Dashboard;
using LogiTrack.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LogiTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("summary")]
    [ProducesResponseType(typeof(ApiResponse<DashboardSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummary()
    {
        var result = await _dashboardService.GetSummaryAsync();
        return Ok(ApiResponse<DashboardSummaryDto>.SuccessResult(result));
    }

    [HttpGet("trends")]
    [ProducesResponseType(typeof(ApiResponse<List<MonthlyFinancialTrendDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTrends([FromQuery] int monthsCount = 6)
    {
        var result = await _dashboardService.GetFinancialTrendsAsync(monthsCount);
        return Ok(ApiResponse<List<MonthlyFinancialTrendDto>>.SuccessResult(result));
    }

    [HttpGet("distribution")]
    [ProducesResponseType(typeof(ApiResponse<List<StatusDistributionDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDistribution()
    {
        var result = await _dashboardService.GetShipmentDistributionAsync();
        return Ok(ApiResponse<List<StatusDistributionDto>>.SuccessResult(result));
    }

    [HttpGet("activities")]
    [ProducesResponseType(typeof(ApiResponse<List<RecentActivityDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActivities([FromQuery] int limit = 10)
    {
        var result = await _dashboardService.GetRecentActivitiesAsync(limit);
        return Ok(ApiResponse<List<RecentActivityDto>>.SuccessResult(result));
    }
}
