import api from './api';
import { ApiResponse } from '../types/auth';
import { PagedResult } from './customer.service';

export interface Payment {
  id: number;
  paymentNumber: string;
  customerId: number;
  customerName: string;
  invoiceId?: number;
  invoiceNumber?: string;
  bookingId?: number;
  bookingNumber?: string;
  amount: number;
  paymentDate: string;
  paymentMethod: number; // 1: Cash, 2: BankTransfer, 3: Cheque, 4: UPI
  paymentMethodName: string;
  referenceNumber?: string;
  status: number; // 1: Pending, 2: Paid, 3: Failed, 4: Refunded
  statusName: string;
  remarks?: string;
  createdAt: string;
  createdBy?: string;
}

export interface CreatePaymentPayload {
  customerId: number;
  invoiceId?: number;
  bookingId?: number;
  amount: number;
  paymentDate: string;
  paymentMethod: number;
  referenceNumber?: string;
  remarks?: string;
}

export interface PaymentParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  customerId?: number;
  invoiceId?: number;
  paymentMethod?: number;
  status?: number;
  fromDate?: string;
  toDate?: string;
}

export const paymentService = {
  async getPayments(params?: PaymentParams): Promise<ApiResponse<PagedResult<Payment>>> {
    const res = await api.get<ApiResponse<PagedResult<Payment>>>('/payments', { params });
    return res.data;
  },

  async getPaymentById(id: number): Promise<ApiResponse<Payment>> {
    const res = await api.get<ApiResponse<Payment>>(`/payments/${id}`);
    return res.data;
  },

  async getPaymentsByInvoice(invoiceId: number): Promise<ApiResponse<Payment[]>> {
    const res = await api.get<ApiResponse<Payment[]>>(`/payments/invoice/${invoiceId}`);
    return res.data;
  },

  async recordPayment(data: CreatePaymentPayload): Promise<ApiResponse<Payment>> {
    const res = await api.post<ApiResponse<Payment>>('/payments', data);
    return res.data;
  },
};
