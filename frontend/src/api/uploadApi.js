import api from './axiosInstance';

export const uploadApi = {
  upload: (formData, signal) =>
    api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      signal, // AbortController signal to cancel in-flight uploads
    }),
  validate: (data) => api.post('/upload/validate', data),
};
