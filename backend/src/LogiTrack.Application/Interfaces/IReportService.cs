using LogiTrack.Application.DTOs.Report;

namespace LogiTrack.Application.Interfaces;

public interface IReportService
{
    Task<List<ShipmentReportItemDto>> GetShipmentReportAsync(ReportFilterParams filters);
    Task<byte[]> ExportShipmentReportCsvAsync(ReportFilterParams filters);

    Task<List<FinancialReportItemDto>> GetFinancialReportAsync(ReportFilterParams filters);
    Task<byte[]> ExportFinancialReportCsvAsync(ReportFilterParams filters);

    Task<List<VehicleExpenseReportItemDto>> GetVehicleExpenseReportAsync(ReportFilterParams filters);
    Task<byte[]> ExportVehicleExpenseReportCsvAsync(ReportFilterParams filters);

    Task<List<DriverPerformanceReportItemDto>> GetDriverPerformanceReportAsync(ReportFilterParams filters);
    Task<byte[]> ExportDriverPerformanceReportCsvAsync(ReportFilterParams filters);
}
