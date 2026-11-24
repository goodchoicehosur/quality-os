import api from './axios';
import resourceApi from './resourceApi';

const base = resourceApi('/templates');

export default {
  ...base,
  resolve: (id) => api.get(`/templates/${id}/resolve`).then((r) => r.data),
  autoBuild: (payload) => api.post('/templates/auto-build', payload).then((r) => r.data),
};
