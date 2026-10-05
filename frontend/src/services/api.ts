import axios from 'axios';
import { ScheduleEmailRequest } from '../types';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  googleLogin: (credential: string) => api.post('/auth/google', { credential }),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const emailsApi = {
  schedule: (data: ScheduleEmailRequest) => api.post('/emails/schedule', data),
  getScheduled: (page = 1, limit = 10) => api.get('/emails/scheduled', { params: { page, limit } }),
  getSent: (page = 1, limit = 10) => api.get('/emails/sent', { params: { page, limit } }),
};

export const searchApi = {
  searchEmails: (query: string) => api.get('/search', { params: { q: query } }),
};

export const slackApi = {
  getStatus: () => api.get('/slack/status'),
  disconnect: () => api.delete('/slack/disconnect'),
  getConnectUrl: () => '/api/slack/connect',
};

export default api;
