using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Expense;

namespace LogiTrack.Application.Interfaces;

public interface IExpenseService
{
    Task<ExpenseDto> RecordExpenseAsync(CreateExpenseDto dto, string? recordedBy = null);
    Task<PagedResult<ExpenseDto>> GetExpensesAsync(ExpenseQueryParameters query);
    Task<ExpenseDto?> GetExpenseByIdAsync(int id);
    Task<ExpenseSummaryDto> GetExpenseSummaryAsync(DateTime? fromDate = null, DateTime? toDate = null);
    Task<bool> DeleteExpenseAsync(int id);
}
