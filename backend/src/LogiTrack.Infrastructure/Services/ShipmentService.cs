using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Shipment;
using LogiTrack.Application.Interfaces;
using LogiTrack.Domain.Entities;
using LogiTrack.Domain.Enums;
using LogiTrack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LogiTrack.Infrastructure.Services;

public class ShipmentService : IShipmentService
{
    private readonly LogiTrackDbContext _context;

    public ShipmentService(LogiTrackDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<PagedResult<ShipmentDto>>> GetShipmentsAsync(ShipmentQueryParameters queryParams, CancellationToken cancellationToken = default)
    {
        var query = _context.Shipments
            .AsNoTracking()
            .Include(s => s.Booking)
                .ThenInclude(b => b.Customer)
            .Include(s => s.VehicleAssignments.Where(va => va.IsActive))
                .ThenInclude(va => va.Vehicle)
            .Include(s => s.VehicleAssignments.Where(va => va.IsActive))
                .ThenInclude(va => va.Driver)
            .AsQueryable();

        if (queryParams.BookingId.HasValue)
        {
            query = query.Where(s => s.BookingId == queryParams.BookingId.Value);
        }

        if (queryParams.Status.HasValue)
        {
            query = query.Where(s => s.CurrentStatus == queryParams.Status.Value);
        }

        if (queryParams.VehicleId.HasValue)
        {
            query = query.Where(s => s.VehicleAssignments.Any(va => va.VehicleId == queryParams.VehicleId.Value && va.IsActive));
        }

        if (queryParams.DriverId.HasValue)
        {
            query = query.Where(s => s.VehicleAssignments.Any(va => va.DriverId == queryParams.DriverId.Value && va.IsActive));
        }

        if (!string.IsNullOrWhiteSpace(queryParams.Search))
        {
            var search = queryParams.Search.Trim().ToLower();
            query = query.Where(s =>
                s.ShipmentNumber.ToLower().Contains(search) ||
                s.TrackingNumber.ToLower().Contains(search) ||
                s.Booking.BookingNumber.ToLower().Contains(search) ||
                s.Booking.Customer.CompanyName.ToLower().Contains(search) ||
                s.Origin.ToLower().Contains(search) ||
                s.Destination.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        query = queryParams.SortBy?.ToLower() switch
        {
            "shipmentnumber" => queryParams.IsAscending ? query.OrderBy(s => s.ShipmentNumber) : query.OrderByDescending(s => s.ShipmentNumber),
            "trackingnumber" => queryParams.IsAscending ? query.OrderBy(s => s.TrackingNumber) : query.OrderByDescending(s => s.TrackingNumber),
            "status" => queryParams.IsAscending ? query.OrderBy(s => s.CurrentStatus) : query.OrderByDescending(s => s.CurrentStatus),
            "estimateddelivery" => queryParams.IsAscending ? query.OrderBy(s => s.EstimatedDeliveryDate) : query.OrderByDescending(s => s.EstimatedDeliveryDate),
            _ => queryParams.IsAscending ? query.OrderBy(s => s.Id) : query.OrderByDescending(s => s.Id)
        };

        var shipments = await query
            .Skip((queryParams.PageNumber - 1) * queryParams.PageSize)
            .Take(queryParams.PageSize)
            .ToListAsync(cancellationToken);

        var items = shipments.Select(s =>
        {
            var activeAssignment = s.VehicleAssignments.FirstOrDefault(va => va.IsActive);
            return new ShipmentDto
            {
                Id = s.Id,
                ShipmentNumber = s.ShipmentNumber,
                BookingId = s.BookingId,
                BookingNumber = s.Booking.BookingNumber,
                CustomerName = s.Booking.Customer.CompanyName,
                TrackingNumber = s.TrackingNumber,
                Origin = s.Origin,
                Destination = s.Destination,
                CurrentLocation = s.CurrentLocation,
                CurrentStatus = s.CurrentStatus,
                EstimatedDeliveryDate = s.EstimatedDeliveryDate,
                ActualDeliveryDate = s.ActualDeliveryDate,
                AssignedVehicleNumber = activeAssignment?.Vehicle?.VehicleNumber,
                AssignedDriverName = activeAssignment?.Driver?.Name,
                AssignedDriverPhone = activeAssignment?.Driver?.Phone,
                CreatedAt = s.CreatedAt
            };
        }).ToList();

        var pagedResult = new PagedResult<ShipmentDto>(items, totalCount, queryParams.PageNumber, queryParams.PageSize);
        return ApiResponse<PagedResult<ShipmentDto>>.SuccessResult(pagedResult);
    }

    public async Task<ApiResponse<ShipmentDetailDto>> GetShipmentByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var s = await _context.Shipments
            .AsNoTracking()
            .Include(x => x.Booking)
                .ThenInclude(b => b.Customer)
            .Include(x => x.StatusHistories)
            .Include(x => x.VehicleAssignments)
                .ThenInclude(va => va.Vehicle)
            .Include(x => x.VehicleAssignments)
                .ThenInclude(va => va.Driver)
            .Include(x => x.Deliveries)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (s == null)
        {
            return ApiResponse<ShipmentDetailDto>.FailureResult("Shipment not found.");
        }

        var activeAssignment = s.VehicleAssignments.FirstOrDefault(va => va.IsActive);
        var lastDelivery = s.Deliveries.OrderByDescending(d => d.DeliveryDate).FirstOrDefault();

        var detail = new ShipmentDetailDto
        {
            Id = s.Id,
            ShipmentNumber = s.ShipmentNumber,
            BookingId = s.BookingId,
            BookingNumber = s.Booking.BookingNumber,
            CustomerName = s.Booking.Customer.CompanyName,
            TrackingNumber = s.TrackingNumber,
            Origin = s.Origin,
            Destination = s.Destination,
            CurrentLocation = s.CurrentLocation,
            CurrentStatus = s.CurrentStatus,
            EstimatedDeliveryDate = s.EstimatedDeliveryDate,
            ActualDeliveryDate = s.ActualDeliveryDate,
            AssignedVehicleNumber = activeAssignment?.Vehicle?.VehicleNumber,
            AssignedDriverName = activeAssignment?.Driver?.Name,
            AssignedDriverPhone = activeAssignment?.Driver?.Phone,
            CreatedAt = s.CreatedAt,
            PickupAddress = s.Booking.PickupAddress,
            DeliveryAddress = s.Booking.DeliveryAddress,
            CargoDescription = s.Booking.CargoDescription,
            CargoWeight = s.Booking.CargoWeight,
            NumberOfPackages = s.Booking.NumberOfPackages,
            FreightAmount = s.Booking.FreightAmount,
            StatusHistories = s.StatusHistories
                .OrderBy(sh => sh.UpdatedAt)
                .Select(sh => new ShipmentStatusHistoryDto
                {
                    Id = sh.Id,
                    Status = sh.Status,
                    Location = sh.Location,
                    Remarks = sh.Remarks,
                    UpdatedBy = sh.UpdatedBy,
                    UpdatedAt = sh.UpdatedAt
                }).ToList(),
            AssignmentHistories = s.VehicleAssignments
                .OrderByDescending(va => va.AssignedDate)
                .Select(va => new ShipmentAssignmentHistoryDto
                {
                    Id = va.Id,
                    VehicleId = va.VehicleId,
                    VehicleNumber = va.Vehicle.VehicleNumber,
                    DriverId = va.DriverId,
                    DriverName = va.Driver.Name,
                    DriverPhone = va.Driver.Phone,
                    AssignedDate = va.AssignedDate,
                    ReleasedDate = va.ReleasedDate,
                    IsActive = va.IsActive,
                    Notes = va.Notes
                }).ToList(),
            DeliveryInfo = lastDelivery != null ? new DeliveryInfoSummaryDto
            {
                DeliveryDate = lastDelivery.DeliveryDate,
                ReceiverName = lastDelivery.ReceiverName,
                ReceiverPhone = lastDelivery.ReceiverPhone,
                DeliveryRemarks = lastDelivery.DeliveryRemarks,
                ProofOfDeliveryFile = lastDelivery.ProofOfDeliveryFile,
                DeliveredBy = lastDelivery.DeliveredBy
            } : null
        };

        return ApiResponse<ShipmentDetailDto>.SuccessResult(detail);
    }

    public async Task<ApiResponse<TrackingResultDto>> TrackByNumberAsync(string trackingNumber, CancellationToken cancellationToken = default)
    {
        var cleanNumber = trackingNumber.Trim().ToUpper();

        var s = await _context.Shipments
            .AsNoTracking()
            .Include(x => x.Booking)
                .ThenInclude(b => b.Customer)
            .Include(x => x.StatusHistories)
            .Include(x => x.VehicleAssignments.Where(va => va.IsActive))
                .ThenInclude(va => va.Vehicle)
            .Include(x => x.VehicleAssignments.Where(va => va.IsActive))
                .ThenInclude(va => va.Driver)
            .FirstOrDefaultAsync(x => x.TrackingNumber == cleanNumber || x.ShipmentNumber == cleanNumber, cancellationToken);

        if (s == null)
        {
            return ApiResponse<TrackingResultDto>.FailureResult($"No shipment found with tracking number '{trackingNumber}'.");
        }

        var activeAssignment = s.VehicleAssignments.FirstOrDefault(va => va.IsActive);

        var result = new TrackingResultDto
        {
            TrackingNumber = s.TrackingNumber,
            ShipmentNumber = s.ShipmentNumber,
            BookingNumber = s.Booking.BookingNumber,
            CustomerName = s.Booking.Customer.CompanyName,
            Origin = s.Origin,
            Destination = s.Destination,
            CurrentLocation = s.CurrentLocation,
            CurrentStatus = s.CurrentStatus.ToString(),
            EstimatedDeliveryDate = s.EstimatedDeliveryDate,
            ActualDeliveryDate = s.ActualDeliveryDate,
            AssignedVehicle = activeAssignment?.Vehicle?.VehicleNumber,
            AssignedDriver = activeAssignment?.Driver?.Name,
            Timeline = s.StatusHistories
                .OrderBy(sh => sh.UpdatedAt)
                .Select(sh => new ShipmentStatusHistoryDto
                {
                    Id = sh.Id,
                    Status = sh.Status,
                    Location = sh.Location,
                    Remarks = sh.Remarks,
                    UpdatedBy = sh.UpdatedBy,
                    UpdatedAt = sh.UpdatedAt
                }).ToList()
        };

        return ApiResponse<TrackingResultDto>.SuccessResult(result);
    }

    public async Task<ApiResponse<ShipmentDto>> CreateShipmentAsync(CreateShipmentDto dto, string? createdBy = null, CancellationToken cancellationToken = default)
    {
        var booking = await _context.Bookings
            .Include(b => b.Customer)
            .FirstOrDefaultAsync(b => b.Id == dto.BookingId, cancellationToken);

        if (booking == null)
        {
            return ApiResponse<ShipmentDto>.FailureResult("Invalid Booking ID.");
        }

        var currentYear = DateTime.UtcNow.Year;
        var shipmentsCount = await _context.Shipments.CountAsync(cancellationToken);
        var shipmentNumber = $"SH-{currentYear}-{(shipmentsCount + 1):D6}";
        var trackingNumber = $"LT{currentYear}{(shipmentsCount + 1):D6}";

        var shipment = new Shipment
        {
            ShipmentNumber = shipmentNumber,
            BookingId = dto.BookingId,
            TrackingNumber = trackingNumber,
            Origin = string.IsNullOrWhiteSpace(dto.Origin) ? booking.PickupCity : dto.Origin.Trim(),
            Destination = string.IsNullOrWhiteSpace(dto.Destination) ? booking.DeliveryCity : dto.Destination.Trim(),
            CurrentLocation = string.IsNullOrWhiteSpace(dto.CurrentLocation) ? $"{booking.PickupCity} Depot" : dto.CurrentLocation.Trim(),
            CurrentStatus = ShipmentStatus.Created,
            EstimatedDeliveryDate = dto.EstimatedDeliveryDate,
            CreatedBy = createdBy,
            IsActive = true
        };

        _context.Shipments.Add(shipment);
        await _context.SaveChangesAsync(cancellationToken);

        _context.ShipmentStatusHistories.Add(new ShipmentStatusHistory
        {
            ShipmentId = shipment.Id,
            Status = ShipmentStatus.Created,
            Location = shipment.CurrentLocation,
            Remarks = "Shipment created",
            UpdatedBy = createdBy,
            UpdatedAt = DateTime.UtcNow
        });

        _context.AuditLogs.Add(new AuditLog
        {
            UserName = createdBy,
            Action = "Create Shipment",
            Entity = "Shipment",
            EntityId = shipment.ShipmentNumber,
            Timestamp = DateTime.UtcNow,
            Details = $"Created shipment {shipment.ShipmentNumber} ({shipment.TrackingNumber}) for booking {booking.BookingNumber}"
        });

        await _context.SaveChangesAsync(cancellationToken);

        var resultDto = new ShipmentDto
        {
            Id = shipment.Id,
            ShipmentNumber = shipment.ShipmentNumber,
            BookingId = shipment.BookingId,
            BookingNumber = booking.BookingNumber,
            CustomerName = booking.Customer.CompanyName,
            TrackingNumber = shipment.TrackingNumber,
            Origin = shipment.Origin,
            Destination = shipment.Destination,
            CurrentLocation = shipment.CurrentLocation,
            CurrentStatus = shipment.CurrentStatus,
            EstimatedDeliveryDate = shipment.EstimatedDeliveryDate,
            CreatedAt = shipment.CreatedAt
        };

        return ApiResponse<ShipmentDto>.SuccessResult(resultDto, "Shipment created successfully.");
    }

    public async Task<ApiResponse<ShipmentDto>> UpdateShipmentStatusAsync(int id, UpdateShipmentStatusRequest request, string? updatedBy = null, CancellationToken cancellationToken = default)
    {
        var shipment = await _context.Shipments
            .Include(s => s.Booking)
                .ThenInclude(b => b.Customer)
            .Include(s => s.VehicleAssignments.Where(va => va.IsActive))
                .ThenInclude(va => va.Vehicle)
            .Include(s => s.VehicleAssignments.Where(va => va.IsActive))
                .ThenInclude(va => va.Driver)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

        if (shipment == null)
        {
            return ApiResponse<ShipmentDto>.FailureResult("Shipment not found.");
        }

        shipment.CurrentStatus = request.Status;
        if (!string.IsNullOrWhiteSpace(request.Location))
        {
            shipment.CurrentLocation = request.Location.Trim();
        }
        shipment.UpdatedBy = updatedBy;

        // Auto sync with Booking status if matching
        if (request.Status == ShipmentStatus.PickedUp)
        {
            shipment.Booking.Status = BookingStatus.PickedUp;
        }
        else if (request.Status == ShipmentStatus.InTransit)
        {
            shipment.Booking.Status = BookingStatus.InTransit;
        }
        else if (request.Status == ShipmentStatus.OutForDelivery)
        {
            shipment.Booking.Status = BookingStatus.OutForDelivery;
        }

        // Add history timeline
        _context.ShipmentStatusHistories.Add(new ShipmentStatusHistory
        {
            ShipmentId = shipment.Id,
            Status = request.Status,
            Location = shipment.CurrentLocation,
            Remarks = request.Remarks?.Trim(),
            UpdatedBy = updatedBy,
            UpdatedAt = DateTime.UtcNow
        });

        _context.AuditLogs.Add(new AuditLog
        {
            UserName = updatedBy,
            Action = "Update Shipment Status",
            Entity = "Shipment",
            EntityId = shipment.ShipmentNumber,
            Timestamp = DateTime.UtcNow,
            Details = $"Shipment {shipment.ShipmentNumber} status changed to {request.Status} at {shipment.CurrentLocation}. Remarks: {request.Remarks}"
        });

        await _context.SaveChangesAsync(cancellationToken);

        var activeAssignment = shipment.VehicleAssignments.FirstOrDefault(va => va.IsActive);
        var resultDto = new ShipmentDto
        {
            Id = shipment.Id,
            ShipmentNumber = shipment.ShipmentNumber,
            BookingId = shipment.BookingId,
            BookingNumber = shipment.Booking.BookingNumber,
            CustomerName = shipment.Booking.Customer.CompanyName,
            TrackingNumber = shipment.TrackingNumber,
            Origin = shipment.Origin,
            Destination = shipment.Destination,
            CurrentLocation = shipment.CurrentLocation,
            CurrentStatus = shipment.CurrentStatus,
            EstimatedDeliveryDate = shipment.EstimatedDeliveryDate,
            ActualDeliveryDate = shipment.ActualDeliveryDate,
            AssignedVehicleNumber = activeAssignment?.Vehicle?.VehicleNumber,
            AssignedDriverName = activeAssignment?.Driver?.Name,
            AssignedDriverPhone = activeAssignment?.Driver?.Phone,
            CreatedAt = shipment.CreatedAt
        };

        return ApiResponse<ShipmentDto>.SuccessResult(resultDto, "Shipment status updated successfully.");
    }
}
