import {
  fetchSchema,
  uploadSchema,
  setPrimarySchema,
  deleteSchema,
} from '@/services/schema.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { schemaActions } from '../schemaStore';

export const useUploadRequestSchemaMutation = () => {
  const queryClient = useQueryClient();
  const { mutate: fetchSchemaMutate } = fetchSchemaMutation();

  return useMutation({
    mutationFn: uploadSchema,
    onSuccess: (newSchema: any, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['schemas', variables.requestId],
      });
      // Refetch schemas from server
      fetchSchemaMutate(variables.requestId);
    },
    onError: (error) => {
      console.error('Error uploading schema:', error);
    },
  });
};

export const fetchSchemaMutation = () => {
  return useMutation({
    mutationFn: fetchSchema,
    onSuccess: (fetchedSchema: any) => {
      schemaActions.setSchemas(fetchedSchema?.data);
    },
    onError: (error) => {
      console.error('Error fetching schema:', error);
    },
  });
};

export const useSetPrimarySchemaMutation = () => {
  const queryClient = useQueryClient();
  const { mutate: fetchSchemaMutate } = fetchSchemaMutation();

  return useMutation({
    mutationFn: setPrimarySchema,
    onSuccess: (data: any, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['schemas', variables.requestId],
      });
      fetchSchemaMutate(variables.requestId);
    },
    onError: (error) => {
      console.error('Error setting primary schema:', error);
    },
  });
};

export const useDeleteSchemaMutation = () => {
  const queryClient = useQueryClient();
  const { mutate: fetchSchemaMutate } = fetchSchemaMutation();

  return useMutation({
    mutationFn: deleteSchema,
    onSuccess: (data: any, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['schemas', variables.requestId],
      });
      fetchSchemaMutate(variables.requestId);
    },
    onError: (error) => {
      console.error('Error deleting schema:', error);
    },
  });
};
