import { api } from './api';

export interface UserProfile {
  id: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'GUARDIAN';
  status: string;
  fullName: string;
  profile?: any;
}

export interface LoginResponse {
  token: string;
  user: UserProfile;
}

export const authService = {
  login: async (credentials: { email: string; password: string }): Promise<LoginResponse> => {
    const res: any = await api.post('/auth/login', credentials);
    if (res.data?.token) {
      localStorage.setItem('edumanage_token', res.data.token);
      localStorage.setItem('edumanage_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  getMe: async (): Promise<UserProfile> => {
    const res: any = await api.get('/auth/me');
    return res.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('edumanage_token');
      localStorage.removeItem('edumanage_user');
      localStorage.removeItem('edumanage_active_child');
    }
  },
};
