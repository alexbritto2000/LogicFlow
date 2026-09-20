using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Booking;

namespace LogiTrack.Application.Interfaces;

public interface IBookingService
{
    Task<ApiResponse<PagedResult<BookingDto>>> GetBookingsAsync(BookingQueryParameters queryParams, CancellationToken cancellationToken = default);
    Task<ApiResponse<BookingDetailDto>> GetBookingByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<BookingDto>> CreateBookingAsync(CreateBookingDto dto, string? createdBy = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<BookingDto>> UpdateBookingStatusAsync(int id, UpdateBookingStatusDto dto, string? updatedBy = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> CancelBookingAsync(int id, string? cancelledBy = null, CancellationToken cancellationToken = default);
}
