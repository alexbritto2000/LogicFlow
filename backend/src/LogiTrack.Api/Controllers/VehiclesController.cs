using System.Security.Claims;
using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Vehicle;
using LogiTrack.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LogiTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VehiclesController : ControllerBase
{
    private readonly IVehicleService _vehicleService;

    public VehiclesController(IVehicleService vehicleService)
    {
        _vehicleService = vehicleService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<VehicleDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetVehicles([FromQuery] VehicleQueryParameters queryParams, CancellationToken cancellationToken)
    {
        var result = await _vehicleService.GetVehiclesAsync(queryParams, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<VehicleDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<VehicleDetailDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetVehicleById(int id, CancellationToken cancellationToken)
    {
        var result = await _vehicleService.GetVehicleByIdAsync(id, cancellationToken);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpGet("available")]
    [ProducesResponseType(typeof(ApiResponse<List<VehicleDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailableVehicles(CancellationToken cancellationToken)
    {
        var result = await _vehicleService.GetAvailableVehiclesAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin,Dispatcher")]
    [ProducesResponseType(typeof(ApiResponse<VehicleDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<VehicleDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateVehicle([FromBody] CreateVehicleDto dto, CancellationToken cancellationToken)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var result = await _vehicleService.CreateVehicleAsync(dto, userName, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return CreatedAtAction(nameof(GetVehicleById), new { id = result.Data!.Id }, result);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "SuperAdmin,Admin,Dispatcher")]
    [ProducesResponseType(typeof(ApiResponse<VehicleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<VehicleDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateVehicle(int id, [FromBody] UpdateVehicleDto dto, CancellationToken cancellationToken)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var result = await _vehicleService.UpdateVehicleAsync(id, dto, userName, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteVehicle(int id, CancellationToken cancellationToken)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var result = await _vehicleService.DeleteVehicleAsync(id, userName, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}
