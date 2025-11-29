export type SchemaType = 'postman' | 'openapi' | 'generated';

export interface SchemaInfo {
  requestId: string | undefined;
  id: string;
  name: string;
  content: any;
  isPrimary: boolean;
  type: SchemaType;
  createdAt: string;
  schema: any;
}

export type DifferenceType = 'added' | 'removed' | 'changed';

export interface SchemaDifference {
  type: DifferenceType;
  path: string;
  message: string;
  oldValue?: any;
  newValue?: any;
}

export interface SchemaValidationResult {
  valid: boolean;
  differences: SchemaDifference[];
}
