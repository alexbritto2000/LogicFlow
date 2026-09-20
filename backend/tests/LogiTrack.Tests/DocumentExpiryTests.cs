using LogiTrack.Domain.Entities;
using LogiTrack.Domain.Enums;

namespace LogiTrack.Tests;

public class DocumentExpiryTests
{
    [Fact]
    public void Document_WithPastExpiryDate_ShouldBeExpired()
    {
        // Arrange
        var pastDoc = new VehicleDocument
        {
            DocumentType = VehicleDocumentType.FitnessCertificate,
            ExpiryDate = DateTime.UtcNow.AddDays(-10),
            FilePath = "test.pdf"
        };

        // Assert
        Assert.Equal(DocumentExpiryStatus.Expired, pastDoc.ExpiryStatus);
    }

    [Fact]
    public void Document_ExpiringWithin30Days_ShouldBeExpiringSoon()
    {
        // Arrange
        var soonDoc = new VehicleDocument
        {
            DocumentType = VehicleDocumentType.Permit,
            ExpiryDate = DateTime.UtcNow.AddDays(15),
            FilePath = "test.pdf"
        };

        // Assert
        Assert.Equal(DocumentExpiryStatus.ExpiringSoon, soonDoc.ExpiryStatus);
    }

    [Fact]
    public void Document_ExpiringMoreThan30DaysOut_ShouldBeValid()
    {
        // Arrange
        var validDoc = new VehicleDocument
        {
            DocumentType = VehicleDocumentType.Insurance,
            ExpiryDate = DateTime.UtcNow.AddDays(90),
            FilePath = "test.pdf"
        };

        // Assert
        Assert.Equal(DocumentExpiryStatus.Valid, validDoc.ExpiryStatus);
    }

    [Fact]
    public void Driver_WithPastLicenseDate_ShouldBeExpired()
    {
        // Arrange
        var driver = new Driver
        {
            Name = "John Doe",
            LicenseExpiryDate = DateTime.UtcNow.AddDays(-5),
            DrivingLicenseNumber = "DL-12345"
        };

        // Assert
        Assert.Equal(DocumentExpiryStatus.Expired, driver.LicenseExpiryStatus);
    }

    [Fact]
    public void Driver_WithFutureLicenseDate_ShouldBeValid()
    {
        // Arrange
        var driver = new Driver
        {
            Name = "Jane Doe",
            LicenseExpiryDate = DateTime.UtcNow.AddYears(2),
            DrivingLicenseNumber = "DL-67890"
        };

        // Assert
        Assert.Equal(DocumentExpiryStatus.Valid, driver.LicenseExpiryStatus);
    }
}
