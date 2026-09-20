using System.Security.Claims;
using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Payment;
using LogiTrack.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LogiTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<PaymentDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPayments([FromQuery] PaymentQueryParameters query)
    {
        var result = await _paymentService.GetPaymentsAsync(query);
        return Ok(ApiResponse<PagedResult<PaymentDto>>.SuccessResult(result));
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<PaymentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _paymentService.GetPaymentByIdAsync(id);
        if (result == null)
        {
            return NotFound(ApiResponse<PaymentDto>.FailureResult("Payment record not found."));
        }
        return Ok(ApiResponse<PaymentDto>.SuccessResult(result));
    }

    [HttpGet("invoice/{invoiceId:int}")]
    [ProducesResponseType(typeof(ApiResponse<List<PaymentDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByInvoice(int invoiceId)
    {
        var result = await _paymentService.GetPaymentsByInvoiceIdAsync(invoiceId);
        return Ok(ApiResponse<List<PaymentDto>>.SuccessResult(result));
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin,Accountant")]
    [ProducesResponseType(typeof(ApiResponse<PaymentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> RecordPayment([FromBody] CreatePaymentDto dto)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var result = await _paymentService.RecordPaymentAsync(dto, userName);
        return Ok(ApiResponse<PaymentDto>.SuccessResult(result, "Payment recorded successfully."));
    }
}
