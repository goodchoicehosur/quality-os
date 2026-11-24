import api from './axios';

export default {
  list: (params) => api.get('/inspections', { params }).then((r) => r.data),
  get: (id) => api.get(`/inspections/${id}`).then((r) => r.data),
  create: (payload) => api.post('/inspections', payload).then((r) => r.data),

  updateCell: (id, payload) => api.patch(`/inspections/${id}/cell`, payload).then((r) => r.data),
  updateRemarks: (id, payload) => api.patch(`/inspections/${id}/remarks`, payload).then((r) => r.data),
  updateRow: (id, payload) => api.patch(`/inspections/${id}/row`, payload).then((r) => r.data),
  addRow: (id, payload) => api.post(`/inspections/${id}/rows`, payload).then((r) => r.data),

  saveDraft: (id) => api.post(`/inspections/${id}/save-draft`).then((r) => r.data),
  resume: (id) => api.post(`/inspections/${id}/resume`).then((r) => r.data),
  submit: (id) => api.post(`/inspections/${id}/submit`).then((r) => r.data),
  approve: (id) => api.post(`/inspections/${id}/approve`).then((r) => r.data),
  lock: (id) => api.post(`/inspections/${id}/lock`).then((r) => r.data),
  discard: (id) => api.delete(`/inspections/${id}`).then((r) => r.data),
};
