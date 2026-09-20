using System.Security.Claims;
using LogiTrack.Application.Common;
using LogiTrack.Application.DTOs.Expense;
using LogiTrack.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LogiTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExpensesController : ControllerBase
{
    private readonly IExpenseService _expenseService;

    public ExpensesController(IExpenseService expenseService)
    {
        _expenseService = expenseService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<ExpenseDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetExpenses([FromQuery] ExpenseQueryParameters query)
    {
        var result = await _expenseService.GetExpensesAsync(query);
        return Ok(ApiResponse<PagedResult<ExpenseDto>>.SuccessResult(result));
    }

    [HttpGet("summary")]
    [ProducesResponseType(typeof(ApiResponse<ExpenseSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummary([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
    {
        var result = await _expenseService.GetExpenseSummaryAsync(fromDate, toDate);
        return Ok(ApiResponse<ExpenseSummaryDto>.SuccessResult(result));
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<ExpenseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _expenseService.GetExpenseByIdAsync(id);
        if (result == null)
        {
            return NotFound(ApiResponse<ExpenseDto>.FailureResult("Expense record not found."));
        }
        return Ok(ApiResponse<ExpenseDto>.SuccessResult(result));
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin,Dispatcher,Accountant")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ApiResponse<ExpenseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> RecordExpense([FromForm] CreateExpenseDto dto)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var result = await _expenseService.RecordExpenseAsync(dto, userName);
        return Ok(ApiResponse<ExpenseDto>.SuccessResult(result, "Expense recorded successfully."));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "SuperAdmin,Admin,Accountant")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteExpense(int id)
    {
        var result = await _expenseService.DeleteExpenseAsync(id);
        if (!result)
        {
            return NotFound(ApiResponse<bool>.FailureResult("Expense record not found."));
        }
        return Ok(ApiResponse<bool>.SuccessResult(true, "Expense deleted successfully."));
    }
}
