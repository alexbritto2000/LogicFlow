using System.Security.Claims;
using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.User;
using LogiTrack.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LogiTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<UserDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsers([FromQuery] UserQueryParameters query)
    {
        var result = await _userService.GetUsersAsync(query);
        return Ok(ApiResponse<PagedResult<UserDto>>.SuccessResult(result));
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _userService.GetUserByIdAsync(id);
        if (result == null)
        {
            return NotFound(ApiResponse<UserDto>.FailureResult("User not found."));
        }
        return Ok(ApiResponse<UserDto>.SuccessResult(result));
    }

    [HttpGet("roles")]
    [ProducesResponseType(typeof(ApiResponse<List<RoleDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRoles()
    {
        var result = await _userService.GetRolesAsync();
        return Ok(ApiResponse<List<RoleDto>>.SuccessResult(result));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var result = await _userService.CreateUserAsync(dto, userName);
        return Ok(ApiResponse<UserDto>.SuccessResult(result, "User account created successfully."));
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDto dto)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var result = await _userService.UpdateUserAsync(id, dto, userName);
        return Ok(ApiResponse<UserDto>.SuccessResult(result, "User updated successfully."));
    }

    [HttpPost("{id:int}/reset-password")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ResetPassword(int id, [FromBody] ResetPasswordDto dto)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var result = await _userService.ResetPasswordAsync(id, dto.NewPassword, userName);
        return Ok(ApiResponse<bool>.SuccessResult(result, "Password reset successfully."));
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var result = await _userService.DeleteUserAsync(id, userName);
        return Ok(ApiResponse<bool>.SuccessResult(result, "User deactivated."));
    }
}
