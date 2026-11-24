import api from './axios';

// Mirrors the backend's crudControllerFactory - gives every simple
// master-data resource the same { list, get, create, update, remove } shape.
export default function resourceApi(basePath) {
  return {
    list: (params) => api.get(basePath, { params }).then((r) => r.data),
    get: (id) => api.get(`${basePath}/${id}`).then((r) => r.data),
    create: (payload) => api.post(basePath, payload).then((r) => r.data),
    update: (id, payload) => api.put(`${basePath}/${id}`, payload).then((r) => r.data),
    remove: (id) => api.delete(`${basePath}/${id}`).then((r) => r.data),
  };
}
