using Microsoft.AspNetCore.Http;

namespace LogiTrack.Application.Interfaces;

public interface IFileStorageService
{
    Task<string> SaveFileAsync(IFormFile file, string subFolder = "documents", CancellationToken cancellationToken = default);
    bool DeleteFile(string relativePath);
}
