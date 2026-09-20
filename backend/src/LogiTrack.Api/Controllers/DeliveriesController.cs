using System.Security.Claims;
using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Delivery;
using LogiTrack.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LogiTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DeliveriesController : ControllerBase
{
    private readonly IDeliveryService _deliveryService;

    public DeliveriesController(IDeliveryService deliveryService)
    {
        _deliveryService = deliveryService;
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin,Dispatcher,Driver")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ApiResponse<DeliveryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<DeliveryDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RecordDelivery([FromForm] CreateDeliveryDto dto)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var result = await _deliveryService.RecordDeliveryAsync(dto, userName);
        return Ok(ApiResponse<DeliveryDto>.SuccessResult(result, "Delivery recorded successfully and assets released."));
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<DeliveryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDeliveries([FromQuery] DeliveryQueryParameters query)
    {
        var result = await _deliveryService.GetDeliveriesAsync(query);
        return Ok(ApiResponse<PagedResult<DeliveryDto>>.SuccessResult(result));
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<DeliveryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _deliveryService.GetDeliveryByIdAsync(id);
        if (result == null)
        {
            return NotFound(ApiResponse<DeliveryDto>.FailureResult("Delivery record not found."));
        }
        return Ok(ApiResponse<DeliveryDto>.SuccessResult(result));
    }

    [HttpGet("shipment/{shipmentId:int}")]
    [ProducesResponseType(typeof(ApiResponse<DeliveryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByShipment(int shipmentId)
    {
        var result = await _deliveryService.GetDeliveryByShipmentIdAsync(shipmentId);
        if (result == null)
        {
            return NotFound(ApiResponse<DeliveryDto>.FailureResult("No delivery record found for this shipment."));
        }
        return Ok(ApiResponse<DeliveryDto>.SuccessResult(result));
    }
}
