using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Customer;
using LogiTrack.Application.Interfaces;
using LogiTrack.Domain.Entities;
using LogiTrack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LogiTrack.Infrastructure.Services;

public class CustomerService : ICustomerService
{
    private readonly LogiTrackDbContext _context;

    public CustomerService(LogiTrackDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<PagedResult<CustomerDto>>> GetCustomersAsync(CustomerQueryParameters queryParams, CancellationToken cancellationToken = default)
    {
        var query = _context.Customers.AsNoTracking().AsQueryable();

        if (queryParams.IsActive.HasValue)
        {
            query = query.Where(c => c.IsActive == queryParams.IsActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(queryParams.City))
        {
            var city = queryParams.City.Trim().ToLower();
            query = query.Where(c => c.City.ToLower().Contains(city));
        }

        if (!string.IsNullOrWhiteSpace(queryParams.Search))
        {
            var search = queryParams.Search.Trim().ToLower();
            query = query.Where(c =>
                c.CustomerCode.ToLower().Contains(search) ||
                c.CompanyName.ToLower().Contains(search) ||
                c.ContactPerson.ToLower().Contains(search) ||
                c.Phone.Contains(search) ||
                c.Email.ToLower().Contains(search) ||
                c.City.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        // Sorting
        query = queryParams.SortBy?.ToLower() switch
        {
            "companyname" => queryParams.IsAscending ? query.OrderBy(c => c.CompanyName) : query.OrderByDescending(c => c.CompanyName),
            "customercode" => queryParams.IsAscending ? query.OrderBy(c => c.CustomerCode) : query.OrderByDescending(c => c.CustomerCode),
            "city" => queryParams.IsAscending ? query.OrderBy(c => c.City) : query.OrderByDescending(c => c.City),
            _ => queryParams.IsAscending ? query.OrderBy(c => c.Id) : query.OrderByDescending(c => c.Id)
        };

        var items = await query
            .Skip((queryParams.PageNumber - 1) * queryParams.PageSize)
            .Take(queryParams.PageSize)
            .Select(c => new CustomerDto
            {
                Id = c.Id,
                CustomerCode = c.CustomerCode,
                CompanyName = c.CompanyName,
                ContactPerson = c.ContactPerson,
                Phone = c.Phone,
                Email = c.Email,
                Address = c.Address,
                City = c.City,
                State = c.State,
                Pincode = c.Pincode,
                GSTNumber = c.GSTNumber,
                IsActive = c.IsActive,
                CreatedAt = c.CreatedAt,
                TotalBookings = c.Bookings.Count
            })
            .ToListAsync(cancellationToken);

        var pagedResult = new PagedResult<CustomerDto>(items, totalCount, queryParams.PageNumber, queryParams.PageSize);
        return ApiResponse<PagedResult<CustomerDto>>.SuccessResult(pagedResult);
    }

    public async Task<ApiResponse<CustomerDetailDto>> GetCustomerByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var customer = await _context.Customers
            .AsNoTracking()
            .Include(c => c.Bookings)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (customer == null)
        {
            return ApiResponse<CustomerDetailDto>.FailureResult("Customer not found.");
        }

        var detail = new CustomerDetailDto
        {
            Id = customer.Id,
            CustomerCode = customer.CustomerCode,
            CompanyName = customer.CompanyName,
            ContactPerson = customer.ContactPerson,
            Phone = customer.Phone,
            Email = customer.Email,
            Address = customer.Address,
            City = customer.City,
            State = customer.State,
            Pincode = customer.Pincode,
            GSTNumber = customer.GSTNumber,
            IsActive = customer.IsActive,
            CreatedAt = customer.CreatedAt,
            TotalBookings = customer.Bookings.Count,
            RecentBookings = customer.Bookings
                .OrderByDescending(b => b.BookingDate)
                .Take(10)
                .Select(b => new CustomerBookingSummaryDto
                {
                    Id = b.Id,
                    BookingNumber = b.BookingNumber,
                    BookingDate = b.BookingDate,
                    OriginCity = b.PickupCity,
                    DestinationCity = b.DeliveryCity,
                    FreightAmount = b.FreightAmount,
                    Status = b.Status.ToString()
                }).ToList()
        };

        return ApiResponse<CustomerDetailDto>.SuccessResult(detail);
    }

    public async Task<ApiResponse<CustomerDto>> CreateCustomerAsync(CreateCustomerDto dto, string? createdBy = null, CancellationToken cancellationToken = default)
    {
        // Auto-generate CustomerCode if not provided
        var code = dto.CustomerCode?.Trim();
        if (string.IsNullOrWhiteSpace(code))
        {
            var count = await _context.Customers.CountAsync(cancellationToken);
            code = $"CUST-{(count + 1):D4}";
        }

        var exists = await _context.Customers.AnyAsync(c => c.CustomerCode == code, cancellationToken);
        if (exists)
        {
            return ApiResponse<CustomerDto>.FailureResult($"Customer code '{code}' already exists.");
        }

        var customer = new Customer
        {
            CustomerCode = code,
            CompanyName = dto.CompanyName.Trim(),
            ContactPerson = dto.ContactPerson.Trim(),
            Phone = dto.Phone.Trim(),
            Email = dto.Email.Trim(),
            Address = dto.Address.Trim(),
            City = dto.City.Trim(),
            State = dto.State.Trim(),
            Pincode = dto.Pincode.Trim(),
            GSTNumber = dto.GSTNumber?.Trim(),
            CreatedBy = createdBy,
            IsActive = true
        };

        _context.Customers.Add(customer);

        _context.AuditLogs.Add(new AuditLog
        {
            UserName = createdBy,
            Action = "Create Customer",
            Entity = "Customer",
            EntityId = customer.CustomerCode,
            Timestamp = DateTime.UtcNow,
            Details = $"Created customer {customer.CompanyName} ({customer.CustomerCode})"
        });

        await _context.SaveChangesAsync(cancellationToken);

        var resultDto = new CustomerDto
        {
            Id = customer.Id,
            CustomerCode = customer.CustomerCode,
            CompanyName = customer.CompanyName,
            ContactPerson = customer.ContactPerson,
            Phone = customer.Phone,
            Email = customer.Email,
            Address = customer.Address,
            City = customer.City,
            State = customer.State,
            Pincode = customer.Pincode,
            GSTNumber = customer.GSTNumber,
            IsActive = customer.IsActive,
            CreatedAt = customer.CreatedAt,
            TotalBookings = 0
        };

        return ApiResponse<CustomerDto>.SuccessResult(resultDto, "Customer created successfully.");
    }

    public async Task<ApiResponse<CustomerDto>> UpdateCustomerAsync(int id, UpdateCustomerDto dto, string? updatedBy = null, CancellationToken cancellationToken = default)
    {
        var customer = await _context.Customers.FindAsync(new object[] { id }, cancellationToken);
        if (customer == null)
        {
            return ApiResponse<CustomerDto>.FailureResult("Customer not found.");
        }

        if (!string.IsNullOrWhiteSpace(dto.CustomerCode) && dto.CustomerCode != customer.CustomerCode)
        {
            var codeExists = await _context.Customers.AnyAsync(c => c.CustomerCode == dto.CustomerCode && c.Id != id, cancellationToken);
            if (codeExists)
            {
                return ApiResponse<CustomerDto>.FailureResult($"Customer code '{dto.CustomerCode}' is already in use.");
            }
            customer.CustomerCode = dto.CustomerCode.Trim();
        }

        customer.CompanyName = dto.CompanyName.Trim();
        customer.ContactPerson = dto.ContactPerson.Trim();
        customer.Phone = dto.Phone.Trim();
        customer.Email = dto.Email.Trim();
        customer.Address = dto.Address.Trim();
        customer.City = dto.City.Trim();
        customer.State = dto.State.Trim();
        customer.Pincode = dto.Pincode.Trim();
        customer.GSTNumber = dto.GSTNumber?.Trim();
        customer.IsActive = dto.IsActive;
        customer.UpdatedBy = updatedBy;

        _context.AuditLogs.Add(new AuditLog
        {
            UserName = updatedBy,
            Action = "Update Customer",
            Entity = "Customer",
            EntityId = customer.CustomerCode,
            Timestamp = DateTime.UtcNow,
            Details = $"Updated customer {customer.CompanyName} ({customer.CustomerCode})"
        });

        await _context.SaveChangesAsync(cancellationToken);

        var resultDto = new CustomerDto
        {
            Id = customer.Id,
            CustomerCode = customer.CustomerCode,
            CompanyName = customer.CompanyName,
            ContactPerson = customer.ContactPerson,
            Phone = customer.Phone,
            Email = customer.Email,
            Address = customer.Address,
            City = customer.City,
            State = customer.State,
            Pincode = customer.Pincode,
            GSTNumber = customer.GSTNumber,
            IsActive = customer.IsActive,
            CreatedAt = customer.CreatedAt,
            TotalBookings = await _context.Bookings.CountAsync(b => b.CustomerId == customer.Id, cancellationToken)
        };

        return ApiResponse<CustomerDto>.SuccessResult(resultDto, "Customer updated successfully.");
    }

    public async Task<ApiResponse<bool>> DeleteCustomerAsync(int id, string? deletedBy = null, CancellationToken cancellationToken = default)
    {
        var customer = await _context.Customers.FindAsync(new object[] { id }, cancellationToken);
        if (customer == null)
        {
            return ApiResponse<bool>.FailureResult("Customer not found.");
        }

        // Soft delete
        customer.IsActive = false;
        customer.UpdatedBy = deletedBy;

        _context.AuditLogs.Add(new AuditLog
        {
            UserName = deletedBy,
            Action = "Deactivate Customer",
            Entity = "Customer",
            EntityId = customer.CustomerCode,
            Timestamp = DateTime.UtcNow,
            Details = $"Deactivated customer {customer.CompanyName} ({customer.CustomerCode})"
        });

        await _context.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.SuccessResult(true, "Customer deactivated successfully.");
    }
}
