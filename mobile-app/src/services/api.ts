import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://fieldsync-i8jv.onrender.com/api',
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('fs_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 handling can be done here to redirect, or in a higher-level context
    return Promise.reject(error);
  }
);

export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

export const getProjects = () => api.get('/projects');
export const getWBSTree = (projectId: number) => api.get(`/projects/${projectId}/wbs`);

export type SubmissionPayload = {
  idempotency_key: string;
  wbs_node_id: number;
  pct_complete: number;
  qty?: number;
  notes?: string;
  gps_lat?: number;
  gps_lng?: number;
  captured_at: string; // ISO timestamp
  device_id: string;
};

export const submitProgress = (data: SubmissionPayload) => api.post('/submissions', data);
export const getSubmissions = () => api.get('/submissions');

export default api;

