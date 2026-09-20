using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Report;
using LogiTrack.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LogiTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("shipments")]
    [ProducesResponseType(typeof(ApiResponse<List<ShipmentReportItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetShipments([FromQuery] ReportFilterParams filters)
    {
        var result = await _reportService.GetShipmentReportAsync(filters);
        return Ok(ApiResponse<List<ShipmentReportItemDto>>.SuccessResult(result));
    }

    [HttpGet("shipments/export")]
    public async Task<IActionResult> ExportShipments([FromQuery] ReportFilterParams filters)
    {
        var csv = await _reportService.ExportShipmentReportCsvAsync(filters);
        return File(csv, "text/csv", $"Shipments_Report_{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    [HttpGet("financial")]
    [ProducesResponseType(typeof(ApiResponse<List<FinancialReportItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFinancial([FromQuery] ReportFilterParams filters)
    {
        var result = await _reportService.GetFinancialReportAsync(filters);
        return Ok(ApiResponse<List<FinancialReportItemDto>>.SuccessResult(result));
    }

    [HttpGet("financial/export")]
    public async Task<IActionResult> ExportFinancial([FromQuery] ReportFilterParams filters)
    {
        var csv = await _reportService.ExportFinancialReportCsvAsync(filters);
        return File(csv, "text/csv", $"Financial_Report_{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    [HttpGet("vehicles")]
    [ProducesResponseType(typeof(ApiResponse<List<VehicleExpenseReportItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetVehicles([FromQuery] ReportFilterParams filters)
    {
        var result = await _reportService.GetVehicleExpenseReportAsync(filters);
        return Ok(ApiResponse<List<VehicleExpenseReportItemDto>>.SuccessResult(result));
    }

    [HttpGet("vehicles/export")]
    public async Task<IActionResult> ExportVehicles([FromQuery] ReportFilterParams filters)
    {
        var csv = await _reportService.ExportVehicleExpenseReportCsvAsync(filters);
        return File(csv, "text/csv", $"Vehicle_Expenses_Report_{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    [HttpGet("drivers")]
    [ProducesResponseType(typeof(ApiResponse<List<DriverPerformanceReportItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDrivers([FromQuery] ReportFilterParams filters)
    {
        var result = await _reportService.GetDriverPerformanceReportAsync(filters);
        return Ok(ApiResponse<List<DriverPerformanceReportItemDto>>.SuccessResult(result));
    }

    [HttpGet("drivers/export")]
    public async Task<IActionResult> ExportDrivers([FromQuery] ReportFilterParams filters)
    {
        var csv = await _reportService.ExportDriverPerformanceReportCsvAsync(filters);
        return File(csv, "text/csv", $"Driver_Performance_Report_{DateTime.UtcNow:yyyyMMdd}.csv");
    }
}
