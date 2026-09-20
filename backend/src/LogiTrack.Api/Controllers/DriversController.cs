using System.Security.Claims;
using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Driver;
using LogiTrack.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LogiTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DriversController : ControllerBase
{
    private readonly IDriverService _driverService;

    public DriversController(IDriverService driverService)
    {
        _driverService = driverService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<DriverDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDrivers([FromQuery] DriverQueryParameters queryParams, CancellationToken cancellationToken)
    {
        var result = await _driverService.GetDriversAsync(queryParams, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<DriverDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<DriverDetailDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDriverById(int id, CancellationToken cancellationToken)
    {
        var result = await _driverService.GetDriverByIdAsync(id, cancellationToken);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpGet("available")]
    [ProducesResponseType(typeof(ApiResponse<List<DriverDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailableDrivers(CancellationToken cancellationToken)
    {
        var result = await _driverService.GetAvailableDriversAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin,Dispatcher")]
    [ProducesResponseType(typeof(ApiResponse<DriverDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<DriverDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateDriver([FromBody] CreateDriverDto dto, CancellationToken cancellationToken)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var result = await _driverService.CreateDriverAsync(dto, userName, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return CreatedAtAction(nameof(GetDriverById), new { id = result.Data!.Id }, result);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "SuperAdmin,Admin,Dispatcher")]
    [ProducesResponseType(typeof(ApiResponse<DriverDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<DriverDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateDriver(int id, [FromBody] UpdateDriverDto dto, CancellationToken cancellationToken)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var result = await _driverService.UpdateDriverAsync(id, dto, userName, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteDriver(int id, CancellationToken cancellationToken)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var result = await _driverService.DeleteDriverAsync(id, userName, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}
