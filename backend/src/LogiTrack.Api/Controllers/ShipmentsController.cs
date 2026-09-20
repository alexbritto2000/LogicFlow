using System.Security.Claims;
using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Shipment;
using LogiTrack.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LogiTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShipmentsController : ControllerBase
{
    private readonly IShipmentService _shipmentService;

    public ShipmentsController(IShipmentService shipmentService)
    {
        _shipmentService = shipmentService;
    }

    [HttpGet]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<ShipmentDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetShipments([FromQuery] ShipmentQueryParameters queryParams, CancellationToken cancellationToken)
    {
        var result = await _shipmentService.GetShipmentsAsync(queryParams, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<ShipmentDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<ShipmentDetailDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetShipmentById(int id, CancellationToken cancellationToken)
    {
        var result = await _shipmentService.GetShipmentByIdAsync(id, cancellationToken);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpGet("track/{trackingNumber}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<TrackingResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<TrackingResultDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> TrackShipment(string trackingNumber, CancellationToken cancellationToken)
    {
        var result = await _shipmentService.TrackByNumberAsync(trackingNumber, cancellationToken);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin,Operations,Dispatcher")]
    [ProducesResponseType(typeof(ApiResponse<ShipmentDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<ShipmentDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateShipment([FromBody] CreateShipmentDto dto, CancellationToken cancellationToken)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var result = await _shipmentService.CreateShipmentAsync(dto, userName, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return CreatedAtAction(nameof(GetShipmentById), new { id = result.Data!.Id }, result);
    }

    [HttpPost("{id:int}/status")]
    [Authorize(Roles = "SuperAdmin,Admin,Operations,Dispatcher,Driver")]
    [ProducesResponseType(typeof(ApiResponse<ShipmentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<ShipmentDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateShipmentStatus(int id, [FromBody] UpdateShipmentStatusRequest request, CancellationToken cancellationToken)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var result = await _shipmentService.UpdateShipmentStatusAsync(id, request, userName, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}
