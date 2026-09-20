import api from './api';
import { ApiResponse, LoginCredentials, LoginResponseData, UserProfile } from '../types/auth';

export const authService = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponseData>> {
    const response = await api.post<ApiResponse<LoginResponseData>>('/auth/login', credentials);
    return response.data;
  },

  async refreshToken(token: string, refreshToken: string): Promise<ApiResponse<LoginResponseData>> {
    const response = await api.post<ApiResponse<LoginResponseData>>('/auth/refresh', { token, refreshToken });
    return response.data;
  },

  async getCurrentUser(): Promise<ApiResponse<UserProfile>> {
    const response = await api.get<ApiResponse<UserProfile>>('/auth/me');
    return response.data;
  },
};
