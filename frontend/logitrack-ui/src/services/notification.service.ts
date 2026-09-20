import api from './api';
import { ApiResponse } from '../types/auth';

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  type: number; // 1: Info, 2: Warning, 3: Alert, 4: Success
  typeName: string;
  isRead: boolean;
  targetRole?: string;
  referenceUrl?: string;
  createdAt: string;
}

export const notificationService = {
  async getNotifications(unreadOnly: boolean = false, limit: number = 20): Promise<ApiResponse<AppNotification[]>> {
    const res = await api.get<ApiResponse<AppNotification[]>>('/notifications', {
      params: { unreadOnly, limit }
    });
    return res.data;
  },

  async getUnreadCount(): Promise<ApiResponse<number>> {
    const res = await api.get<ApiResponse<number>>('/notifications/unread-count');
    return res.data;
  },

  async markAsRead(id: number): Promise<ApiResponse<boolean>> {
    const res = await api.post<ApiResponse<boolean>>(`/notifications/${id}/read`);
    return res.data;
  },

  async markAllAsRead(): Promise<ApiResponse<boolean>> {
    const res = await api.post<ApiResponse<boolean>>('/notifications/mark-all-read');
    return res.data;
  },

  async syncAlerts(): Promise<ApiResponse<number>> {
    const res = await api.post<ApiResponse<number>>('/notifications/sync-alerts');
    return res.data;
  },
};
