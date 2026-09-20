using LogiTrack.Domain.Common;
using LogiTrack.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LogiTrack.Infrastructure.Data;

public class LogiTrackDbContext : DbContext
{
    public LogiTrackDbContext(DbContextOptions<LogiTrackDbContext> options) : base(options)
    {
    }

    public DbSet<Role> Roles => Set<Role>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<Driver> Drivers => Set<Driver>();
    public DbSet<VehicleDocument> VehicleDocuments => Set<VehicleDocument>();
    public DbSet<DriverDocument> DriverDocuments => Set<DriverDocument>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Shipment> Shipments => Set<Shipment>();
    public DbSet<ShipmentStatusHistory> ShipmentStatusHistories => Set<ShipmentStatusHistory>();
    public DbSet<VehicleAssignment> VehicleAssignments => Set<VehicleAssignment>();
    public DbSet<Delivery> Deliveries => Set<Delivery>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure indexes
        modelBuilder.Entity<Customer>()
            .HasIndex(c => c.CustomerCode).IsUnique();
        modelBuilder.Entity<Customer>()
            .HasIndex(c => c.Phone);

        modelBuilder.Entity<Vehicle>()
            .HasIndex(v => v.VehicleNumber).IsUnique();
        modelBuilder.Entity<Vehicle>()
            .HasIndex(v => v.Status);

        modelBuilder.Entity<Driver>()
            .HasIndex(d => d.DriverCode).IsUnique();
        modelBuilder.Entity<Driver>()
            .HasIndex(d => d.Phone);

        modelBuilder.Entity<VehicleDocument>()
            .HasIndex(vd => vd.ExpiryDate);

        modelBuilder.Entity<DriverDocument>()
            .HasIndex(dd => dd.ExpiryDate);

        modelBuilder.Entity<Booking>()
            .HasIndex(b => b.BookingNumber).IsUnique();
        modelBuilder.Entity<Booking>()
            .HasIndex(b => b.Status);

        modelBuilder.Entity<Shipment>()
            .HasIndex(s => s.ShipmentNumber).IsUnique();
        modelBuilder.Entity<Shipment>()
            .HasIndex(s => s.TrackingNumber).IsUnique();
        modelBuilder.Entity<Shipment>()
            .HasIndex(s => s.CurrentStatus);

        modelBuilder.Entity<Invoice>()
            .HasIndex(i => i.InvoiceNumber).IsUnique();

        modelBuilder.Entity<Payment>()
            .HasIndex(p => p.PaymentNumber).IsUnique();

        // Decimal precisions
        foreach (var property in modelBuilder.Model.GetEntityTypes()
            .SelectMany(t => t.GetProperties())
            .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
        {
            property.SetPrecision(18);
            property.SetScale(2);
        }

        // Relationships & Foreign Key Restrict
        modelBuilder.Entity<User>()
            .HasOne(u => u.Role)
            .WithMany(r => r.Users)
            .HasForeignKey(u => u.RoleId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Driver>()
            .HasOne(d => d.User)
            .WithOne(u => u.Driver)
            .HasForeignKey<Driver>(d => d.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Booking>()
            .HasOne(b => b.Customer)
            .WithMany(c => c.Bookings)
            .HasForeignKey(b => b.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Shipment>()
            .HasOne(s => s.Booking)
            .WithMany(b => b.Shipments)
            .HasForeignKey(s => s.BookingId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<VehicleAssignment>()
            .HasOne(va => va.Shipment)
            .WithMany(s => s.VehicleAssignments)
            .HasForeignKey(va => va.ShipmentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<VehicleAssignment>()
            .HasOne(va => va.Vehicle)
            .WithMany(v => v.Assignments)
            .HasForeignKey(va => va.VehicleId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<VehicleAssignment>()
            .HasOne(va => va.Driver)
            .WithMany(d => d.Assignments)
            .HasForeignKey(va => va.DriverId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Delivery>()
            .HasOne(d => d.Shipment)
            .WithMany(s => s.Deliveries)
            .HasForeignKey(d => d.ShipmentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Invoice>()
            .HasOne(i => i.Customer)
            .WithMany(c => c.Invoices)
            .HasForeignKey(i => i.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Payment>()
            .HasOne(p => p.Customer)
            .WithMany(c => c.Payments)
            .HasForeignKey(p => p.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
