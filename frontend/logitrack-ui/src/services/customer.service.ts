import api from './api';
import { ApiResponse } from '../types/auth';

export interface Customer {
  id: number;
  customerCode: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber?: string;
  isActive: boolean;
  createdAt: string;
  totalBookings: number;
}

export interface CustomerDetail extends Customer {
  recentBookings: {
    id: number;
    bookingNumber: string;
    bookingDate: string;
    originCity: string;
    destinationCity: string;
    freightAmount: number;
    status: string;
  }[];
}

export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CustomerParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  isAscending?: boolean;
  city?: string;
  isActive?: boolean;
}

export const customerService = {
  async getCustomers(params?: CustomerParams): Promise<ApiResponse<PagedResult<Customer>>> {
    const res = await api.get<ApiResponse<PagedResult<Customer>>>('/customers', { params });
    return res.data;
  },

  async getCustomerById(id: number): Promise<ApiResponse<CustomerDetail>> {
    const res = await api.get<ApiResponse<CustomerDetail>>(`/customers/${id}`);
    return res.data;
  },

  async createCustomer(data: Partial<Customer>): Promise<ApiResponse<Customer>> {
    const res = await api.post<ApiResponse<Customer>>('/customers', data);
    return res.data;
  },

  async updateCustomer(id: number, data: Partial<Customer>): Promise<ApiResponse<Customer>> {
    const res = await api.put<ApiResponse<Customer>>(`/customers/${id}`, data);
    return res.data;
  },

  async deleteCustomer(id: number): Promise<ApiResponse<boolean>> {
    const res = await api.delete<ApiResponse<boolean>>(`/customers/${id}`);
    return res.data;
  },
};
