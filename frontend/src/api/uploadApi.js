import api from './axiosInstance';

export const uploadApi = {
  upload: (formData) =>
    api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  validate: (data) => api.post('/upload/validate', data),
};
