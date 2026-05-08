import api from './axiosInstance';

export const evaluationApi = {
  evaluate: (data) => api.post('/evaluate', data),
  getStatus: (id) => api.get(`/evaluate/${id}/status`),
  getResults: (id, params) => api.get(`/evaluate/${id}/results`, { params }),
};
