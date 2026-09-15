import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
});

api.interceptors.request.use(config => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('qwest_token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('qwest_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export default api;

// typed helpers
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data).then(r => r.data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
};

export const quizApi = {
  list: () => api.get('/quizzes').then(r => r.data),
  get: (id: string) => api.get(`/quizzes/${id}`).then(r => r.data),
  create: (data: unknown) => api.post('/quizzes', data).then(r => r.data),
  update: (id: string, data: unknown) => api.put(`/quizzes/${id}`, data).then(r => r.data),
  remove: (id: string) => api.delete(`/quizzes/${id}`),
  duplicate: (id: string) => api.post(`/quizzes/${id}/duplicate`).then(r => r.data),
};

export const sessionApi = {
  create: (quizId: string, mode = 'COMPETITIVE') =>
    api.post('/sessions', { quizId, mode }).then(r => r.data),
  byPin: (pin: string) => api.get(`/sessions/pin/${pin}`).then(r => r.data),
  results: (id: string) => api.get(`/sessions/${id}/results`).then(r => r.data),
  list: () => api.get('/sessions').then(r => r.data),
};

export const reportApi = {
  analytics: (sessionId: string) => api.get(`/reports/sessions/${sessionId}`).then(r => r.data),
  csvUrl: (sessionId: string) => `${api.defaults.baseURL}/reports/sessions/${sessionId}/csv`,
  dashboard: () => api.get('/reports/dashboard').then(r => r.data),
};
