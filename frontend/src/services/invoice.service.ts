import api from './api';
import { ApiResponse } from '../types/auth';
import { PagedResult } from './customer.service';

export interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  customerId: number;
  customerName: string;
  customerGst?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  bookingId?: number;
  bookingNumber?: string;
  invoiceDate: string;
  dueDate: string;
  subTotal: number;
  tax: number;
  discount: number;
  total: number;
  paidAmount: number;
  balance: number;
  status: number; // 1: Draft, 2: Sent, 3: PartiallyPaid, 4: Paid, 5: Overdue, 6: Cancelled
  statusName: string;
  items: InvoiceItem[];
}

export interface CreateInvoicePayload {
  customerId: number;
  bookingId?: number;
  invoiceDate: string;
  dueDate: string;
  taxRatePercent: number;
  discount: number;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface InvoiceParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  customerId?: number;
  status?: number;
  fromDate?: string;
  toDate?: string;
}

export const invoiceService = {
  async getInvoices(params?: InvoiceParams): Promise<ApiResponse<PagedResult<Invoice>>> {
    const res = await api.get<ApiResponse<PagedResult<Invoice>>>('/invoices', { params });
    return res.data;
  },

  async getInvoiceById(id: number): Promise<ApiResponse<Invoice>> {
    const res = await api.get<ApiResponse<Invoice>>(`/invoices/${id}`);
    return res.data;
  },

  async createInvoice(data: CreateInvoicePayload): Promise<ApiResponse<Invoice>> {
    const res = await api.post<ApiResponse<Invoice>>('/invoices', data);
    return res.data;
  },

  async createFromBooking(bookingId: number, taxRatePercent: number = 18, discount: number = 0): Promise<ApiResponse<Invoice>> {
    const res = await api.post<ApiResponse<Invoice>>(`/invoices/from-booking/${bookingId}`, null, {
      params: { taxRatePercent, discount }
    });
    return res.data;
  },

  async updateStatus(id: number, status: number): Promise<ApiResponse<Invoice>> {
    const res = await api.patch<ApiResponse<Invoice>>(`/invoices/${id}/status`, { status });
    return res.data;
  },
};
