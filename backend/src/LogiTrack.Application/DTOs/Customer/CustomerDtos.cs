using LogiTrack.Application.Common;

namespace LogiTrack.Application.DTOs.Customer;

public class CustomerDto
{
    public int Id { get; set; }
    public string CustomerCode { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string ContactPerson { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string Pincode { get; set; } = string.Empty;
    public string? GSTNumber { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public int TotalBookings { get; set; }
}

public class CustomerDetailDto : CustomerDto
{
    public List<CustomerBookingSummaryDto> RecentBookings { get; set; } = new();
}

public class CustomerBookingSummaryDto
{
    public int Id { get; set; }
    public string BookingNumber { get; set; } = string.Empty;
    public DateTime BookingDate { get; set; }
    public string OriginCity { get; set; } = string.Empty;
    public string DestinationCity { get; set; } = string.Empty;
    public decimal FreightAmount { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class CreateCustomerDto
{
    public string? CustomerCode { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string ContactPerson { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string Pincode { get; set; } = string.Empty;
    public string? GSTNumber { get; set; }
}

public class UpdateCustomerDto : CreateCustomerDto
{
    public bool IsActive { get; set; } = true;
}

public class CustomerQueryParameters : PaginationParams
{
    public string? City { get; set; }
    public bool? IsActive { get; set; }
}
