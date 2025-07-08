import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Schema, SchemaDifference, SchemaValidationResult } from '@/shared/types/schema';
import { compareSchemas } from '@/lib/schemaUtils';


interface SchemaContextProps {
  schemas: Schema[];
  primarySchema: Schema | null;
  primarySchemaValidation: SchemaValidationResult | null;
  addSchema: (schema: Schema) => void;
  deleteSchema: (id: string) => void;
  setPrimarySchema: (id: string) => void;
  getSchemaById: (id: string) => Schema | null;
  validateResponseAgainstPrimarySchema: (responseData: any) => void;
}

const SchemaContext = createContext<SchemaContextProps | undefined>(undefined);

export const SchemaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [primarySchema, setPrimarySchemaState] = useState<Schema | null>(null);
  const [primarySchemaValidation, setPrimarySchemaValidation] = useState<SchemaValidationResult | null>(null);
  
  // Load schemas from localStorage on initial load
  useEffect(() => {
    const savedSchemas = localStorage.getItem('api-schemas');
    if (savedSchemas) {
      try {
        const parsedSchemas = JSON.parse(savedSchemas);
        setSchemas(parsedSchemas);
        
        // Set primary schema if one exists
        const primary = parsedSchemas.find((schema: Schema) => schema.isPrimary);
        if (primary) {
          setPrimarySchemaState(primary);
        }
      } catch (error) {
        console.error('Error loading schemas:', error);
      }
    }
  }, []);
  
  // Save schemas to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('api-schemas', JSON.stringify(schemas));
  }, [schemas]);
  
  const addSchema = useCallback((schema: Schema) => {
    setSchemas(prev => {
      // If the new schema is primary, update all other schemas to not be primary
      if (schema.isPrimary) {
        const updated = prev.map(s => ({
          ...s,
          isPrimary: false
        }));
        setPrimarySchemaState(schema);
        return [...updated, schema];
      }
      return [...prev, schema];
    });
  }, []);
  
  const deleteSchema = useCallback((id: string) => {
    setSchemas(prev => {
      const schemaToDelete = prev.find(s => s.id === id);
      const filteredSchemas = prev.filter(s => s.id !== id);
      
      // If we're deleting the primary schema, clear the primary schema state
      if (schemaToDelete?.isPrimary) {
        setPrimarySchemaState(null);
        setPrimarySchemaValidation(null);
      }
      
      return filteredSchemas;
    });
  }, []);
  
  const setPrimarySchema = useCallback((id: string) => {
    setSchemas(prev => {
      const updatedSchemas = prev.map(schema => ({
        ...schema,
        isPrimary: schema.id === id
      }));
      
      const newPrimarySchema = updatedSchemas.find(s => s.id === id) || null;
      setPrimarySchemaState(newPrimarySchema);
      setPrimarySchemaValidation(null);
      
      return updatedSchemas;
    });
  }, []);
  
  const getSchemaById = useCallback((id: string) => {
    return schemas.find(schema => schema.id === id) || null;
  }, [schemas]);
  
  const validateResponseAgainstPrimarySchema = useCallback((responseData: any) => {
    if (!primarySchema) {
      setPrimarySchemaValidation(null);
      return;
    }
    
    const differences = compareSchemas(primarySchema.content, responseData);
    
    setPrimarySchemaValidation({
      valid: differences.length === 0,
      differences
    });
  }, [primarySchema]);
  
  return (
    <SchemaContext.Provider
      value={{
        schemas,
        primarySchema,
        primarySchemaValidation,
        addSchema,
        deleteSchema,
        setPrimarySchema,
        getSchemaById,
        validateResponseAgainstPrimarySchema
      }}
    >
      {children}
    </SchemaContext.Provider>
  );
};

export const useSchema = () => {
  const context = useContext(SchemaContext);
  if (context === undefined) {
    throw new Error('useSchema must be used within a SchemaProvider');
  }
  return context;
};