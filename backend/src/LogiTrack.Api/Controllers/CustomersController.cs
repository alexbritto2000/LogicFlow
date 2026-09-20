using System.Security.Claims;
using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Customer;
using LogiTrack.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LogiTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;

    public CustomersController(ICustomerService customerService)
    {
        _customerService = customerService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<CustomerDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCustomers([FromQuery] CustomerQueryParameters queryParams, CancellationToken cancellationToken)
    {
        var result = await _customerService.GetCustomersAsync(queryParams, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<CustomerDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<CustomerDetailDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCustomerById(int id, CancellationToken cancellationToken)
    {
        var result = await _customerService.GetCustomerByIdAsync(id, cancellationToken);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin,Operations")]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateCustomer([FromBody] CreateCustomerDto dto, CancellationToken cancellationToken)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var result = await _customerService.CreateCustomerAsync(dto, userName, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return CreatedAtAction(nameof(GetCustomerById), new { id = result.Data!.Id }, result);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "SuperAdmin,Admin,Operations")]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateCustomer(int id, [FromBody] UpdateCustomerDto dto, CancellationToken cancellationToken)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var result = await _customerService.UpdateCustomerAsync(id, dto, userName, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteCustomer(int id, CancellationToken cancellationToken)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var result = await _customerService.DeleteCustomerAsync(id, userName, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}
