import api from './axios';

export default {
  overview: () => api.get('/dashboard/overview').then((r) => r.data),
  lines: () => api.get('/dashboard/lines').then((r) => r.data),
  qualityTrend: (days = 7) => api.get('/dashboard/quality-trend', { params: { days } }).then((r) => r.data),
  topDefects: (days = 30) => api.get('/dashboard/top-defects', { params: { days } }).then((r) => r.data),
  inspectionStatus: (shift) => api.get('/dashboard/inspection-status', { params: { shift } }).then((r) => r.data),
  todaysLog: () => api.get('/dashboard/log').then((r) => r.data),
  recentNC: () => api.get('/dashboard/recent-nc').then((r) => r.data),
};
