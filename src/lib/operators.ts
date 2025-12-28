export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'object'
  | 'array';

export interface Operator {
  id: string;
  name: string;
  symbol: string;
  description?: string;
}

export const OPERATORS_BY_TYPE: Record<FieldType, Operator[]> = {
  string: [
    { id: 'equals', name: 'Equals', symbol: '=' },
    { id: 'field_not_equals', name: 'Not equals', symbol: '≠' },
    { id: 'contains', name: 'Contains', symbol: 'contains' },
    {
      id: 'field_not_contains',
      name: 'Does not contain',
      symbol: 'not contains',
    },
    { id: 'field_starts_with', name: 'Starts with', symbol: 'starts with' },
    { id: 'field_ends_with', name: 'Ends with', symbol: 'ends with' },
  ],
  number: [
    { id: 'equals', name: 'Equals', symbol: '=' },
    { id: 'field_not_equals', name: 'Not equals', symbol: '≠' },
    { id: 'field_greater_than', name: 'Greater than', symbol: '>' },
    { id: 'field_less_than', name: 'Less than', symbol: '<' },
    { id: 'field_greater_equal', name: 'Greater than or equal', symbol: '≥' },
    { id: 'field_less_equal', name: 'Less than or equal', symbol: '≤' },
    { id: 'between', name: 'Between (inclusive)', symbol: 'between' },
  ],
  boolean: [
    { id: 'equals', name: 'Equals', symbol: '=' },
    { id: 'field_not_equals', name: 'Not equals', symbol: '≠' },
    { id: 'field_is_true', name: 'Is true', symbol: 'is true' },
    { id: 'field_is_false', name: 'Is false', symbol: 'is false' },
  ],
  null: [
    { id: 'field_null', name: 'Is null', symbol: 'is null' },
    { id: 'field_not_null', name: 'Is not null', symbol: 'not null' },
  ],
  object: [
    { id: 'exists', name: 'Exists', symbol: 'exists' },
    { id: 'field_not_present', name: 'Does not exist', symbol: 'not exists' },
    { id: 'field_has_property', name: 'Has property', symbol: 'has property' },
    { id: 'equals', name: 'Equals', symbol: '=' },
    { id: 'field_not_equals', name: 'Not equals', symbol: '≠' },
  ],
  array: [
    { id: 'array_length', name: 'Array length', symbol: 'length' },
    { id: 'equals', name: 'Equals', symbol: '=' },
    { id: 'field_not_equals', name: 'Not equals', symbol: '≠' },
  ],
};

export const getOperatorsForFieldType = (fieldType: FieldType): Operator[] => {
  console.log('fieldType123:', fieldType);
  return OPERATORS_BY_TYPE[fieldType] || OPERATORS_BY_TYPE.string;
};

export const getFieldType = (value: any): FieldType => {
  console.log('value123:', value);

  if (value === null) return 'null';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return 'string';
};
