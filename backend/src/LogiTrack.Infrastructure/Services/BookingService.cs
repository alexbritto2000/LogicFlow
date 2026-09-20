using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Booking;
using LogiTrack.Application.Interfaces;
using LogiTrack.Domain.Entities;
using LogiTrack.Domain.Enums;
using LogiTrack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LogiTrack.Infrastructure.Services;

public class BookingService : IBookingService
{
    private readonly LogiTrackDbContext _context;

    public BookingService(LogiTrackDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<PagedResult<BookingDto>>> GetBookingsAsync(BookingQueryParameters queryParams, CancellationToken cancellationToken = default)
    {
        var query = _context.Bookings
            .AsNoTracking()
            .Include(b => b.Customer)
            .Include(b => b.Shipments)
            .AsQueryable();

        if (queryParams.CustomerId.HasValue)
        {
            query = query.Where(b => b.CustomerId == queryParams.CustomerId.Value);
        }

        if (queryParams.Status.HasValue)
        {
            query = query.Where(b => b.Status == queryParams.Status.Value);
        }

        if (!string.IsNullOrWhiteSpace(queryParams.OriginCity))
        {
            var oc = queryParams.OriginCity.Trim().ToLower();
            query = query.Where(b => b.PickupCity.ToLower().Contains(oc));
        }

        if (!string.IsNullOrWhiteSpace(queryParams.DestinationCity))
        {
            var dc = queryParams.DestinationCity.Trim().ToLower();
            query = query.Where(b => b.DeliveryCity.ToLower().Contains(dc));
        }

        if (!string.IsNullOrWhiteSpace(queryParams.Search))
        {
            var search = queryParams.Search.Trim().ToLower();
            query = query.Where(b =>
                b.BookingNumber.ToLower().Contains(search) ||
                b.Customer.CompanyName.ToLower().Contains(search) ||
                b.PickupCity.ToLower().Contains(search) ||
                b.DeliveryCity.ToLower().Contains(search) ||
                b.CargoDescription.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        query = queryParams.SortBy?.ToLower() switch
        {
            "bookingnumber" => queryParams.IsAscending ? query.OrderBy(b => b.BookingNumber) : query.OrderByDescending(b => b.BookingNumber),
            "bookingdate" => queryParams.IsAscending ? query.OrderBy(b => b.BookingDate) : query.OrderByDescending(b => b.BookingDate),
            "status" => queryParams.IsAscending ? query.OrderBy(b => b.Status) : query.OrderByDescending(b => b.Status),
            "freightamount" => queryParams.IsAscending ? query.OrderBy(b => b.FreightAmount) : query.OrderByDescending(b => b.FreightAmount),
            _ => queryParams.IsAscending ? query.OrderBy(b => b.Id) : query.OrderByDescending(b => b.Id)
        };

        var items = await query
            .Skip((queryParams.PageNumber - 1) * queryParams.PageSize)
            .Take(queryParams.PageSize)
            .Select(b => new BookingDto
            {
                Id = b.Id,
                BookingNumber = b.BookingNumber,
                CustomerId = b.CustomerId,
                CustomerName = b.Customer.CompanyName,
                CustomerCode = b.Customer.CustomerCode,
                BookingDate = b.BookingDate,
                PickupAddress = b.PickupAddress,
                PickupCity = b.PickupCity,
                DeliveryAddress = b.DeliveryAddress,
                DeliveryCity = b.DeliveryCity,
                PickupDate = b.PickupDate,
                ExpectedDeliveryDate = b.ExpectedDeliveryDate,
                CargoDescription = b.CargoDescription,
                CargoWeight = b.CargoWeight,
                NumberOfPackages = b.NumberOfPackages,
                SpecialInstructions = b.SpecialInstructions,
                FreightAmount = b.FreightAmount,
                PaymentType = b.PaymentType,
                Status = b.Status,
                ShipmentsCount = b.Shipments.Count,
                IsActive = b.IsActive
            })
            .ToListAsync(cancellationToken);

        var pagedResult = new PagedResult<BookingDto>(items, totalCount, queryParams.PageNumber, queryParams.PageSize);
        return ApiResponse<PagedResult<BookingDto>>.SuccessResult(pagedResult);
    }

    public async Task<ApiResponse<BookingDetailDto>> GetBookingByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var booking = await _context.Bookings
            .AsNoTracking()
            .Include(b => b.Customer)
            .Include(b => b.Shipments)
                .ThenInclude(s => s.VehicleAssignments.Where(va => va.IsActive))
                    .ThenInclude(va => va.Vehicle)
            .Include(b => b.Shipments)
                .ThenInclude(s => s.VehicleAssignments.Where(va => va.IsActive))
                    .ThenInclude(va => va.Driver)
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);

        if (booking == null)
        {
            return ApiResponse<BookingDetailDto>.FailureResult("Booking not found.");
        }

        var detail = new BookingDetailDto
        {
            Id = booking.Id,
            BookingNumber = booking.BookingNumber,
            CustomerId = booking.CustomerId,
            CustomerName = booking.Customer.CompanyName,
            CustomerCode = booking.Customer.CustomerCode,
            BookingDate = booking.BookingDate,
            PickupAddress = booking.PickupAddress,
            PickupCity = booking.PickupCity,
            DeliveryAddress = booking.DeliveryAddress,
            DeliveryCity = booking.DeliveryCity,
            PickupDate = booking.PickupDate,
            ExpectedDeliveryDate = booking.ExpectedDeliveryDate,
            CargoDescription = booking.CargoDescription,
            CargoWeight = booking.CargoWeight,
            NumberOfPackages = booking.NumberOfPackages,
            SpecialInstructions = booking.SpecialInstructions,
            FreightAmount = booking.FreightAmount,
            PaymentType = booking.PaymentType,
            Status = booking.Status,
            ShipmentsCount = booking.Shipments.Count,
            IsActive = booking.IsActive,
            Shipments = booking.Shipments.Select(s => new BookingShipmentSummaryDto
            {
                Id = s.Id,
                ShipmentNumber = s.ShipmentNumber,
                TrackingNumber = s.TrackingNumber,
                CurrentLocation = s.CurrentLocation,
                CurrentStatus = s.CurrentStatus.ToString(),
                EstimatedDeliveryDate = s.EstimatedDeliveryDate,
                AssignedVehicle = s.VehicleAssignments.FirstOrDefault()?.Vehicle.VehicleNumber,
                AssignedDriver = s.VehicleAssignments.FirstOrDefault()?.Driver.Name
            }).ToList()
        };

        return ApiResponse<BookingDetailDto>.SuccessResult(detail);
    }

    public async Task<ApiResponse<BookingDto>> CreateBookingAsync(CreateBookingDto dto, string? createdBy = null, CancellationToken cancellationToken = default)
    {
        var customer = await _context.Customers.FindAsync(new object[] { dto.CustomerId }, cancellationToken);
        if (customer == null)
        {
            return ApiResponse<BookingDto>.FailureResult("Invalid Customer ID.");
        }

        var currentYear = DateTime.UtcNow.Year;
        var bookingsCount = await _context.Bookings.CountAsync(cancellationToken);
        var bookingNumber = $"BK-{currentYear}-{(bookingsCount + 1):D6}";

        var booking = new Booking
        {
            BookingNumber = bookingNumber,
            CustomerId = dto.CustomerId,
            BookingDate = DateTime.UtcNow,
            PickupAddress = dto.PickupAddress.Trim(),
            PickupCity = dto.PickupCity.Trim(),
            DeliveryAddress = dto.DeliveryAddress.Trim(),
            DeliveryCity = dto.DeliveryCity.Trim(),
            PickupDate = dto.PickupDate,
            ExpectedDeliveryDate = dto.ExpectedDeliveryDate,
            CargoDescription = dto.CargoDescription.Trim(),
            CargoWeight = dto.CargoWeight,
            NumberOfPackages = dto.NumberOfPackages,
            SpecialInstructions = dto.SpecialInstructions?.Trim(),
            FreightAmount = dto.FreightAmount,
            PaymentType = dto.PaymentType.Trim(),
            Status = BookingStatus.Confirmed,
            CreatedBy = createdBy,
            IsActive = true
        };

        _context.Bookings.Add(booking);
        await _context.SaveChangesAsync(cancellationToken);

        // If AutoCreateShipment is enabled, generate the initial shipment
        if (dto.AutoCreateShipment)
        {
            var shipmentsCount = await _context.Shipments.CountAsync(cancellationToken);
            var shipmentNumber = $"SH-{currentYear}-{(shipmentsCount + 1):D6}";
            var trackingNumber = $"LT{currentYear}{(shipmentsCount + 1):D6}";

            var shipment = new Shipment
            {
                ShipmentNumber = shipmentNumber,
                BookingId = booking.Id,
                TrackingNumber = trackingNumber,
                Origin = booking.PickupCity,
                Destination = booking.DeliveryCity,
                CurrentLocation = $"{booking.PickupCity} Depot (Awaiting Assignment)",
                CurrentStatus = ShipmentStatus.Created,
                EstimatedDeliveryDate = booking.ExpectedDeliveryDate,
                CreatedBy = createdBy,
                IsActive = true
            };

            _context.Shipments.Add(shipment);
            await _context.SaveChangesAsync(cancellationToken);

            // Add Initial Status History
            _context.ShipmentStatusHistories.Add(new ShipmentStatusHistory
            {
                ShipmentId = shipment.Id,
                Status = ShipmentStatus.Created,
                Location = shipment.CurrentLocation,
                Remarks = "Shipment auto-generated from booking",
                UpdatedBy = createdBy ?? "System",
                UpdatedAt = DateTime.UtcNow
            });
        }

        _context.AuditLogs.Add(new AuditLog
        {
            UserName = createdBy,
            Action = "Create Booking",
            Entity = "Booking",
            EntityId = booking.BookingNumber,
            Timestamp = DateTime.UtcNow,
            Details = $"Created booking {booking.BookingNumber} for {customer.CompanyName}"
        });

        await _context.SaveChangesAsync(cancellationToken);

        var resultDto = new BookingDto
        {
            Id = booking.Id,
            BookingNumber = booking.BookingNumber,
            CustomerId = booking.CustomerId,
            CustomerName = customer.CompanyName,
            CustomerCode = customer.CustomerCode,
            BookingDate = booking.BookingDate,
            PickupAddress = booking.PickupAddress,
            PickupCity = booking.PickupCity,
            DeliveryAddress = booking.DeliveryAddress,
            DeliveryCity = booking.DeliveryCity,
            PickupDate = booking.PickupDate,
            ExpectedDeliveryDate = booking.ExpectedDeliveryDate,
            CargoDescription = booking.CargoDescription,
            CargoWeight = booking.CargoWeight,
            NumberOfPackages = booking.NumberOfPackages,
            SpecialInstructions = booking.SpecialInstructions,
            FreightAmount = booking.FreightAmount,
            PaymentType = booking.PaymentType,
            Status = booking.Status,
            ShipmentsCount = dto.AutoCreateShipment ? 1 : 0,
            IsActive = booking.IsActive
        };

        return ApiResponse<BookingDto>.SuccessResult(resultDto, "Booking created successfully.");
    }

    public async Task<ApiResponse<BookingDto>> UpdateBookingStatusAsync(int id, UpdateBookingStatusDto dto, string? updatedBy = null, CancellationToken cancellationToken = default)
    {
        var booking = await _context.Bookings
            .Include(b => b.Customer)
            .Include(b => b.Shipments)
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);

        if (booking == null)
        {
            return ApiResponse<BookingDto>.FailureResult("Booking not found.");
        }

        booking.Status = dto.Status;
        booking.UpdatedBy = updatedBy;

        _context.AuditLogs.Add(new AuditLog
        {
            UserName = updatedBy,
            Action = "Update Booking Status",
            Entity = "Booking",
            EntityId = booking.BookingNumber,
            Timestamp = DateTime.UtcNow,
            Details = $"Booking {booking.BookingNumber} status updated to {dto.Status}. Remarks: {dto.Remarks}"
        });

        await _context.SaveChangesAsync(cancellationToken);

        var resultDto = new BookingDto
        {
            Id = booking.Id,
            BookingNumber = booking.BookingNumber,
            CustomerId = booking.CustomerId,
            CustomerName = booking.Customer.CompanyName,
            CustomerCode = booking.Customer.CustomerCode,
            BookingDate = booking.BookingDate,
            PickupAddress = booking.PickupAddress,
            PickupCity = booking.PickupCity,
            DeliveryAddress = booking.DeliveryAddress,
            DeliveryCity = booking.DeliveryCity,
            PickupDate = booking.PickupDate,
            ExpectedDeliveryDate = booking.ExpectedDeliveryDate,
            CargoDescription = booking.CargoDescription,
            CargoWeight = booking.CargoWeight,
            NumberOfPackages = booking.NumberOfPackages,
            SpecialInstructions = booking.SpecialInstructions,
            FreightAmount = booking.FreightAmount,
            PaymentType = booking.PaymentType,
            Status = booking.Status,
            ShipmentsCount = booking.Shipments.Count,
            IsActive = booking.IsActive
        };

        return ApiResponse<BookingDto>.SuccessResult(resultDto, "Booking status updated.");
    }

    public async Task<ApiResponse<bool>> CancelBookingAsync(int id, string? cancelledBy = null, CancellationToken cancellationToken = default)
    {
        var booking = await _context.Bookings.FindAsync(new object[] { id }, cancellationToken);
        if (booking == null)
        {
            return ApiResponse<bool>.FailureResult("Booking not found.");
        }

        if (booking.Status == BookingStatus.Delivered)
        {
            return ApiResponse<bool>.FailureResult("Delivered bookings cannot be cancelled.");
        }

        booking.Status = BookingStatus.Cancelled;
        booking.UpdatedBy = cancelledBy;

        _context.AuditLogs.Add(new AuditLog
        {
            UserName = cancelledBy,
            Action = "Cancel Booking",
            Entity = "Booking",
            EntityId = booking.BookingNumber,
            Timestamp = DateTime.UtcNow,
            Details = $"Cancelled booking {booking.BookingNumber}"
        });

        await _context.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.SuccessResult(true, "Booking cancelled successfully.");
    }
}
