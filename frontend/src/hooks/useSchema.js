import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schemaApi } from '../api/schemaApi';

export const useSchemaFields = () => {
  return useQuery({
    queryKey: ['schema-fields'],
    queryFn: async () => {
      const { data } = await schemaApi.getAll();
      return data.data;
    },
  });
};

export const useSchemaGrouped = () => {
  return useQuery({
    queryKey: ['schema-grouped'],
    queryFn: async () => {
      const { data } = await schemaApi.getGrouped();
      return data.data.grouped;
    },
  });
};

export const useCreateField = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fieldData) => schemaApi.create(fieldData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schema-fields'] });
      queryClient.invalidateQueries({ queryKey: ['schema-grouped'] });
    },
  });
};

export const useUpdateField = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => schemaApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schema-fields'] });
      queryClient.invalidateQueries({ queryKey: ['schema-grouped'] });
    },
  });
};

export const useDeleteField = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => schemaApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schema-fields'] });
      queryClient.invalidateQueries({ queryKey: ['schema-grouped'] });
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });
};

export const useCheckFieldImpact = () => {
  return useMutation({
    mutationFn: (fieldName) => schemaApi.checkImpact(fieldName),
  });
};
