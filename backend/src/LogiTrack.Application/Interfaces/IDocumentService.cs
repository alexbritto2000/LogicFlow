using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Document;

namespace LogiTrack.Application.Interfaces;

public interface IDocumentService
{
    Task<ApiResponse<DocumentSummaryDto>> GetDocumentSummaryAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<List<DocumentItemDto>>> GetVehicleDocumentsAsync(int? vehicleId = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<DocumentItemDto>>> GetDriverDocumentsAsync(int? driverId = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<DocumentItemDto>>> GetExpiringDocumentsAsync(int daysThreshold = 30, CancellationToken cancellationToken = default);
    Task<ApiResponse<DocumentItemDto>> UploadVehicleDocumentAsync(UploadVehicleDocumentDto dto, string? createdBy = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<DocumentItemDto>> UploadDriverDocumentAsync(UploadDriverDocumentDto dto, string? createdBy = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteVehicleDocumentAsync(int id, string? deletedBy = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteDriverDocumentAsync(int id, string? deletedBy = null, CancellationToken cancellationToken = default);
}
