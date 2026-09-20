using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Auth;
using LogiTrack.Application.Interfaces;
using LogiTrack.Domain.Entities;
using LogiTrack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace LogiTrack.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly LogiTrackDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(LogiTrackDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<ApiResponse<LoginResponse>> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.UsernameOrEmail) || string.IsNullOrWhiteSpace(request.Password))
        {
            return ApiResponse<LoginResponse>.FailureResult("Username/Email and password are required.");
        }

        var normalizedInput = request.UsernameOrEmail.Trim().ToLowerInvariant();

        var user = await _context.Users
            .Include(u => u.Role)
            .Include(u => u.Driver)
            .FirstOrDefaultAsync(u => u.Username.ToLower() == normalizedInput || u.Email.ToLower() == normalizedInput, cancellationToken);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return ApiResponse<LoginResponse>.FailureResult("Invalid username/email or password.");
        }

        if (!user.IsActive)
        {
            return ApiResponse<LoginResponse>.FailureResult("Your account has been deactivated. Please contact an administrator.");
        }

        var token = GenerateJwtToken(user, out var expiresAt);
        var refreshToken = GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(
            int.TryParse(_configuration["JwtSettings:RefreshTokenDurationInDays"], out var days) ? days : 7);

        // Record Audit Log
        _context.AuditLogs.Add(new AuditLog
        {
            UserId = user.Id,
            UserName = user.Username,
            Action = "User Login",
            Entity = "User",
            EntityId = user.Id.ToString(),
            Timestamp = DateTime.UtcNow,
            Details = $"Successful login by {user.Username} with role {user.Role.Name}"
        });

        await _context.SaveChangesAsync(cancellationToken);

        var profile = new UserProfileDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Phone = user.Phone,
            Role = user.Role.Name,
            DriverId = user.Driver?.Id
        };

        var response = new LoginResponse
        {
            Token = token,
            RefreshToken = refreshToken,
            ExpiresAt = expiresAt,
            User = profile
        };

        return ApiResponse<LoginResponse>.SuccessResult(response, "Login successful");
    }

    public async Task<ApiResponse<LoginResponse>> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Token) || string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return ApiResponse<LoginResponse>.FailureResult("Invalid token payload.");
        }

        var principal = GetPrincipalFromExpiredToken(request.Token);
        if (principal == null)
        {
            return ApiResponse<LoginResponse>.FailureResult("Invalid access token.");
        }

        var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return ApiResponse<LoginResponse>.FailureResult("Invalid user claim in token.");
        }

        var user = await _context.Users
            .Include(u => u.Role)
            .Include(u => u.Driver)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null || user.RefreshToken != request.RefreshToken || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
        {
            return ApiResponse<LoginResponse>.FailureResult("Invalid or expired refresh token. Please log in again.");
        }

        var newJwtToken = GenerateJwtToken(user, out var expiresAt);
        var newRefreshToken = GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);

        await _context.SaveChangesAsync(cancellationToken);

        var profile = new UserProfileDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Phone = user.Phone,
            Role = user.Role.Name,
            DriverId = user.Driver?.Id
        };

        var response = new LoginResponse
        {
            Token = newJwtToken,
            RefreshToken = newRefreshToken,
            ExpiresAt = expiresAt,
            User = profile
        };

        return ApiResponse<LoginResponse>.SuccessResult(response, "Token refreshed successfully");
    }

    public async Task<ApiResponse<UserProfileDto>> GetCurrentUserAsync(int userId, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .AsNoTracking()
            .Include(u => u.Role)
            .Include(u => u.Driver)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null)
        {
            return ApiResponse<UserProfileDto>.FailureResult("User not found.");
        }

        var profile = new UserProfileDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Phone = user.Phone,
            Role = user.Role.Name,
            DriverId = user.Driver?.Id
        };

        return ApiResponse<UserProfileDto>.SuccessResult(profile);
    }

    private string GenerateJwtToken(User user, out DateTime expiresAt)
    {
        var secretKey = _configuration["JwtSettings:SecretKey"] ?? "LogiTrackSuperSecureSecretKeyForJwtAuthentication2026!#";
        var issuer = _configuration["JwtSettings:Issuer"] ?? "LogiTrackApi";
        var audience = _configuration["JwtSettings:Audience"] ?? "LogiTrackClient";
        var durationInMinutes = int.TryParse(_configuration["JwtSettings:DurationInMinutes"], out var minutes) ? minutes : 120;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        expiresAt = DateTime.UtcNow.AddMinutes(durationInMinutes);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role.Name),
            new("FullName", user.FullName)
        };

        if (user.Driver != null)
        {
            claims.Add(new Claim("DriverId", user.Driver.Id.ToString()));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expiresAt,
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = creds
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    private static string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    private ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        var secretKey = _configuration["JwtSettings:SecretKey"] ?? "LogiTrackSuperSecureSecretKeyForJwtAuthentication2026!#";

        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = false,
            ValidateIssuer = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ValidateLifetime = false // Here we explicitly allow expired tokens to read claims for refresh
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        try
        {
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);
            if (securityToken is not JwtSecurityToken jwtSecurityToken ||
                !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                return null;
            }
            return principal;
        }
        catch
        {
            return null;
        }
    }
}
