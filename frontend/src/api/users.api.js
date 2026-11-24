import api from './axios';
import resourceApi from './resourceApi';

const usersApi = resourceApi('/users');

export default {
  ...usersApi,
  listInspectors: () => api.get('/users/inspectors').then((r) => r.data),
};
