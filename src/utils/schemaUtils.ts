import { SchemaType, SchemaDifference } from '../shared/types/schema';

/**
 * Detects the type of schema from its content
 */
export const detectSchemaType = (schema: any): SchemaType | null => {
  // Check for Postman Collection
  if (schema.info && schema.info.schema && schema.info.schema.includes('postman')) {
    return 'postman';
  }
  
  // Check for OpenAPI
  if (schema.openapi || schema.swagger) {
    return 'openapi';
  }
  
  // If can't determine, assume it's a generated/custom schema
  if (typeof schema === 'object' && schema !== null) {
    return 'generated';
  }
  
  return null;
};

/**
 * Validates a schema based on its type
 */
export const validateSchema = (schema: any, type: SchemaType): boolean => {
  // Basic validation
  if (typeof schema !== 'object' || schema === null) {
    return false;
  }
  
  switch (type) {
    case 'postman':
      return !!schema.info && !!schema.item;
    
    case 'openapi':
      return (!!schema.openapi || !!schema.swagger) && !!schema.paths;
    
    case 'generated':
      // For generated schemas, we're more lenient
      return true;
    
    default:
      return false;
  }
};

/**
 * Compares two JSON objects and returns an array of differences
 */
export const compareSchemas = (schema1: any, schema2: any): SchemaDifference[] => {
  const differences: SchemaDifference[] = [];
  
  // Helper function to compare two objects
  const compareObjects = (obj1: any, obj2: any, path = '') => {
    // Handle primitive types and null values
    if (obj1 === null || obj2 === null || 
        typeof obj1 !== 'object' || typeof obj2 !== 'object' ||
        Array.isArray(obj1) !== Array.isArray(obj2)) {
      
      if (obj1 === undefined && obj2 !== undefined) {
        differences.push({
          type: 'added',
          path,
          message: `Property added with value: ${JSON.stringify(obj2)}`,
          newValue: obj2
        });
      } else if (obj1 !== undefined && obj2 === undefined) {
        differences.push({
          type: 'removed',
          path,
          message: `Property removed with value: ${JSON.stringify(obj1)}`,
          oldValue: obj1
        });
      } else if (obj1 !== obj2) {
        // Check if types are different
        if (typeof obj1 !== typeof obj2) {
          differences.push({
            type: 'changed',
            path,
            message: `Type changed from ${typeof obj1} to ${typeof obj2}`,
            oldValue: obj1,
            newValue: obj2
          });
        } 
        // Special case for date format changes
        else if (typeof obj1 === 'string' && typeof obj2 === 'string' && 
                 (isDateString(obj1) || isDateString(obj2))) {
          if (isDateString(obj1) && isDateString(obj2)) {
            differences.push({
              type: 'changed',
              path,
              message: `Date format changed from "${obj1}" to "${obj2}"`,
              oldValue: obj1,
              newValue: obj2
            });
          } else {
            differences.push({
              type: 'changed',
              path,
              message: `Value changed from "${obj1}" to "${obj2}"`,
              oldValue: obj1,
              newValue: obj2
            });
          }
        }
        // For other value changes
        else {
          differences.push({
            type: 'changed',
            path,
            message: `Value changed from ${JSON.stringify(obj1)} to ${JSON.stringify(obj2)}`,
            oldValue: obj1,
            newValue: obj2
          });
        }
      }
      return;
    }
    
    // Handle arrays
    if (Array.isArray(obj1)) {
      // For simplicity, we'll just check array lengths and values at each index
      const maxLength = Math.max(obj1.length, obj2.length);
      
      for (let i = 0; i < maxLength; i++) {
        if (i >= obj1.length) {
          differences.push({
            type: 'added',
            path: `${path}[${i}]`,
            message: `Array item added at index ${i}: ${JSON.stringify(obj2[i])}`,
            newValue: obj2[i]
          });
        } else if (i >= obj2.length) {
          differences.push({
            type: 'removed',
            path: `${path}[${i}]`,
            message: `Array item removed at index ${i}: ${JSON.stringify(obj1[i])}`,
            oldValue: obj1[i]
          });
        } else {
          compareObjects(obj1[i], obj2[i], `${path}[${i}]`);
        }
      }
      return;
    }
    
    // Handle objects
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    // Check for removed properties
    for (const key of keys1) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (!keys2.includes(key)) {
        differences.push({
          type: 'removed',
          path: currentPath,
          message: `Property "${key}" was removed`,
          oldValue: obj1[key]
        });
      } else {
        compareObjects(obj1[key], obj2[key], currentPath);
      }
    }
    
    // Check for added properties
    for (const key of keys2) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (!keys1.includes(key)) {
        differences.push({
          type: 'added',
          path: currentPath,
          message: `Property "${key}" was added`,
          newValue: obj2[key]
        });
      }
    }
  };
  
  compareObjects(schema1, schema2);
  return differences;
};

/**
 * Checks if a string is likely a date string
 */
const isDateString = (str: string): boolean => {
  // Check common date formats
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/, // ISO format
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
    /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
  ];
  
  return datePatterns.some(pattern => pattern.test(str));
};

/**
 * Generates a basic JSON schema from a JSON object
 */
export const generateJsonSchema = (json: any): any => {
  const generateSchema = (value: any): any => {
    if (value === null) {
      return { type: 'null' };
    }
    
    switch (typeof value) {
      case 'boolean':
        return { type: 'boolean' };
      case 'number':
        return { type: 'number' };
      case 'string':
        // Check for date format
        if (isDateString(value)) {
          return { 
            type: 'string',
            format: 'date-time',
            example: value
          };
        }
        return { type: 'string' };
      case 'object':
        if (Array.isArray(value)) {
          // For arrays, create a schema based on the items
          if (value.length === 0) {
            return { 
              type: 'array',
              items: {}
            };
          }
          
          // Sample the first 5 items at most
          const sampleItems = value.slice(0, 5);
          const itemSchemas = sampleItems.map(item => generateSchema(item));
          
          // Use the first item as the base schema, this is a simplification
          return {
            type: 'array',
            items: itemSchemas[0]
          };
        } else {
          // For objects, process each property
          const properties: Record<string, any> = {};
          const required: string[] = [];
          
          for (const key in value) {
            properties[key] = generateSchema(value[key]);
            required.push(key);
          }
          
          return {
            type: 'object',
            properties,
            required
          };
        }
      default:
        return {};
    }
  };
  
  return generateSchema(json);
};