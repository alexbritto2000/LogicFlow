using System.Security.Claims;
using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Booking;
using LogiTrack.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LogiTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _bookingService;

    public BookingsController(IBookingService bookingService)
    {
        _bookingService = bookingService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<BookingDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBookings([FromQuery] BookingQueryParameters queryParams, CancellationToken cancellationToken)
    {
        var result = await _bookingService.GetBookingsAsync(queryParams, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<BookingDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<BookingDetailDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBookingById(int id, CancellationToken cancellationToken)
    {
        var result = await _bookingService.GetBookingByIdAsync(id, cancellationToken);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin,Operations")]
    [ProducesResponseType(typeof(ApiResponse<BookingDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<BookingDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingDto dto, CancellationToken cancellationToken)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var result = await _bookingService.CreateBookingAsync(dto, userName, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return CreatedAtAction(nameof(GetBookingById), new { id = result.Data!.Id }, result);
    }

    [HttpPut("{id:int}/status")]
    [Authorize(Roles = "SuperAdmin,Admin,Operations,Dispatcher")]
    [ProducesResponseType(typeof(ApiResponse<BookingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<BookingDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateBookingStatus(int id, [FromBody] UpdateBookingStatusDto dto, CancellationToken cancellationToken)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var result = await _bookingService.UpdateBookingStatusAsync(id, dto, userName, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "SuperAdmin,Admin,Operations")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CancelBooking(int id, CancellationToken cancellationToken)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var result = await _bookingService.CancelBookingAsync(id, userName, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}
