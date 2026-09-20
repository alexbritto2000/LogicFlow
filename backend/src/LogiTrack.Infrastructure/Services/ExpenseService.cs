using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Expense;
using LogiTrack.Application.Interfaces;
using LogiTrack.Domain.Entities;
using LogiTrack.Domain.Enums;
using LogiTrack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LogiTrack.Infrastructure.Services;

public class ExpenseService : IExpenseService
{
    private readonly LogiTrackDbContext _context;
    private readonly IFileStorageService _fileStorage;

    public ExpenseService(LogiTrackDbContext context, IFileStorageService fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
    }

    public async Task<ExpenseDto> RecordExpenseAsync(CreateExpenseDto dto, string? recordedBy = null)
    {
        if (dto.Amount <= 0)
        {
            throw new ArgumentException("Expense amount must be greater than zero.");
        }

        string? receiptPath = null;
        if (dto.ReceiptFile != null && dto.ReceiptFile.Length > 0)
        {
            receiptPath = await _fileStorage.SaveFileAsync(dto.ReceiptFile, "expenses");
        }

        var expense = new Expense
        {
            VehicleId = dto.VehicleId,
            ShipmentId = dto.ShipmentId,
            ExpenseType = dto.ExpenseType,
            Amount = dto.Amount,
            ExpenseDate = dto.ExpenseDate,
            Description = dto.Description,
            ReceiptFile = receiptPath,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = recordedBy
        };

        _context.Expenses.Add(expense);

        _context.AuditLogs.Add(new AuditLog
        {
            Action = "RECORD_EXPENSE",
            Entity = "Expense",
            UserName = recordedBy,
            Timestamp = DateTime.UtcNow,
            Details = $"Recorded expense of {dto.Amount:C} ({dto.ExpenseType}) for Vehicle {dto.VehicleId} / Shipment {dto.ShipmentId}."
        });

        await _context.SaveChangesAsync();

        string? vehicleNum = null;
        if (dto.VehicleId.HasValue)
        {
            var vehicle = await _context.Vehicles.FindAsync(dto.VehicleId.Value);
            vehicleNum = vehicle?.VehicleNumber;
        }

        string? shipmentNum = null;
        if (dto.ShipmentId.HasValue)
        {
            var shipment = await _context.Shipments.FindAsync(dto.ShipmentId.Value);
            shipmentNum = shipment?.ShipmentNumber;
        }

        return new ExpenseDto
        {
            Id = expense.Id,
            VehicleId = expense.VehicleId,
            VehicleNumber = vehicleNum,
            ShipmentId = expense.ShipmentId,
            ShipmentNumber = shipmentNum,
            ExpenseType = expense.ExpenseType,
            Amount = expense.Amount,
            ExpenseDate = expense.ExpenseDate,
            Description = expense.Description,
            ReceiptFile = expense.ReceiptFile,
            CreatedAt = expense.CreatedAt,
            CreatedBy = expense.CreatedBy
        };
    }

    public async Task<PagedResult<ExpenseDto>> GetExpensesAsync(ExpenseQueryParameters query)
    {
        var dbQuery = _context.Expenses
            .AsNoTracking()
            .Include(e => e.Vehicle)
            .Include(e => e.Shipment)
            .AsQueryable();

        if (query.VehicleId.HasValue)
        {
            dbQuery = dbQuery.Where(e => e.VehicleId == query.VehicleId.Value);
        }

        if (query.ShipmentId.HasValue)
        {
            dbQuery = dbQuery.Where(e => e.ShipmentId == query.ShipmentId.Value);
        }

        if (query.ExpenseType.HasValue)
        {
            dbQuery = dbQuery.Where(e => e.ExpenseType == query.ExpenseType.Value);
        }

        if (query.FromDate.HasValue)
        {
            dbQuery = dbQuery.Where(e => e.ExpenseDate >= query.FromDate.Value);
        }

        if (query.ToDate.HasValue)
        {
            dbQuery = dbQuery.Where(e => e.ExpenseDate <= query.ToDate.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            dbQuery = dbQuery.Where(e =>
                e.Description.ToLower().Contains(search) ||
                (e.Vehicle != null && e.Vehicle.VehicleNumber.ToLower().Contains(search)) ||
                (e.Shipment != null && e.Shipment.ShipmentNumber.ToLower().Contains(search)));
        }

        var totalCount = await dbQuery.CountAsync();

        var items = await dbQuery
            .OrderByDescending(e => e.ExpenseDate)
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(e => new ExpenseDto
            {
                Id = e.Id,
                VehicleId = e.VehicleId,
                VehicleNumber = e.Vehicle != null ? e.Vehicle.VehicleNumber : null,
                ShipmentId = e.ShipmentId,
                ShipmentNumber = e.Shipment != null ? e.Shipment.ShipmentNumber : null,
                ExpenseType = e.ExpenseType,
                Amount = e.Amount,
                ExpenseDate = e.ExpenseDate,
                Description = e.Description,
                ReceiptFile = e.ReceiptFile,
                CreatedAt = e.CreatedAt,
                CreatedBy = e.CreatedBy
            })
            .ToListAsync();

        return new PagedResult<ExpenseDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize
        };
    }

    public async Task<ExpenseDto?> GetExpenseByIdAsync(int id)
    {
        var e = await _context.Expenses
            .AsNoTracking()
            .Include(e => e.Vehicle)
            .Include(e => e.Shipment)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (e == null) return null;

        return new ExpenseDto
        {
            Id = e.Id,
            VehicleId = e.VehicleId,
            VehicleNumber = e.Vehicle?.VehicleNumber,
            ShipmentId = e.ShipmentId,
            ShipmentNumber = e.Shipment?.ShipmentNumber,
            ExpenseType = e.ExpenseType,
            Amount = e.Amount,
            ExpenseDate = e.ExpenseDate,
            Description = e.Description,
            ReceiptFile = e.ReceiptFile,
            CreatedAt = e.CreatedAt,
            CreatedBy = e.CreatedBy
        };
    }

    public async Task<ExpenseSummaryDto> GetExpenseSummaryAsync(DateTime? fromDate = null, DateTime? toDate = null)
    {
        var query = _context.Expenses.AsNoTracking().AsQueryable();

        if (fromDate.HasValue)
        {
            query = query.Where(e => e.ExpenseDate >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(e => e.ExpenseDate <= toDate.Value);
        }

        var expenses = await query.ToListAsync();

        return new ExpenseSummaryDto
        {
            TotalExpenses = expenses.Sum(e => e.Amount),
            FuelExpenses = expenses.Where(e => e.ExpenseType == ExpenseType.Fuel).Sum(e => e.Amount),
            TollExpenses = expenses.Where(e => e.ExpenseType == ExpenseType.Toll).Sum(e => e.Amount),
            MaintenanceExpenses = expenses.Where(e => e.ExpenseType == ExpenseType.Maintenance).Sum(e => e.Amount),
            DriverAllowanceExpenses = expenses.Where(e => e.ExpenseType == ExpenseType.DriverAllowance).Sum(e => e.Amount),
            OtherExpenses = expenses.Where(e => e.ExpenseType == ExpenseType.Parking || e.ExpenseType == ExpenseType.Other).Sum(e => e.Amount)
        };
    }

    public async Task<bool> DeleteExpenseAsync(int id)
    {
        var expense = await _context.Expenses.FindAsync(id);
        if (expense == null) return false;

        _context.Expenses.Remove(expense);
        await _context.SaveChangesAsync();
        return true;
    }
}
