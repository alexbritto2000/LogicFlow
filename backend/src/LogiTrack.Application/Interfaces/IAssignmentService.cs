using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Assignment;

namespace LogiTrack.Application.Interfaces;

public interface IAssignmentService
{
    Task<ApiResponse<List<AssignmentDto>>> GetActiveAssignmentsAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<AssignmentDto>> AssignFleetAsync(CreateAssignmentDto dto, string? assignedBy = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> ReleaseAssignmentAsync(int assignmentId, ReleaseAssignmentDto dto, string? releasedBy = null, CancellationToken cancellationToken = default);
}
