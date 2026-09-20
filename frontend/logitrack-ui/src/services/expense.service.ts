import api from './api';
import { ApiResponse } from '../types/auth';
import { PagedResult } from './customer.service';

export interface Expense {
  id: number;
  vehicleId?: number;
  vehicleNumber?: string;
  shipmentId?: number;
  shipmentNumber?: string;
  expenseType: number; // 1: Fuel, 2: Toll, 3: Maintenance, 4: DriverAllowance, 5: Parking, 6: Other
  expenseTypeName: string;
  amount: number;
  expenseDate: string;
  description: string;
  receiptFile?: string;
  createdAt: string;
  createdBy?: string;
}

export interface ExpenseSummary {
  totalExpenses: number;
  fuelExpenses: number;
  tollExpenses: number;
  maintenanceExpenses: number;
  driverAllowanceExpenses: number;
  otherExpenses: number;
}

export interface ExpenseParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  vehicleId?: number;
  shipmentId?: number;
  expenseType?: number;
  fromDate?: string;
  toDate?: string;
}

export const expenseService = {
  async getExpenses(params?: ExpenseParams): Promise<ApiResponse<PagedResult<Expense>>> {
    const res = await api.get<ApiResponse<PagedResult<Expense>>>('/expenses', { params });
    return res.data;
  },

  async getSummary(fromDate?: string, toDate?: string): Promise<ApiResponse<ExpenseSummary>> {
    const res = await api.get<ApiResponse<ExpenseSummary>>('/expenses/summary', {
      params: { fromDate, toDate }
    });
    return res.data;
  },

  async getExpenseById(id: number): Promise<ApiResponse<Expense>> {
    const res = await api.get<ApiResponse<Expense>>(`/expenses/${id}`);
    return res.data;
  },

  async recordExpense(formData: FormData): Promise<ApiResponse<Expense>> {
    const res = await api.post<ApiResponse<Expense>>('/expenses', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  async deleteExpense(id: number): Promise<ApiResponse<boolean>> {
    const res = await api.delete<ApiResponse<boolean>>(`/expenses/${id}`);
    return res.data;
  },
};
