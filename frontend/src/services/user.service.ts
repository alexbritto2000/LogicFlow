import api from './api';
import { ApiResponse } from '../types/auth';
import { PagedResult } from './customer.service';

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  roleId: number;
  roleName: string;
  isActive: boolean;
  createdAt: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
}

export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  roleId: number;
}

export interface UpdateUserPayload {
  email: string;
  fullName: string;
  phone?: string;
  roleId: number;
  isActive: boolean;
}

export interface UserParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  roleId?: number;
  isActive?: boolean;
}

export const userService = {
  async getUsers(params?: UserParams): Promise<ApiResponse<PagedResult<User>>> {
    const res = await api.get<ApiResponse<PagedResult<User>>>('/users', { params });
    return res.data;
  },

  async getUserById(id: number): Promise<ApiResponse<User>> {
    const res = await api.get<ApiResponse<User>>(`/users/${id}`);
    return res.data;
  },

  async getRoles(): Promise<ApiResponse<Role[]>> {
    const res = await api.get<ApiResponse<Role[]>>('/users/roles');
    return res.data;
  },

  async createUser(data: CreateUserPayload): Promise<ApiResponse<User>> {
    const res = await api.post<ApiResponse<User>>('/users', data);
    return res.data;
  },

  async updateUser(id: number, data: UpdateUserPayload): Promise<ApiResponse<User>> {
    const res = await api.put<ApiResponse<User>>(`/users/${id}`, data);
    return res.data;
  },

  async resetPassword(id: number, newPassword: string): Promise<ApiResponse<boolean>> {
    const res = await api.post<ApiResponse<boolean>>(`/users/${id}/reset-password`, { newPassword });
    return res.data;
  },

  async deleteUser(id: number): Promise<ApiResponse<boolean>> {
    const res = await api.delete<ApiResponse<boolean>>(`/users/${id}`);
    return res.data;
  },
};
