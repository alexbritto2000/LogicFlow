using System.Security.Claims;
using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Assignment;
using LogiTrack.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LogiTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AssignmentsController : ControllerBase
{
    private readonly IAssignmentService _assignmentService;

    public AssignmentsController(IAssignmentService assignmentService)
    {
        _assignmentService = assignmentService;
    }

    [HttpGet("active")]
    [ProducesResponseType(typeof(ApiResponse<List<AssignmentDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActiveAssignments(CancellationToken cancellationToken)
    {
        var result = await _assignmentService.GetActiveAssignmentsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin,Dispatcher")]
    [ProducesResponseType(typeof(ApiResponse<AssignmentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AssignmentDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AssignFleet([FromBody] CreateAssignmentDto dto, CancellationToken cancellationToken)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var result = await _assignmentService.AssignFleetAsync(dto, userName, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("{id:int}/release")]
    [Authorize(Roles = "SuperAdmin,Admin,Dispatcher")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ReleaseAssignment(int id, [FromBody] ReleaseAssignmentDto dto, CancellationToken cancellationToken)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var result = await _assignmentService.ReleaseAssignmentAsync(id, dto, userName, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}
