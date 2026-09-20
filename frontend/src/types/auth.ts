export interface UserProfile {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'SuperAdmin' | 'Admin' | 'Operations' | 'Dispatcher' | 'Accountant' | 'Driver' | 'Viewer' | string;
  driverId?: number;
}

export interface LoginCredentials {
  usernameOrEmail: string;
  password: string;
}

export interface LoginResponseData {
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: UserProfile;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}
