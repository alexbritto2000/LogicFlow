using LogiTrack.Domain.Entities;
using LogiTrack.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LogiTrack.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(LogiTrackDbContext context)
    {
        // 1. Roles
        if (!await context.Roles.AnyAsync())
        {
            var roles = new List<Role>
            {
                new() { Name = "SuperAdmin", Description = "Full system administration" },
                new() { Name = "Admin", Description = "Company administration and operational control" },
                new() { Name = "Operations", Description = "Booking, shipment and customer management" },
                new() { Name = "Dispatcher", Description = "Fleet, driver and delivery dispatching" },
                new() { Name = "Accountant", Description = "Invoicing, payments, and financial reports" },
                new() { Name = "Driver", Description = "Assigned deliveries and status updates" },
                new() { Name = "Viewer", Description = "Read-only access to records and reports" }
            };

            await context.Roles.AddRangeAsync(roles);
            await context.SaveChangesAsync();
        }

        var adminRole = await context.Roles.FirstAsync(r => r.Name == "Admin");
        var dispatcherRole = await context.Roles.FirstAsync(r => r.Name == "Dispatcher");

        // 2. Users
        if (!await context.Users.AnyAsync())
        {
            var adminPasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!");
            var dispatcherPasswordHash = BCrypt.Net.BCrypt.HashPassword("Dispatch123!");

            var users = new List<User>
            {
                new()
                {
                    Username = "admin",
                    Email = "admin@logitrack.com",
                    FullName = "LogiTrack Administrator",
                    Phone = "+91 98000 00001",
                    PasswordHash = adminPasswordHash,
                    RoleId = adminRole.Id,
                    IsActive = true
                },
                new()
                {
                    Username = "dispatcher",
                    Email = "dispatcher@logitrack.com",
                    FullName = "Chief Dispatcher",
                    Phone = "+91 98000 00002",
                    PasswordHash = dispatcherPasswordHash,
                    RoleId = dispatcherRole.Id,
                    IsActive = true
                }
            };

            await context.Users.AddRangeAsync(users);
            await context.SaveChangesAsync();
        }

        // 3. Customers
        if (!await context.Customers.AnyAsync())
        {
            var customers = new List<Customer>
            {
                new()
                {
                    CustomerCode = "CUST-0001",
                    CompanyName = "ABC Logistics Pvt Ltd",
                    ContactPerson = "Arun Ramanathan",
                    Phone = "+91 94440 12345",
                    Email = "arun@abclogistics.example",
                    Address = "12 Industrial Estate, Guindy",
                    City = "Chennai",
                    State = "Tamil Nadu",
                    Pincode = "600032",
                    GSTNumber = "33AAAAA0000A1Z5"
                },
                new()
                {
                    CustomerCode = "CUST-0002",
                    CompanyName = "Chennai Cargo Services",
                    ContactPerson = "Priya Sundaram",
                    Phone = "+91 98410 54321",
                    Email = "priya@chennaicargo.example",
                    Address = "45 Harbour Road",
                    City = "Chennai",
                    State = "Tamil Nadu",
                    Pincode = "600001",
                    GSTNumber = "33BBBBB1111B1Z2"
                },
                new()
                {
                    CustomerCode = "CUST-0003",
                    CompanyName = "South India Transport",
                    ContactPerson = "Karthik Velu",
                    Phone = "+91 94220 98765",
                    Email = "karthik@sitransport.example",
                    Address = "88 Avinashi Road",
                    City = "Coimbatore",
                    State = "Tamil Nadu",
                    Pincode = "641018",
                    GSTNumber = "33CCCCC2222C1Z9"
                }
            };

            await context.Customers.AddRangeAsync(customers);
            await context.SaveChangesAsync();
        }

        // 4. Vehicles
        if (!await context.Vehicles.AnyAsync())
        {
            var vehicles = new List<Vehicle>
            {
                new()
                {
                    VehicleNumber = "TN-01-AB-1234",
                    VehicleType = "14ft Truck",
                    Make = "Tata",
                    Model = "407 Gold SFC",
                    Year = 2022,
                    Capacity = 2.5m,
                    FuelType = "Diesel",
                    CurrentOdometer = 45200m,
                    Status = VehicleStatus.Available
                },
                new()
                {
                    VehicleNumber = "TN-09-CD-5678",
                    VehicleType = "20ft Container Truck",
                    Make = "Ashok Leyland",
                    Model = "1618 Ecomet",
                    Year = 2021,
                    Capacity = 10.0m,
                    FuelType = "Diesel",
                    CurrentOdometer = 120500m,
                    Status = VehicleStatus.Available
                },
                new()
                {
                    VehicleNumber = "TN-22-EF-9012",
                    VehicleType = "Multi-Axle Heavy Truck",
                    Make = "BharatBenz",
                    Model = "2823R",
                    Year = 2023,
                    Capacity = 20.0m,
                    FuelType = "Diesel",
                    CurrentOdometer = 85300m,
                    Status = VehicleStatus.Assigned
                },
                new()
                {
                    VehicleNumber = "KA-01-GH-3456",
                    VehicleType = "Light Commercial Vehicle",
                    Make = "Eicher",
                    Model = "Pro 2049",
                    Year = 2023,
                    Capacity = 3.5m,
                    FuelType = "Diesel",
                    CurrentOdometer = 32100m,
                    Status = VehicleStatus.InTransit
                }
            };

            await context.Vehicles.AddRangeAsync(vehicles);
            await context.SaveChangesAsync();
        }

        // 5. Vehicle Documents
        if (!await context.VehicleDocuments.AnyAsync())
        {
            var v1 = await context.Vehicles.FirstAsync(v => v.VehicleNumber == "TN-01-AB-1234");
            var v2 = await context.Vehicles.FirstAsync(v => v.VehicleNumber == "TN-09-CD-5678");
            var v3 = await context.Vehicles.FirstAsync(v => v.VehicleNumber == "TN-22-EF-9012");

            var docs = new List<VehicleDocument>
            {
                new()
                {
                    VehicleId = v1.Id,
                    DocumentType = VehicleDocumentType.Insurance,
                    DocumentNumber = "INS-2025-9988",
                    IssueDate = DateTime.UtcNow.AddMonths(-11),
                    ExpiryDate = DateTime.UtcNow.AddDays(15), // ExpiringSoon
                    FilePath = "/uploads/samples/v1_insurance.pdf",
                    Remarks = "Comprehensive Commercial Policy"
                },
                new()
                {
                    VehicleId = v2.Id,
                    DocumentType = VehicleDocumentType.PollutionCertificate,
                    DocumentNumber = "PUC-2025-4433",
                    IssueDate = DateTime.UtcNow.AddMonths(-7),
                    ExpiryDate = DateTime.UtcNow.AddDays(-10), // Expired
                    FilePath = "/uploads/samples/v2_puc.pdf",
                    Remarks = "Needs renewal immediately"
                },
                new()
                {
                    VehicleId = v3.Id,
                    DocumentType = VehicleDocumentType.FitnessCertificate,
                    DocumentNumber = "FC-2025-1122",
                    IssueDate = DateTime.UtcNow.AddMonths(-2),
                    ExpiryDate = DateTime.UtcNow.AddMonths(10), // Valid
                    FilePath = "/uploads/samples/v3_fc.pdf",
                    Remarks = "RTO Verified Certificate"
                }
            };

            await context.VehicleDocuments.AddRangeAsync(docs);
            await context.SaveChangesAsync();
        }

        // 6. Drivers
        if (!await context.Drivers.AnyAsync())
        {
            var drivers = new List<Driver>
            {
                new()
                {
                    DriverCode = "DRV-0001",
                    Name = "Rajesh Kumar",
                    Phone = "+91 98765 43210",
                    Email = "rajesh.k@example.com",
                    Address = "23 Gandhi Street, Saidapet, Chennai",
                    DrivingLicenseNumber = "DL-01-2015-001234",
                    LicenseExpiryDate = DateTime.UtcNow.AddYears(2),
                    JoiningDate = DateTime.UtcNow.AddYears(-3),
                    Status = DriverStatus.Available
                },
                new()
                {
                    DriverCode = "DRV-0002",
                    Name = "Suresh Murugan",
                    Phone = "+91 98765 43211",
                    Email = "suresh.m@example.com",
                    Address = "7 North Car Street, Salem",
                    DrivingLicenseNumber = "DL-09-2018-004567",
                    LicenseExpiryDate = DateTime.UtcNow.AddDays(18), // Expiring soon
                    JoiningDate = DateTime.UtcNow.AddYears(-2),
                    Status = DriverStatus.Assigned
                },
                new()
                {
                    DriverCode = "DRV-0003",
                    Name = "Ramesh Chandran",
                    Phone = "+91 98765 43212",
                    Email = "ramesh.c@example.com",
                    Address = "15 Anna Nagar, Madurai",
                    DrivingLicenseNumber = "DL-22-2012-007890",
                    LicenseExpiryDate = DateTime.UtcNow.AddMonths(8),
                    JoiningDate = DateTime.UtcNow.AddYears(-1),
                    Status = DriverStatus.Available
                }
            };

            await context.Drivers.AddRangeAsync(drivers);
            await context.SaveChangesAsync();
        }

        // 7. Bookings & Shipments
        if (!await context.Bookings.AnyAsync())
        {
            var cust1 = await context.Customers.FirstAsync(c => c.CustomerCode == "CUST-0001");
            var cust2 = await context.Customers.FirstAsync(c => c.CustomerCode == "CUST-0002");
            var v3 = await context.Vehicles.FirstAsync(v => v.VehicleNumber == "TN-22-EF-9012");
            var d2 = await context.Drivers.FirstAsync(d => d.DriverCode == "DRV-0002");

            var b1 = new Booking
            {
                BookingNumber = "BK-2026-000001",
                CustomerId = cust1.Id,
                BookingDate = DateTime.UtcNow.AddDays(-3),
                PickupAddress = "Guindy Industrial Area",
                PickupCity = "Chennai",
                DeliveryAddress = "Whitefield Logistics Park",
                DeliveryCity = "Bangalore",
                PickupDate = DateTime.UtcNow.AddDays(-2),
                ExpectedDeliveryDate = DateTime.UtcNow.AddDays(1),
                CargoDescription = "Precision Automotive Parts & Gears",
                CargoWeight = 1500m,
                NumberOfPackages = 35,
                FreightAmount = 18500m,
                PaymentType = "Prepaid",
                Status = BookingStatus.InTransit
            };

            var b2 = new Booking
            {
                BookingNumber = "BK-2026-000002",
                CustomerId = cust2.Id,
                BookingDate = DateTime.UtcNow.AddDays(-1),
                PickupAddress = "Harbour Logistics Terminal",
                PickupCity = "Chennai",
                DeliveryAddress = "HITEC City Distribution Hub",
                DeliveryCity = "Hyderabad",
                PickupDate = DateTime.UtcNow,
                ExpectedDeliveryDate = DateTime.UtcNow.AddDays(2),
                CargoDescription = "Export Garments & Fabric Rolls",
                CargoWeight = 4200m,
                NumberOfPackages = 80,
                FreightAmount = 32000m,
                PaymentType = "ToPay",
                Status = BookingStatus.Assigned
            };

            await context.Bookings.AddRangeAsync(b1, b2);
            await context.SaveChangesAsync();

            // Shipments
            var s1 = new Shipment
            {
                ShipmentNumber = "SH-2026-000001",
                BookingId = b1.Id,
                TrackingNumber = "LT2026000001",
                Origin = "Chennai",
                Destination = "Bangalore",
                CurrentLocation = "Vellore Tollway (In Transit)",
                CurrentStatus = ShipmentStatus.InTransit,
                EstimatedDeliveryDate = DateTime.UtcNow.AddDays(1)
            };

            var s2 = new Shipment
            {
                ShipmentNumber = "SH-2026-000002",
                BookingId = b2.Id,
                TrackingNumber = "LT2026000002",
                Origin = "Chennai",
                Destination = "Hyderabad",
                CurrentLocation = "Chennai Depot (Assigned for Loading)",
                CurrentStatus = ShipmentStatus.Assigned,
                EstimatedDeliveryDate = DateTime.UtcNow.AddDays(2)
            };

            await context.Shipments.AddRangeAsync(s1, s2);
            await context.SaveChangesAsync();

            // Status histories for s1
            var histories = new List<ShipmentStatusHistory>
            {
                new()
                {
                    ShipmentId = s1.Id,
                    Status = ShipmentStatus.Created,
                    Location = "Chennai Hub",
                    Remarks = "Shipment booked and verified",
                    UpdatedBy = "admin",
                    UpdatedAt = DateTime.UtcNow.AddDays(-2).AddHours(-4)
                },
                new()
                {
                    ShipmentId = s1.Id,
                    Status = ShipmentStatus.Assigned,
                    Location = "Chennai Hub",
                    Remarks = "Assigned vehicle TN-22-EF-9012 and driver Suresh Murugan",
                    UpdatedBy = "dispatcher",
                    UpdatedAt = DateTime.UtcNow.AddDays(-2)
                },
                new()
                {
                    ShipmentId = s1.Id,
                    Status = ShipmentStatus.PickedUp,
                    Location = "Guindy Warehouse",
                    Remarks = "Cargo safely loaded and sealed",
                    UpdatedBy = "dispatcher",
                    UpdatedAt = DateTime.UtcNow.AddDays(-1)
                },
                new()
                {
                    ShipmentId = s1.Id,
                    Status = ShipmentStatus.InTransit,
                    Location = "Vellore Tollway",
                    Remarks = "En route to Bangalore destination",
                    UpdatedBy = "system",
                    UpdatedAt = DateTime.UtcNow.AddHours(-6)
                }
            };

            await context.ShipmentStatusHistories.AddRangeAsync(histories);

            // Assignment
            var assignment = new VehicleAssignment
            {
                ShipmentId = s1.Id,
                VehicleId = v3.Id,
                DriverId = d2.Id,
                AssignedDate = DateTime.UtcNow.AddDays(-2),
                IsActive = true,
                Notes = "Express cargo - Deliver before 4 PM"
            };

            await context.VehicleAssignments.AddAsync(assignment);

            // Invoices & Payments
            var invoice = new Invoice
            {
                InvoiceNumber = "INV-2026-000001",
                CustomerId = cust1.Id,
                BookingId = b1.Id,
                InvoiceDate = DateTime.UtcNow.AddDays(-2),
                DueDate = DateTime.UtcNow.AddDays(12),
                SubTotal = 18500m,
                Tax = 3330m, // 18% GST
                Discount = 500m,
                Total = 21330m,
                PaidAmount = 21330m,
                Status = InvoiceStatus.Paid
            };

            await context.Invoices.AddAsync(invoice);
            await context.SaveChangesAsync();

            var payment = new Payment
            {
                PaymentNumber = "PAY-2026-000001",
                CustomerId = cust1.Id,
                BookingId = b1.Id,
                InvoiceId = invoice.Id,
                Amount = 21330m,
                PaymentDate = DateTime.UtcNow.AddDays(-1),
                PaymentMethod = PaymentMethod.BankTransfer,
                ReferenceNumber = "HDFC-NEFT-99482103",
                Status = PaymentStatus.Paid,
                Remarks = "Advance payment received in full"
            };

            await context.Payments.AddAsync(payment);

            // Notifications
            var notifications = new List<Notification>
            {
                new()
                {
                    Title = "Document Expiring Soon",
                    Message = "Insurance policy INS-2025-9988 for vehicle TN-01-AB-1234 expires in 15 days.",
                    Type = NotificationType.Warning,
                    TargetRole = "Admin",
                    CreatedAt = DateTime.UtcNow.AddHours(-3),
                    ReferenceUrl = "/documents"
                },
                new()
                {
                    Title = "Pollution Certificate Expired",
                    Message = "PUC-2025-4433 for vehicle TN-09-CD-5678 expired 10 days ago.",
                    Type = NotificationType.Alert,
                    TargetRole = "Admin",
                    CreatedAt = DateTime.UtcNow.AddHours(-5),
                    ReferenceUrl = "/documents"
                },
                new()
                {
                    Title = "Driver License Renewal Alert",
                    Message = "License for driver Suresh Murugan (DRV-0002) expires in 18 days.",
                    Type = NotificationType.Warning,
                    TargetRole = "Dispatcher",
                    CreatedAt = DateTime.UtcNow.AddHours(-8),
                    ReferenceUrl = "/drivers"
                }
            };

            await context.Notifications.AddRangeAsync(notifications);
            await context.SaveChangesAsync();
        }
    }
}
