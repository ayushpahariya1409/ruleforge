import api from './axiosInstance';

export const evaluationApi = {
  evaluate: (data) => api.post('/evaluate', data),
  getResults: (id, page = 1, limit = 50) => api.get(`/evaluate/${id}/results?page=${page}&limit=${limit}`),
};
