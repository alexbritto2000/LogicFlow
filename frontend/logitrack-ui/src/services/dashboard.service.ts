import api from './api';
import { ApiResponse } from '../types/auth';

export interface DashboardSummary {
  totalVehicles: number;
  availableVehicles: number;
  assignedVehicles: number;
  inTransitVehicles: number;
  maintenanceVehicles: number;

  totalDrivers: number;
  availableDrivers: number;
  assignedDrivers: number;
  onLeaveDrivers: number;

  totalCustomers: number;
  totalBookings: number;
  activeShipments: number;
  deliveredToday: number;

  totalRevenue: number;
  totalCollected: number;
  outstandingReceivables: number;
  totalExpenses: number;
  netProfit: number;

  expiredDocuments: number;
  expiringSoonDocuments: number;
}

export interface MonthlyFinancialTrend {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
}

export interface RecentActivity {
  id: number;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  referenceId?: string;
}

export const dashboardService = {
  async getSummary(): Promise<ApiResponse<DashboardSummary>> {
    const res = await api.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
    return res.data;
  },

  async getFinancialTrends(monthsCount: number = 6): Promise<ApiResponse<MonthlyFinancialTrend[]>> {
    const res = await api.get<ApiResponse<MonthlyFinancialTrend[]>>('/dashboard/trends', {
      params: { monthsCount }
    });
    return res.data;
  },

  async getShipmentDistribution(): Promise<ApiResponse<StatusDistribution[]>> {
    const res = await api.get<ApiResponse<StatusDistribution[]>>('/dashboard/distribution');
    return res.data;
  },

  async getRecentActivities(limit: number = 10): Promise<ApiResponse<RecentActivity[]>> {
    const res = await api.get<ApiResponse<RecentActivity[]>>('/dashboard/activities', {
      params: { limit }
    });
    return res.data;
  },
};
