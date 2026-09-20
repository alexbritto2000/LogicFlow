import api from './api';
import { ApiResponse } from '../types/auth';
import { PagedResult } from './customer.service';

export interface Delivery {
  id: number;
  shipmentId: number;
  shipmentNumber: string;
  trackingNumber: string;
  customerName: string;
  origin: string;
  destination: string;
  deliveryDate: string;
  receiverName: string;
  receiverPhone: string;
  deliveryRemarks?: string;
  proofOfDeliveryFile?: string;
  deliveredBy?: string;
  vehicleNumber?: string;
  driverName?: string;
}

export interface DeliveryQueryParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  customerId?: number;
  fromDate?: string;
  toDate?: string;
}

export const deliveryService = {
  async getDeliveries(params?: DeliveryQueryParams): Promise<PagedResult<Delivery>> {
    const res = await api.get<ApiResponse<PagedResult<Delivery>>>('/deliveries', { params });
    return res.data.data;
  },

  async getDeliveryById(id: number): Promise<Delivery> {
    const res = await api.get<ApiResponse<Delivery>>(`/deliveries/${id}`);
    return res.data.data;
  },

  async getDeliveryByShipmentId(shipmentId: number): Promise<Delivery> {
    const res = await api.get<ApiResponse<Delivery>>(`/deliveries/shipment/${shipmentId}`);
    return res.data.data;
  },

  async recordDelivery(formData: FormData): Promise<Delivery> {
    const res = await api.post<ApiResponse<Delivery>>('/deliveries', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.data;
  },
};
