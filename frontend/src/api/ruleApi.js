import api from './axiosInstance';

export const ruleApi = {
  getAll: (includeInactive = false) =>
    api.get('/rules', { params: { includeInactive } }),
  getById: (id) => api.get(`/rules/${id}`),
  create: (data) => api.post('/rules', data),
  update: (id, data) => api.put(`/rules/${id}`, data),
  delete: (id) => api.delete(`/rules/${id}`),
  test: (data) => api.post('/rules/test', data),
};
