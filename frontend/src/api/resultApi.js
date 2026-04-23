import api from './axiosInstance';

export const resultApi = {
  getAll: (params) => api.get('/results', { params }),
  getById: (id) => api.get(`/results/${id}`),
  getStats: () => api.get('/results/stats'),
};
