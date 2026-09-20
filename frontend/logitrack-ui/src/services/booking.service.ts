import api from './api';
import { ApiResponse } from '../types/auth';
import { PagedResult } from './customer.service';

export interface Booking {
  id: number;
  bookingNumber: string;
  customerId: number;
  customerName: string;
  customerCode: string;
  bookingDate: string;
  pickupAddress: string;
  pickupCity: string;
  deliveryAddress: string;
  deliveryCity: string;
  pickupDate: string;
  expectedDeliveryDate: string;
  cargoDescription: string;
  cargoWeight: number;
  numberOfPackages: number;
  specialInstructions?: string;
  freightAmount: number;
  paymentType: string;
  status: number; // 1: Draft, 2: Confirmed, 3: Assigned, 4: PickedUp, 5: InTransit, 6: OutForDelivery, 7: Delivered, 8: Cancelled
  statusName: string;
  shipmentsCount: number;
  isActive: boolean;
}

export interface BookingDetail extends Booking {
  shipments: {
    id: number;
    shipmentNumber: string;
    trackingNumber: string;
    currentLocation: string;
    currentStatus: string;
    estimatedDeliveryDate: string;
    assignedVehicle?: string;
    assignedDriver?: string;
  }[];
}

export interface BookingParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  isAscending?: boolean;
  customerId?: number;
  status?: number;
}

export const bookingService = {
  async getBookings(params?: BookingParams): Promise<ApiResponse<PagedResult<Booking>>> {
    const res = await api.get<ApiResponse<PagedResult<Booking>>>('/bookings', { params });
    return res.data;
  },

  async getBookingById(id: number): Promise<ApiResponse<BookingDetail>> {
    const res = await api.get<ApiResponse<BookingDetail>>(`/bookings/${id}`);
    return res.data;
  },

  async createBooking(data: any): Promise<ApiResponse<Booking>> {
    const res = await api.post<ApiResponse<Booking>>('/bookings', data);
    return res.data;
  },

  async updateBookingStatus(id: number, status: number, remarks?: string): Promise<ApiResponse<Booking>> {
    const res = await api.put<ApiResponse<Booking>>(`/bookings/${id}/status`, { status, remarks });
    return res.data;
  },

  async cancelBooking(id: number): Promise<ApiResponse<boolean>> {
    const res = await api.delete<ApiResponse<boolean>>(`/bookings/${id}`);
    return res.data;
  },
};
