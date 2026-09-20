using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Auth;

namespace LogiTrack.Application.Interfaces;

public interface IAuthService
{
    Task<ApiResponse<LoginResponse>> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<LoginResponse>> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<UserProfileDto>> GetCurrentUserAsync(int userId, CancellationToken cancellationToken = default);
}
