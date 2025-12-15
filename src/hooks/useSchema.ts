import { useSchemaStore, schemaActions } from '@/store/schemaStore';
import { Schema, SchemaValidationResult } from '@/shared/types/schema';
import {
  fetchSchemaMutation,
  useUploadRequestSchemaMutation,
  useSetPrimarySchemaMutation,
  useDeleteSchemaMutation,
} from '@/store/query/schemaQuery';
import { useCollection } from './useCollection';
import { useToast } from './use-toast';

export function useSchema() {
  const { schemas, primarySchema, primarySchemaValidation, isLoading } =
    useSchemaStore();
  const { toast } = useToast();
  const { activeRequest } = useCollection();
  const fetchSchema = fetchSchemaMutation();
  const setPrimarySchemaMutation = useSetPrimarySchemaMutation();
  const deleteSchemaMutation = useDeleteSchemaMutation();

  const getSchemaById = (id: string): Schema | null => {
    return schemas.find((schema) => schema.id === id) || null;
  };

  const uploadSchemaMutation = useUploadRequestSchemaMutation();

  const fetchSchemas = () => {
    if (activeRequest?.id) {
      fetchSchema.mutate(activeRequest.id);
    }
  };

  const setPrimarySchema = (schemaId: string) => {
    if (activeRequest?.id) {
      setPrimarySchemaMutation.mutate(
        {
          requestId: activeRequest.id,
          schemaId: schemaId,
        },
        {
          onSuccess: () => {
            toast({
              title: 'Primary schema updated',
              description: 'The selected schema is now set as primary.',
              variant: 'default',
            });
          },
          onError: (error: any) => {
            toast({
              title: 'Error setting primary schema',
              description: error?.message || 'Something went wrong.',
              variant: 'destructive',
            });
          },
        }
      );
    }
  };

  const deleteSchema = (schemaId: string) => {
    if (activeRequest?.id) {
      deleteSchemaMutation.mutate(
        {
          requestId: activeRequest.id,
          schemaId: schemaId,
        },
        {
          onSuccess: () => {
            toast({
              title: 'Schema deleted',
              description: 'The schema was successfully removed.',
              variant: 'default',
            });
          },
          onError: (error: any) => {
            toast({
              title: 'Error deleting schema',
              description: error?.message || 'Something went wrong.',
              variant: 'destructive',
            });
          },
        }
      );
    }
  };

  return {
    schemas,
    primarySchema,
    primarySchemaValidation,
    isLoading,
    addSchema: schemaActions.addSchema,
    deleteSchema,
    setPrimarySchema,
    validateResponseAgainstPrimarySchema:
      schemaActions.validateResponseAgainstPrimarySchema,
    fetchSchemas,
    getSchemaById,
    uploadSchemaMutation,
    fetchSchema,
  };
}
