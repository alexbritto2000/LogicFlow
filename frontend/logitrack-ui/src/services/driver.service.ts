import api from './api';
import { ApiResponse } from '../types/auth';
import { PagedResult } from './customer.service';

export interface Driver {
  id: number;
  driverCode: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  drivingLicenseNumber: string;
  licenseExpiryDate: string;
  licenseExpiryStatus: string; // Valid, ExpiringSoon, Expired
  joiningDate: string;
  status: number; // 1: Available, 2: Assigned, 3: OnLeave, 4: Inactive
  statusName: string;
  userId?: number;
  isActive: boolean;
}

export interface DriverDetail extends Driver {
  documents: {
    id: number;
    documentType: number;
    documentTypeName: string;
    documentNumber: string;
    issueDate: string;
    expiryDate: string;
    expiryStatus: string;
    filePath: string;
    remarks?: string;
  }[];
  recentAssignments: {
    id: number;
    shipmentId: number;
    shipmentNumber: string;
    trackingNumber: string;
    vehicleNumber: string;
    assignedDate: string;
    releasedDate?: string;
    isActive: boolean;
  }[];
}

export interface DriverParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  isAscending?: boolean;
  status?: number;
}

export const driverService = {
  async getDrivers(params?: DriverParams): Promise<ApiResponse<PagedResult<Driver>>> {
    const res = await api.get<ApiResponse<PagedResult<Driver>>>('/drivers', { params });
    return res.data;
  },

  async getDriverById(id: number): Promise<ApiResponse<DriverDetail>> {
    const res = await api.get<ApiResponse<DriverDetail>>(`/drivers/${id}`);
    return res.data;
  },

  async getAvailableDrivers(): Promise<ApiResponse<Driver[]>> {
    const res = await api.get<ApiResponse<Driver[]>>('/drivers/available');
    return res.data;
  },

  async createDriver(data: Partial<Driver>): Promise<ApiResponse<Driver>> {
    const res = await api.post<ApiResponse<Driver>>('/drivers', data);
    return res.data;
  },

  async updateDriver(id: number, data: Partial<Driver>): Promise<ApiResponse<Driver>> {
    const res = await api.put<ApiResponse<Driver>>(`/drivers/${id}`, data);
    return res.data;
  },

  async deleteDriver(id: number): Promise<ApiResponse<boolean>> {
    const res = await api.delete<ApiResponse<boolean>>(`/drivers/${id}`);
    return res.data;
  },
};
