import api from './api';
import { ApiResponse } from '../types/auth';
import { PagedResult } from './customer.service';

export interface Vehicle {
  id: number;
  vehicleNumber: string;
  vehicleType: string;
  make: string;
  model: string;
  year: number;
  capacity: number;
  fuelType: string;
  currentOdometer: number;
  status: number; // 1: Available, 2: Assigned, 3: InTransit, 4: Maintenance, 5: Inactive
  statusName: string;
  expiredDocumentsCount: number;
  expiringSoonDocumentsCount: number;
  isActive: boolean;
}

export interface VehicleDetail extends Vehicle {
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
    driverName: string;
    assignedDate: string;
    releasedDate?: string;
    isActive: boolean;
  }[];
}

export interface VehicleParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  isAscending?: boolean;
  status?: number;
  vehicleType?: string;
}

export const vehicleService = {
  async getVehicles(params?: VehicleParams): Promise<ApiResponse<PagedResult<Vehicle>>> {
    const res = await api.get<ApiResponse<PagedResult<Vehicle>>>('/vehicles', { params });
    return res.data;
  },

  async getVehicleById(id: number): Promise<ApiResponse<VehicleDetail>> {
    const res = await api.get<ApiResponse<VehicleDetail>>(`/vehicles/${id}`);
    return res.data;
  },

  async getAvailableVehicles(): Promise<ApiResponse<Vehicle[]>> {
    const res = await api.get<ApiResponse<Vehicle[]>>('/vehicles/available');
    return res.data;
  },

  async createVehicle(data: Partial<Vehicle>): Promise<ApiResponse<Vehicle>> {
    const res = await api.post<ApiResponse<Vehicle>>('/vehicles', data);
    return res.data;
  },

  async updateVehicle(id: number, data: Partial<Vehicle>): Promise<ApiResponse<Vehicle>> {
    const res = await api.put<ApiResponse<Vehicle>>(`/vehicles/${id}`, data);
    return res.data;
  },

  async deleteVehicle(id: number): Promise<ApiResponse<boolean>> {
    const res = await api.delete<ApiResponse<boolean>>(`/vehicles/${id}`);
    return res.data;
  },
};
