using System.Security.Claims;
using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Invoice;
using LogiTrack.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LogiTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InvoicesController : ControllerBase
{
    private readonly IInvoiceService _invoiceService;

    public InvoicesController(IInvoiceService invoiceService)
    {
        _invoiceService = invoiceService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<InvoiceDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInvoices([FromQuery] InvoiceQueryParameters query)
    {
        var result = await _invoiceService.GetInvoicesAsync(query);
        return Ok(ApiResponse<PagedResult<InvoiceDto>>.SuccessResult(result));
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<InvoiceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _invoiceService.GetInvoiceByIdAsync(id);
        if (result == null)
        {
            return NotFound(ApiResponse<InvoiceDto>.FailureResult("Invoice not found."));
        }
        return Ok(ApiResponse<InvoiceDto>.SuccessResult(result));
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin,Accountant")]
    [ProducesResponseType(typeof(ApiResponse<InvoiceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> CreateInvoice([FromBody] CreateInvoiceDto dto)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var result = await _invoiceService.CreateInvoiceAsync(dto, userName);
        return Ok(ApiResponse<InvoiceDto>.SuccessResult(result, "Invoice generated successfully."));
    }

    [HttpPost("from-booking/{bookingId:int}")]
    [Authorize(Roles = "SuperAdmin,Admin,Accountant")]
    [ProducesResponseType(typeof(ApiResponse<InvoiceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> CreateFromBooking(int bookingId, [FromQuery] decimal taxRatePercent = 18m, [FromQuery] decimal discount = 0m)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var result = await _invoiceService.CreateFromBookingAsync(bookingId, taxRatePercent, discount, userName);
        return Ok(ApiResponse<InvoiceDto>.SuccessResult(result, "Invoice generated from booking successfully."));
    }

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "SuperAdmin,Admin,Accountant")]
    [ProducesResponseType(typeof(ApiResponse<InvoiceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateInvoiceStatusDto dto)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var result = await _invoiceService.UpdateStatusAsync(id, dto.Status, userName);
        return Ok(ApiResponse<InvoiceDto>.SuccessResult(result, "Invoice status updated."));
    }
}
