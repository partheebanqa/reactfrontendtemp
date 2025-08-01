import { Store, useStore } from "@tanstack/react-store";
import {
  SchemaInfo as Schema,
  SchemaDifference,
  SchemaValidationResult,
} from "@/shared/types/schema";
import { compareSchemas } from "@/lib/schemaUtils";

// Define the shape of our schema state
interface SchemaState {
  schemas: Schema[];
  primarySchema: Schema | null;
  primarySchemaValidation: SchemaValidationResult | null;
  isLoading: boolean;
}

// Initial state for schema
export const initialSchemaState: SchemaState = {
  schemas: [],
  primarySchema: null,
  primarySchemaValidation: null,
  isLoading: false,
};

// Create the store
export const schemaStore = new Store<SchemaState>(initialSchemaState);

// Define actions to update the store
export const schemaActions = {
  setSchemas: (schemas: Schema[]) => {
    schemaStore.setState((state) => ({
      ...state,
      schemas,
    }));
  },

  addSchema: (schema: Schema) => {
    schemaStore.setState((state) => {
      // If the new schema is primary, update all other schemas to not be primary
      if (schema.isPrimary) {
        const updated = state.schemas.map((s) => ({
          ...s,
          isPrimary: false,
        }));

        return {
          ...state,
          schemas: [...updated, schema],
          primarySchema: schema,
        };
      }

      return {
        ...state,
        schemas: [...state.schemas, schema],
      };
    });
  },

  deleteSchema: (id: string) => {
    schemaStore.setState((state) => {
      const schemaToDelete = state.schemas.find((s) => s.id === id);
      const filteredSchemas = state.schemas.filter((s) => s.id !== id);

      // If we're deleting the primary schema, clear the primary schema state
      if (schemaToDelete?.isPrimary) {
        return {
          ...state,
          schemas: filteredSchemas,
          primarySchema: null,
          primarySchemaValidation: null,
        };
      }

      return {
        ...state,
        schemas: filteredSchemas,
      };
    });
  },

  setPrimarySchema: (id: string) => {
    schemaStore.setState((state) => {
      const updatedSchemas = state.schemas.map((schema) => ({
        ...schema,
        isPrimary: schema.id === id,
      }));

      const newPrimarySchema = updatedSchemas.find((s) => s.id === id) || null;

      return {
        ...state,
        schemas: updatedSchemas,
        primarySchema: newPrimarySchema,
        primarySchemaValidation: null,
      };
    });
  },

  validateResponseAgainstPrimarySchema: (responseData: any) => {
    schemaStore.setState((state) => {
      if (!state.primarySchema) {
        return {
          ...state,
          primarySchemaValidation: null,
        };
      }

      const differences = compareSchemas(
        state.primarySchema.content,
        responseData
      );

      return {
        ...state,
        primarySchemaValidation: {
          valid: differences.length === 0,
          differences,
        },
      };
    });
  },

  setIsLoading: (isLoading: boolean) => {
    schemaStore.setState((state) => ({
      ...state,
      isLoading,
    }));
  },

};

// Hook to use the schema store
export const useSchemaStore = () => {
  return useStore(schemaStore);
};
