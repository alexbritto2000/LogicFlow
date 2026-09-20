import api from './api';
import { ApiResponse } from '../types/auth';

export interface DocumentItem {
  id: number;
  entityType: 'Vehicle' | 'Driver';
  entityId: number;
  entityIdentifier: string;
  documentType: string;
  documentNumber: string;
  issueDate: string;
  expiryDate: string;
  expiryStatus: 'Expired' | 'ExpiringSoon' | 'Valid' | string;
  daysUntilExpiry: number;
  filePath: string;
  remarks?: string;
}

export interface DocumentSummary {
  expiredCount: number;
  expiringIn7DaysCount: number;
  expiringIn30DaysCount: number;
  totalDocumentsCount: number;
}

export const documentService = {
  async getSummary(): Promise<ApiResponse<DocumentSummary>> {
    const res = await api.get<ApiResponse<DocumentSummary>>('/documents/summary');
    return res.data;
  },

  async getVehicleDocuments(vehicleId?: number): Promise<ApiResponse<DocumentItem[]>> {
    const res = await api.get<ApiResponse<DocumentItem[]>>('/documents/vehicle', {
      params: { vehicleId },
    });
    return res.data;
  },

  async getDriverDocuments(driverId?: number): Promise<ApiResponse<DocumentItem[]>> {
    const res = await api.get<ApiResponse<DocumentItem[]>>('/documents/driver', {
      params: { driverId },
    });
    return res.data;
  },

  async getExpiringDocuments(daysThreshold: number = 30): Promise<ApiResponse<DocumentItem[]>> {
    const res = await api.get<ApiResponse<DocumentItem[]>>('/documents/expiring', {
      params: { daysThreshold },
    });
    return res.data;
  },

  async uploadVehicleDocument(formData: FormData): Promise<ApiResponse<DocumentItem>> {
    const res = await api.post<ApiResponse<DocumentItem>>('/documents/vehicle', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async uploadDriverDocument(formData: FormData): Promise<ApiResponse<DocumentItem>> {
    const res = await api.post<ApiResponse<DocumentItem>>('/documents/driver', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async deleteVehicleDocument(id: number): Promise<ApiResponse<boolean>> {
    const res = await api.delete<ApiResponse<boolean>>(`/documents/vehicle/${id}`);
    return res.data;
  },

  async deleteDriverDocument(id: number): Promise<ApiResponse<boolean>> {
    const res = await api.delete<ApiResponse<boolean>>(`/documents/driver/${id}`);
    return res.data;
  },
};
