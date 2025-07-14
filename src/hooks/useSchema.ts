import { useEffect } from "react";
import { useSchemaStore, schemaActions } from "@/store/schemaStore";
import { Schema, SchemaValidationResult } from '@/shared/types/schema';

export function useSchema() {
  // Get schema state from store
  const { schemas, primarySchema, primarySchemaValidation, isLoading } = useSchemaStore();
  
  // Initialize schemas from localStorage on component mount
  useEffect(() => {
    schemaActions.initializeFromLocalStorage();
  }, []);
  
  // Save schemas to localStorage whenever they change
  useEffect(() => {
    if (schemas.length > 0) {
      schemaActions.saveToLocalStorage();
    }
  }, [schemas]);
  
  // Helper function to get schema by ID
  const getSchemaById = (id: string): Schema | null => {
    return schemas.find(schema => schema.id === id) || null;
  };
  
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
    getSchemaById
  };
}
