using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.User;

namespace LogiTrack.Application.Interfaces;

public interface IUserService
{
    Task<PagedResult<UserDto>> GetUsersAsync(UserQueryParameters query);
    Task<UserDto?> GetUserByIdAsync(int id);
    Task<UserDto> CreateUserAsync(CreateUserDto dto, string? createdBy = null);
    Task<UserDto> UpdateUserAsync(int id, UpdateUserDto dto, string? updatedBy = null);
    Task<bool> ResetPasswordAsync(int id, string newPassword, string? updatedBy = null);
    Task<bool> DeleteUserAsync(int id, string? deletedBy = null);
    Task<List<RoleDto>> GetRolesAsync();
}
