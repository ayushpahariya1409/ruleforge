import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ruleApi } from '../api/ruleApi';

export const useRules = (includeInactive = false) => {
  return useQuery({
    queryKey: ['rules', includeInactive],
    queryFn: async () => {
      const { data } = await ruleApi.getAll(includeInactive);
      return data.data;
    },
  });
};

export const useRule = (id) => {
  return useQuery({
    queryKey: ['rule', id],
    queryFn: async () => {
      const { data } = await ruleApi.getById(id);
      return data.data.rule;
    },
    enabled: !!id,
  });
};

export const useCreateRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleData) => ruleApi.create(ruleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });
};

export const useUpdateRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => ruleApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });
};

export const useDeleteRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => ruleApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });
};

export const useTestRule = () => {
  return useMutation({
    mutationFn: (data) => ruleApi.test(data),
  });
};
