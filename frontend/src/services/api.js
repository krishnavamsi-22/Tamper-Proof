import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  adminWalletLogin: (walletAddress) => api.post('/auth/admin-wallet-login', { walletAddress })
};

export const courseAPI = {
  getAll: () => api.get('/courses'),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data)
};

export const enrollmentAPI = {
  enroll: (courseId) => api.post('/enrollments', { courseId }),
  getMy: () => api.get('/enrollments/my'),
  completeLesson: (id, lessonIndex) => api.post(`/enrollments/${id}/complete-lesson`, { lessonIndex }),
  approve: (id, walletAddress) => api.post(`/enrollments/${id}/approve`, { walletAddress }),
  getAll: () => api.get('/enrollments/all')
};

export const assignmentAPI = {
  create: (data) => api.post('/assignments', data),
  getByCourse: (courseId) => api.get(`/assignments/course/${courseId}`),
  submit: (id, data) => api.post(`/assignments/${id}/submit`, data),
  getPending: () => api.get('/assignments/submissions/pending'),
  evaluate: (id, data) => api.post(`/assignments/submissions/${id}/evaluate`, data),
  getMySubmissions: () => api.get('/assignments/my-submissions')
};

export const certificateAPI = {
  generate: (enrollmentId, walletAddress) => api.post('/certificates', { enrollmentId, walletAddress }),
  getMy: () => api.get('/certificates/my'),
  getById: (id) => api.get(`/certificates/${id}`),
  getAll: () => api.get('/certificates')
};

export const adminAPI = {
  registerTeacher: (data) => api.post('/admin/register-teacher', data),
  getTeachers: () => api.get('/admin/teachers'),
  walletLogin: (walletAddress) => api.post('/admin/wallet-login', { walletAddress })
};

export default api;
