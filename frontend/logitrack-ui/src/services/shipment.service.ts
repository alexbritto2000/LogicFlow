import api from './api';
import { ApiResponse } from '../types/auth';
import { PagedResult } from './customer.service';

export interface Shipment {
  id: number;
  shipmentNumber: string;
  bookingId: number;
  bookingNumber: string;
  customerName: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  currentLocation: string;
  currentStatus: number; // 1: Created, 2: Assigned, 3: PickedUp, 4: InTransit, 5: OutForDelivery, 6: Delivered, 7: Cancelled
  statusName: string;
  estimatedDeliveryDate: string;
  actualDeliveryDate?: string;
  assignedVehicleNumber?: string;
  assignedDriverName?: string;
  assignedDriverPhone?: string;
  createdAt: string;
}

export interface ShipmentDetail extends Shipment {
  pickupAddress: string;
  deliveryAddress: string;
  cargoDescription: string;
  cargoWeight: number;
  numberOfPackages: number;
  freightAmount: number;
  statusHistories: {
    id: number;
    status: number;
    statusName: string;
    location: string;
    remarks?: string;
    updatedBy?: string;
    updatedAt: string;
  }[];
  assignmentHistories: {
    id: number;
    vehicleId: number;
    vehicleNumber: string;
    driverId: number;
    driverName: string;
    driverPhone: string;
    assignedDate: string;
    releasedDate?: string;
    isActive: boolean;
    notes?: string;
  }[];
  deliveryInfo?: {
    deliveryDate: string;
    receiverName: string;
    receiverPhone: string;
    deliveryRemarks?: string;
    proofOfDeliveryFile?: string;
    deliveredBy?: string;
  };
}

export interface TrackingResult {
  trackingNumber: string;
  shipmentNumber: string;
  bookingNumber: string;
  customerName: string;
  origin: string;
  destination: string;
  currentLocation: string;
  currentStatus: string;
  estimatedDeliveryDate: string;
  actualDeliveryDate?: string;
  assignedVehicle?: string;
  assignedDriver?: string;
  timeline: {
    id: number;
    status: number;
    statusName: string;
    location: string;
    remarks?: string;
    updatedBy?: string;
    updatedAt: string;
  }[];
}

export interface ShipmentParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  isAscending?: boolean;
  bookingId?: number;
  status?: number;
  vehicleId?: number;
  driverId?: number;
}

export const shipmentService = {
  async getShipments(params?: ShipmentParams): Promise<ApiResponse<PagedResult<Shipment>>> {
    const res = await api.get<ApiResponse<PagedResult<Shipment>>>('/shipments', { params });
    return res.data;
  },

  async getShipmentById(id: number): Promise<ApiResponse<ShipmentDetail>> {
    const res = await api.get<ApiResponse<ShipmentDetail>>(`/shipments/${id}`);
    return res.data;
  },

  async trackByNumber(trackingNumber: string): Promise<ApiResponse<TrackingResult>> {
    const res = await api.get<ApiResponse<TrackingResult>>(`/shipments/track/${encodeURIComponent(trackingNumber)}`);
    return res.data;
  },

  async createShipment(data: any): Promise<ApiResponse<Shipment>> {
    const res = await api.post<ApiResponse<Shipment>>('/shipments', data);
    return res.data;
  },

  async updateStatus(id: number, status: number, location: string, remarks?: string): Promise<ApiResponse<Shipment>> {
    const res = await api.post<ApiResponse<Shipment>>(`/shipments/${id}/status`, { status, location, remarks });
    return res.data;
  },
};
