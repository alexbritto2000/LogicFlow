using LogiTrack.Application.DTOs.Dashboard;

namespace LogiTrack.Application.Interfaces;

public interface IDashboardService
{
    Task<DashboardSummaryDto> GetSummaryAsync();
    Task<List<MonthlyFinancialTrendDto>> GetFinancialTrendsAsync(int monthsCount = 6);
    Task<List<StatusDistributionDto>> GetShipmentDistributionAsync();
    Task<List<RecentActivityDto>> GetRecentActivitiesAsync(int limit = 10);
}
