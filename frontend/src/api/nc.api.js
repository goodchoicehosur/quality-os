import api from './axios';

export default {
  list: (params) => api.get('/nc', { params }).then((r) => r.data),
  get: (id) => api.get(`/nc/${id}`).then((r) => r.data),
  create: (payload) => api.post('/nc', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/nc/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/nc/${id}`).then((r) => r.data),

  updateRootCause: (id, payload) => api.put(`/nc/${id}/root-cause`, payload).then((r) => r.data),
  updateCorrectiveAction: (id, payload) => api.put(`/nc/${id}/corrective-action`, payload).then((r) => r.data),
  updateImpact: (id, payload) => api.put(`/nc/${id}/impact`, payload).then((r) => r.data),

  addComment: (id, text) => api.post(`/nc/${id}/comments`, { text }).then((r) => r.data),
  addAttachment: (id, payload) => api.post(`/nc/${id}/attachments`, payload).then((r) => r.data),
  uploadAttachment: (id, payload) => api.post(`/nc/${id}/attachments/upload`, payload).then((r) => r.data),
  updateWhyWhy: (id, payload) => api.put(`/nc/${id}/whywhy`, payload).then((r) => r.data),
  advance: (id) => api.post(`/nc/${id}/advance`).then((r) => r.data),
  approveClose: (id) => api.post(`/nc/${id}/approve-close`).then((r) => r.data),
  escalate: (id, reason) => api.post(`/nc/${id}/escalate`, { reason }).then((r) => r.data),
};
