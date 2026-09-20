using LogiTrack.Application.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace LogiTrack.Infrastructure.Services;

public class FileStorageService : IFileStorageService
{
    private readonly string _baseUploadPath;
    private readonly string[] _allowedExtensions = { ".pdf", ".jpg", ".jpeg", ".png", ".webp" };
    private const long MaxFileSizeInBytes = 10 * 1024 * 1024; // 10MB

    public FileStorageService(IConfiguration configuration)
    {
        var configuredPath = configuration["FileStorage:UploadPath"] ?? "Uploads";
        _baseUploadPath = Path.IsPathRooted(configuredPath)
            ? configuredPath
            : Path.Combine(Directory.GetCurrentDirectory(), configuredPath);

        if (!Directory.Exists(_baseUploadPath))
        {
            Directory.CreateDirectory(_baseUploadPath);
        }
    }

    public async Task<string> SaveFileAsync(IFormFile file, string subFolder = "documents", CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
        {
            throw new ArgumentException("File cannot be empty.", nameof(file));
        }

        if (file.Length > MaxFileSizeInBytes)
        {
            throw new InvalidOperationException("File size exceeds the 10MB limit.");
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!_allowedExtensions.Contains(extension))
        {
            throw new InvalidOperationException($"File type '{extension}' is not allowed. Permitted types: {string.Join(", ", _allowedExtensions)}");
        }

        var targetFolder = Path.Combine(_baseUploadPath, subFolder);
        if (!Directory.Exists(targetFolder))
        {
            Directory.CreateDirectory(targetFolder);
        }

        var uniqueFileName = $"{Guid.NewGuid():N}{extension}";
        var fullPath = Path.Combine(targetFolder, uniqueFileName);

        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        // Return relative web URL
        return $"/uploads/{subFolder}/{uniqueFileName}";
    }

    public bool DeleteFile(string relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath)) return false;

        try
        {
            // Normalize path
            var cleanPath = relativePath.TrimStart('/').Replace("uploads/", "", StringComparison.OrdinalIgnoreCase);
            var fullPath = Path.Combine(_baseUploadPath, cleanPath);

            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
                return true;
            }
        }
        catch
        {
            // Silent error handling for file removal
        }
        return false;
    }
}
