using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.User;
using LogiTrack.Application.Interfaces;
using LogiTrack.Domain.Entities;
using LogiTrack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LogiTrack.Infrastructure.Services;

public class UserService : IUserService
{
    private readonly LogiTrackDbContext _context;

    public UserService(LogiTrackDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<UserDto>> GetUsersAsync(UserQueryParameters query)
    {
        var dbQuery = _context.Users
            .AsNoTracking()
            .Include(u => u.Role)
            .AsQueryable();

        if (query.RoleId.HasValue)
        {
            dbQuery = dbQuery.Where(u => u.RoleId == query.RoleId.Value);
        }

        if (query.IsActive.HasValue)
        {
            dbQuery = dbQuery.Where(u => u.IsActive == query.IsActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            dbQuery = dbQuery.Where(u =>
                u.Username.ToLower().Contains(search) ||
                u.FullName.ToLower().Contains(search) ||
                u.Email.ToLower().Contains(search) ||
                (u.Phone != null && u.Phone.Contains(search)));
        }

        var totalCount = await dbQuery.CountAsync();

        var items = await dbQuery
            .OrderBy(u => u.FullName)
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(u => new UserDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                FullName = u.FullName,
                Phone = u.Phone,
                RoleId = u.RoleId,
                RoleName = u.Role.Name,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        return new PagedResult<UserDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize
        };
    }

    public async Task<UserDto?> GetUserByIdAsync(int id)
    {
        var u = await _context.Users
            .AsNoTracking()
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (u == null) return null;

        return new UserDto
        {
            Id = u.Id,
            Username = u.Username,
            Email = u.Email,
            FullName = u.FullName,
            Phone = u.Phone,
            RoleId = u.RoleId,
            RoleName = u.Role.Name,
            IsActive = u.IsActive,
            CreatedAt = u.CreatedAt
        };
    }

    public async Task<UserDto> CreateUserAsync(CreateUserDto dto, string? createdBy = null)
    {
        var existsUsername = await _context.Users.AnyAsync(u => u.Username.ToLower() == dto.Username.ToLower().Trim());
        if (existsUsername)
        {
            throw new InvalidOperationException($"Username '{dto.Username}' is already in use.");
        }

        var existsEmail = await _context.Users.AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower().Trim());
        if (existsEmail)
        {
            throw new InvalidOperationException($"Email address '{dto.Email}' is already registered.");
        }

        var role = await _context.Roles.FindAsync(dto.RoleId);
        if (role == null)
        {
            throw new KeyNotFoundException($"Role with ID {dto.RoleId} does not exist.");
        }

        var user = new User
        {
            Username = dto.Username.Trim(),
            Email = dto.Email.Trim().ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            FullName = dto.FullName.Trim(),
            Phone = dto.Phone?.Trim(),
            RoleId = dto.RoleId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        _context.Users.Add(user);
        _context.AuditLogs.Add(new AuditLog
        {
            Action = "CREATE_USER",
            Entity = "User",
            UserName = createdBy,
            Timestamp = DateTime.UtcNow,
            Details = $"Created system user {user.Username} with role {role.Name}."
        });

        await _context.SaveChangesAsync();

        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Phone = user.Phone,
            RoleId = user.RoleId,
            RoleName = role.Name,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };
    }

    public async Task<UserDto> UpdateUserAsync(int id, UpdateUserDto dto, string? updatedBy = null)
    {
        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
        {
            throw new KeyNotFoundException($"User with ID {id} was not found.");
        }

        var role = await _context.Roles.FindAsync(dto.RoleId);
        if (role == null)
        {
            throw new KeyNotFoundException($"Role with ID {dto.RoleId} does not exist.");
        }

        user.Email = dto.Email.Trim().ToLower();
        user.FullName = dto.FullName.Trim();
        user.Phone = dto.Phone?.Trim();
        user.RoleId = dto.RoleId;
        user.IsActive = dto.IsActive;
        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedBy = updatedBy;

        _context.AuditLogs.Add(new AuditLog
        {
            Action = "UPDATE_USER",
            Entity = "User",
            EntityId = user.Id.ToString(),
            UserName = updatedBy,
            Timestamp = DateTime.UtcNow,
            Details = $"Updated user {user.Username} (Role: {role.Name}, Active: {user.IsActive})."
        });

        await _context.SaveChangesAsync();

        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Phone = user.Phone,
            RoleId = user.RoleId,
            RoleName = role.Name,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };
    }

    public async Task<bool> ResetPasswordAsync(int id, string newPassword, string? updatedBy = null)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return false;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedBy = updatedBy;

        _context.AuditLogs.Add(new AuditLog
        {
            Action = "RESET_PASSWORD",
            Entity = "User",
            EntityId = user.Id.ToString(),
            UserName = updatedBy,
            Timestamp = DateTime.UtcNow,
            Details = $"Password reset for user {user.Username}."
        });

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteUserAsync(int id, string? deletedBy = null)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return false;

        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedBy = deletedBy;

        _context.AuditLogs.Add(new AuditLog
        {
            Action = "DEACTIVATE_USER",
            Entity = "User",
            EntityId = user.Id.ToString(),
            UserName = deletedBy,
            Timestamp = DateTime.UtcNow,
            Details = $"Deactivated user {user.Username}."
        });

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<RoleDto>> GetRolesAsync()
    {
        return await _context.Roles
            .AsNoTracking()
            .Select(r => new RoleDto
            {
                Id = r.Id,
                Name = r.Name,
                Description = r.Description
            })
            .ToListAsync();
    }
}
