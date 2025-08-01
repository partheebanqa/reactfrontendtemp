import { useEffect } from "react";
import { useSchemaStore, schemaActions } from "@/store/schemaStore";
import { Schema, SchemaValidationResult } from '@/shared/types/schema';
import { fetchSchemaMutation, useUploadRequestSchemaMutation } from "@/store/query/schemaQuery";
import { useCollection } from "./useCollection";

export function useSchema() {
  // Get schema state from store
  const { schemas, primarySchema, primarySchemaValidation, isLoading } = useSchemaStore();
  const { activeRequest } = useCollection()
  const fetchSchema = fetchSchemaMutation();
  // Initialize schemas from localStorage on component mount
  useEffect(() => {
    if(activeRequest?.id){
      fetchSchema.mutate(activeRequest?.id);
    }
  }, [activeRequest]);
  
  
  // Helper function to get schema by ID
  const getSchemaById = (id: string): Schema | null => {
    return schemas.find(schema => schema.id === id) || null;
  };
  
  const uploadSchemaMutation = useUploadRequestSchemaMutation();

  return {
    // State
    schemas,
    primarySchema,
    primarySchemaValidation,
    isLoading,
    
    // Actions
    addSchema: schemaActions.addSchema,
    deleteSchema: schemaActions.deleteSchema,
    setPrimarySchema: schemaActions.setPrimarySchema,
    validateResponseAgainstPrimarySchema: schemaActions.validateResponseAgainstPrimarySchema,
    
    // Helpers
    getSchemaById,
    uploadSchemaMutation,
    fetchSchema

  };
}
