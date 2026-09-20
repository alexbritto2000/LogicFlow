import api from './api';
import { ApiResponse } from '../types/auth';

export interface Assignment {
  id: number;
  shipmentId: number;
  shipmentNumber: string;
  trackingNumber: string;
  customerName: string;
  origin: string;
  destination: string;
  vehicleId: number;
  vehicleNumber: string;
  vehicleType: string;
  driverId: number;
  driverName: string;
  driverPhone: string;
  assignedDate: string;
  releasedDate?: string;
  isActive: boolean;
  notes?: string;
}

export interface CreateAssignmentPayload {
  shipmentId: number;
  vehicleId: number;
  driverId: number;
  notes?: string;
}

export const assignmentService = {
  async getActiveAssignments(): Promise<ApiResponse<Assignment[]>> {
    const res = await api.get<ApiResponse<Assignment[]>>('/assignments/active');
    return res.data;
  },

  async assignFleet(payload: CreateAssignmentPayload): Promise<ApiResponse<Assignment>> {
    const res = await api.post<ApiResponse<Assignment>>('/assignments', payload);
    return res.data;
  },

  async releaseAssignment(id: number, notes?: string): Promise<ApiResponse<boolean>> {
    const res = await api.post<ApiResponse<boolean>>(`/assignments/${id}/release`, { notes });
    return res.data;
  },
};
