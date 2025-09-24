import {
  fetchSchema,
  uploadSchema,
  setPrimarySchema,
  deleteSchema,
} from '@/services/schema.service';
import { useMutation } from '@tanstack/react-query';
import { schemaActions } from '../schemaStore';

export const useUploadRequestSchemaMutation = () => {
  return useMutation({
    mutationFn: uploadSchema,
    onSuccess: (newSchema: any) => {
      console.log('New schema uploaded:', newSchema);
      schemaActions.addSchema(newSchema);
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
  return useMutation({
    mutationFn: setPrimarySchema,
    onSuccess: (data: any, variables) => {
      console.log('Schema set as primary:', data);
      // Update local state
      schemaActions.setPrimarySchema(variables.schemaId);
    },
    onError: (error) => {
      console.error('Error setting primary schema:', error);
    },
  });
};

export const useDeleteSchemaMutation = () => {
  return useMutation({
    mutationFn: deleteSchema,
    onSuccess: (data: any, variables) => {
      console.log('Schema deleted:', data);
      // Update local state
      schemaActions.deleteSchema(variables.schemaId);
    },
    onError: (error) => {
      console.error('Error deleting schema:', error);
    },
  });
};
