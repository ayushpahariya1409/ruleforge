import api from './axiosInstance';

export const schemaApi = {
  getAll: () => api.get('/schema'),
  getGrouped: () => api.get('/schema/grouped'),
  getById: (id) => api.get(`/schema/${id}`),
  create: (data) => api.post('/schema', data),
  update: (id, data) => api.put(`/schema/${id}`, data),
  delete: (id) => api.delete(`/schema/${id}`),
  checkImpact: (fieldName) => api.get(`/schema/impact/${fieldName}`),
  downloadTemplate: () => api.get('/schema/template', { responseType: 'blob' }),
};
