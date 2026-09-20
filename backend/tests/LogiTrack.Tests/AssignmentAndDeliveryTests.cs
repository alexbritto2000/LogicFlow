using LogiTrack.Application.DTOs.Assignment;
using LogiTrack.Application.DTOs.Delivery;
using LogiTrack.Application.Interfaces;
using LogiTrack.Domain.Entities;
using LogiTrack.Domain.Enums;
using LogiTrack.Infrastructure.Data;
using LogiTrack.Infrastructure.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace LogiTrack.Tests;

public class MockFileStorageService : IFileStorageService
{
    public Task<string> SaveFileAsync(IFormFile file, string subFolder = "documents", CancellationToken cancellationToken = default)
    {
        return Task.FromResult($"{subFolder}/test_file.png");
    }

    public bool DeleteFile(string relativePath) => true;
}

public class AssignmentAndDeliveryTests
{
    private LogiTrackDbContext CreateInMemoryContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<LogiTrackDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        return new LogiTrackDbContext(options);
    }

    [Fact]
    public async Task AssignFleet_WithMaintenanceVehicle_ShouldFail()
    {
        // Arrange
        using var context = CreateInMemoryContext(nameof(AssignFleet_WithMaintenanceVehicle_ShouldFail));
        var service = new AssignmentService(context);

        var customer = new Customer { Id = 1, CustomerCode = "CUST001", CompanyName = "Acme Corp" };
        var booking = new Booking { Id = 1, BookingNumber = "BK-2026-000001", CustomerId = 1, Customer = customer };
        var shipment = new Shipment { Id = 1, ShipmentNumber = "SH-2026-000001", BookingId = 1, Booking = booking, CurrentStatus = ShipmentStatus.Created };
        var vehicle = new Vehicle { Id = 1, VehicleNumber = "MH-12-AB-1234", VehicleType = "10 Ton", Status = VehicleStatus.Maintenance, IsActive = true };
        var driver = new Driver { Id = 1, DriverCode = "DRV001", Name = "Rajesh", DrivingLicenseNumber = "DL123", LicenseExpiryDate = DateTime.UtcNow.AddYears(1), Status = DriverStatus.Available, IsActive = true };

        context.Customers.Add(customer);
        context.Bookings.Add(booking);
        context.Shipments.Add(shipment);
        context.Vehicles.Add(vehicle);
        context.Drivers.Add(driver);
        await context.SaveChangesAsync();

        var dto = new CreateAssignmentDto
        {
            ShipmentId = 1,
            VehicleId = 1,
            DriverId = 1
        };

        // Act
        var result = await service.AssignFleetAsync(dto);

        // Assert
        Assert.False(result.Success);
        Assert.Contains("maintenance", result.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task AssignFleet_WithExpiredDriverLicense_ShouldFail()
    {
        // Arrange
        using var context = CreateInMemoryContext(nameof(AssignFleet_WithExpiredDriverLicense_ShouldFail));
        var service = new AssignmentService(context);

        var customer = new Customer { Id = 1, CustomerCode = "CUST001", CompanyName = "Acme Corp" };
        var booking = new Booking { Id = 1, BookingNumber = "BK-2026-000001", CustomerId = 1, Customer = customer };
        var shipment = new Shipment { Id = 1, ShipmentNumber = "SH-2026-000001", BookingId = 1, Booking = booking, CurrentStatus = ShipmentStatus.Created };
        var vehicle = new Vehicle { Id = 1, VehicleNumber = "MH-12-AB-1234", VehicleType = "10 Ton", Status = VehicleStatus.Available, IsActive = true };
        var driver = new Driver { Id = 1, DriverCode = "DRV001", Name = "Rajesh", DrivingLicenseNumber = "DL123", LicenseExpiryDate = DateTime.UtcNow.AddDays(-1), Status = DriverStatus.Available, IsActive = true };

        context.Customers.Add(customer);
        context.Bookings.Add(booking);
        context.Shipments.Add(shipment);
        context.Vehicles.Add(vehicle);
        context.Drivers.Add(driver);
        await context.SaveChangesAsync();

        var dto = new CreateAssignmentDto
        {
            ShipmentId = 1,
            VehicleId = 1,
            DriverId = 1
        };

        // Act
        var result = await service.AssignFleetAsync(dto);

        // Assert
        Assert.False(result.Success);
        Assert.Contains("expired", result.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task AssignFleet_WhenValid_ShouldAssignAndChangeStatuses()
    {
        // Arrange
        using var context = CreateInMemoryContext(nameof(AssignFleet_WhenValid_ShouldAssignAndChangeStatuses));
        var service = new AssignmentService(context);

        var customer = new Customer { Id = 1, CustomerCode = "CUST001", CompanyName = "Acme Corp" };
        var booking = new Booking { Id = 1, BookingNumber = "BK-2026-000001", CustomerId = 1, Customer = customer };
        var shipment = new Shipment { Id = 1, ShipmentNumber = "SH-2026-000001", BookingId = 1, Booking = booking, CurrentStatus = ShipmentStatus.Created };
        var vehicle = new Vehicle { Id = 1, VehicleNumber = "MH-12-AB-1234", VehicleType = "10 Ton", Status = VehicleStatus.Available, IsActive = true };
        var driver = new Driver { Id = 1, DriverCode = "DRV001", Name = "Rajesh", DrivingLicenseNumber = "DL123", LicenseExpiryDate = DateTime.UtcNow.AddYears(2), Status = DriverStatus.Available, IsActive = true };

        context.Customers.Add(customer);
        context.Bookings.Add(booking);
        context.Shipments.Add(shipment);
        context.Vehicles.Add(vehicle);
        context.Drivers.Add(driver);
        await context.SaveChangesAsync();

        var dto = new CreateAssignmentDto
        {
            ShipmentId = 1,
            VehicleId = 1,
            DriverId = 1,
            Notes = "Urgent dispatch"
        };

        // Act
        var result = await service.AssignFleetAsync(dto, "TestDispatcher");

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Data);

        var updatedVehicle = await context.Vehicles.FindAsync(1);
        var updatedDriver = await context.Drivers.FindAsync(1);
        var updatedShipment = await context.Shipments.FindAsync(1);

        Assert.Equal(VehicleStatus.Assigned, updatedVehicle!.Status);
        Assert.Equal(DriverStatus.Assigned, updatedDriver!.Status);
        Assert.Equal(ShipmentStatus.Assigned, updatedShipment!.CurrentStatus);
    }

    [Fact]
    public async Task RecordDelivery_ShouldMarkDeliveredAndReleaseAssets()
    {
        // Arrange
        using var context = CreateInMemoryContext(nameof(RecordDelivery_ShouldMarkDeliveredAndReleaseAssets));
        var fileStorage = new MockFileStorageService();
        var deliveryService = new DeliveryService(context, fileStorage);

        var customer = new Customer { Id = 1, CustomerCode = "CUST001", CompanyName = "Acme Corp" };
        var booking = new Booking { Id = 1, BookingNumber = "BK-2026-000001", CustomerId = 1, Customer = customer, Status = BookingStatus.Confirmed };
        var shipment = new Shipment
        {
            Id = 1,
            ShipmentNumber = "SH-2026-000001",
            TrackingNumber = "LT-2026-000001",
            BookingId = 1,
            Booking = booking,
            Origin = "Mumbai",
            Destination = "Delhi",
            CurrentStatus = ShipmentStatus.InTransit
        };
        var vehicle = new Vehicle { Id = 1, VehicleNumber = "MH-12-AB-1234", Status = VehicleStatus.Assigned, IsActive = true };
        var driver = new Driver { Id = 1, DriverCode = "DRV001", Name = "Rajesh", Status = DriverStatus.Assigned, IsActive = true };
        var assignment = new VehicleAssignment
        {
            Id = 1,
            ShipmentId = 1,
            Shipment = shipment,
            VehicleId = 1,
            Vehicle = vehicle,
            DriverId = 1,
            Driver = driver,
            IsActive = true,
            AssignedDate = DateTime.UtcNow
        };

        context.Customers.Add(customer);
        context.Bookings.Add(booking);
        context.Shipments.Add(shipment);
        context.Vehicles.Add(vehicle);
        context.Drivers.Add(driver);
        context.VehicleAssignments.Add(assignment);
        await context.SaveChangesAsync();

        var dto = new CreateDeliveryDto
        {
            ShipmentId = 1,
            ReceiverName = "Sunil Verma",
            ReceiverPhone = "9876543210",
            DeliveryDate = DateTime.UtcNow,
            DeliveryRemarks = "All cartons intact."
        };

        // Act
        var deliveryDto = await deliveryService.RecordDeliveryAsync(dto, "TestDispatcher");

        // Assert
        Assert.NotNull(deliveryDto);
        Assert.Equal("Sunil Verma", deliveryDto.ReceiverName);

        var updatedShipment = await context.Shipments.FindAsync(1);
        var updatedVehicle = await context.Vehicles.FindAsync(1);
        var updatedDriver = await context.Drivers.FindAsync(1);
        var updatedAssignment = await context.VehicleAssignments.FindAsync(1);
        var updatedBooking = await context.Bookings.FindAsync(1);

        Assert.Equal(ShipmentStatus.Delivered, updatedShipment!.CurrentStatus);
        Assert.NotNull(updatedShipment.ActualDeliveryDate);
        Assert.Equal(VehicleStatus.Available, updatedVehicle!.Status);
        Assert.Equal(DriverStatus.Available, updatedDriver!.Status);
        Assert.False(updatedAssignment!.IsActive);
        Assert.NotNull(updatedAssignment.ReleasedDate);
        Assert.Equal(BookingStatus.Delivered, updatedBooking!.Status);
    }
}
