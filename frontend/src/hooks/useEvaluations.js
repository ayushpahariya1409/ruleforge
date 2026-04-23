import { useQuery } from '@tanstack/react-query';
import { resultApi } from '../api/resultApi';
import api from '../api/axiosInstance';

export const useEvaluations = (params = {}) => {
  return useQuery({
    queryKey: ['evaluations', params],
    queryFn: async () => {
      const { data } = await resultApi.getAll(params);
      return { evaluations: data.data, pagination: data.pagination };
    },
  });
};

export const useEvaluation = (id) => {
  return useQuery({
    queryKey: ['evaluation', id],
    queryFn: async () => {
      const { data } = await resultApi.getById(id);
      return data.data.evaluation;
    },
    enabled: !!id,
  });
};

export const useEvaluationResults = (id, params = {}) => {
  return useQuery({
    queryKey: ['evaluationResults', id, params],
    queryFn: async () => {
      const { data } = await api.get(`/evaluate/${id}/results`, { params });
      return data.data;
    },
    enabled: !!id,
  });
};

export const useStats = () => {
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data } = await resultApi.getStats();
      return data.data.stats;
    },
  });
};
