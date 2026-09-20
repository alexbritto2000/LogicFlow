using System.Security.Claims;
using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Document;
using LogiTrack.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LogiTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly IDocumentService _documentService;

    public DocumentsController(IDocumentService documentService)
    {
        _documentService = documentService;
    }

    [HttpGet("summary")]
    [ProducesResponseType(typeof(ApiResponse<DocumentSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummary(CancellationToken cancellationToken)
    {
        var result = await _documentService.GetDocumentSummaryAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("vehicle")]
    [ProducesResponseType(typeof(ApiResponse<List<DocumentItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetVehicleDocuments([FromQuery] int? vehicleId, CancellationToken cancellationToken)
    {
        var result = await _documentService.GetVehicleDocumentsAsync(vehicleId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("driver")]
    [ProducesResponseType(typeof(ApiResponse<List<DocumentItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDriverDocuments([FromQuery] int? driverId, CancellationToken cancellationToken)
    {
        var result = await _documentService.GetDriverDocumentsAsync(driverId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("expiring")]
    [ProducesResponseType(typeof(ApiResponse<List<DocumentItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetExpiringDocuments([FromQuery] int daysThreshold = 30, CancellationToken cancellationToken = default)
    {
        var result = await _documentService.GetExpiringDocumentsAsync(daysThreshold, cancellationToken);
        return Ok(result);
    }

    [HttpPost("vehicle")]
    [Authorize(Roles = "SuperAdmin,Admin,Dispatcher")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ApiResponse<DocumentItemDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<DocumentItemDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadVehicleDocument([FromForm] UploadVehicleDocumentDto dto, CancellationToken cancellationToken)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var result = await _documentService.UploadVehicleDocumentAsync(dto, userName, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpPost("driver")]
    [Authorize(Roles = "SuperAdmin,Admin,Dispatcher")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ApiResponse<DocumentItemDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<DocumentItemDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadDriverDocument([FromForm] UploadDriverDocumentDto dto, CancellationToken cancellationToken)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var result = await _documentService.UploadDriverDocumentAsync(dto, userName, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpDelete("vehicle/{id:int}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteVehicleDocument(int id, CancellationToken cancellationToken)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var result = await _documentService.DeleteVehicleDocumentAsync(id, userName, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("driver/{id:int}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteDriverDocument(int id, CancellationToken cancellationToken)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var result = await _documentService.DeleteDriverDocumentAsync(id, userName, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}
