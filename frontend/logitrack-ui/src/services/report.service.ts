import api from './api';
import { ApiResponse } from '../types/auth';

export interface ShipmentReportItem {
  shipmentNumber: string;
  trackingNumber: string;
  bookingNumber: string;
  customerName: string;
  origin: string;
  destination: string;
  status: string;
  vehicleNumber?: string;
  driverName?: string;
  freightAmount: number;
  bookingDate: string;
  actualDeliveryDate?: string;
  isDelivered: boolean;
}

export interface FinancialReportItem {
  invoiceNumber: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  subTotal: number;
  tax: number;
  discount: number;
  total: number;
  paidAmount: number;
  balance: number;
  status: string;
}

export interface VehicleExpenseReportItem {
  vehicleNumber: string;
  vehicleType: string;
  completedTrips: number;
  fuelExpenses: number;
  tollExpenses: number;
  maintenanceExpenses: number;
  otherExpenses: number;
  totalExpenses: number;
}

export interface DriverPerformanceReportItem {
  driverName: string;
  driverCode: string;
  phone: string;
  licenseNumber: string;
  totalAssignments: number;
  completedDeliveries: number;
  totalAllowances: number;
  status: string;
}

export interface ReportFilterParams {
  fromDate?: string;
  toDate?: string;
  customerId?: number;
  vehicleId?: number;
}

const triggerDownload = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const reportService = {
  async getShipmentReport(filters?: ReportFilterParams): Promise<ApiResponse<ShipmentReportItem[]>> {
    const res = await api.get<ApiResponse<ShipmentReportItem[]>>('/reports/shipments', { params: filters });
    return res.data;
  },

  async exportShipmentReportCsv(filters?: ReportFilterParams): Promise<void> {
    const res = await api.get('/reports/shipments/export', {
      params: filters,
      responseType: 'blob',
    });
    triggerDownload(new Blob([res.data]), `Shipments_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  },

  async getFinancialReport(filters?: ReportFilterParams): Promise<ApiResponse<FinancialReportItem[]>> {
    const res = await api.get<ApiResponse<FinancialReportItem[]>>('/reports/financial', { params: filters });
    return res.data;
  },

  async exportFinancialReportCsv(filters?: ReportFilterParams): Promise<void> {
    const res = await api.get('/reports/financial/export', {
      params: filters,
      responseType: 'blob',
    });
    triggerDownload(new Blob([res.data]), `Financial_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  },

  async getVehicleExpenseReport(filters?: ReportFilterParams): Promise<ApiResponse<VehicleExpenseReportItem[]>> {
    const res = await api.get<ApiResponse<VehicleExpenseReportItem[]>>('/reports/vehicles', { params: filters });
    return res.data;
  },

  async exportVehicleExpenseReportCsv(filters?: ReportFilterParams): Promise<void> {
    const res = await api.get('/reports/vehicles/export', {
      params: filters,
      responseType: 'blob',
    });
    triggerDownload(new Blob([res.data]), `Vehicle_Expenses_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  },

  async getDriverPerformanceReport(filters?: ReportFilterParams): Promise<ApiResponse<DriverPerformanceReportItem[]>> {
    const res = await api.get<ApiResponse<DriverPerformanceReportItem[]>>('/reports/drivers', { params: filters });
    return res.data;
  },

  async exportDriverPerformanceReportCsv(filters?: ReportFilterParams): Promise<void> {
    const res = await api.get('/reports/drivers/export', {
      params: filters,
      responseType: 'blob',
    });
    triggerDownload(new Blob([res.data]), `Driver_Performance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  },
};
