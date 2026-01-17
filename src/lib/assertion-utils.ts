/**
 * Assertion utility functions for dynamic operator selection based on data types
 */

export function getCategoryForAssertionType(type: string): string {
  const categoryMap: Record<string, string> = {
    // Status assertions
    status_equals: 'status',

    // Response time and payload assertions
    response_time: 'performance',
    payload_size: 'performance',

    // Header assertions
    header_present: 'headers',
    header_equals: 'headers',
    header_contains: 'headers',
    header_security_present: 'HeaderGuard™',
    header_security_value: 'HeaderGuard™',
    header_hsts_max_age: 'HeaderGuard™',

    // Field assertions
    field_present: 'body',
    field_type: 'body',
    field_not_empty: 'body',
    field_equals: 'body',
    field_contains: 'body',
    field_pattern: 'body',
    field_range: 'body',
    field_null: 'body',
    field_not_null: 'body',

    // Array assertions
    array_length: 'body',
    array_present: 'body',
    greater_than_zero: 'body',
    not_empty: 'body',
    less_than: 'body',
    less_than_or_equal: 'body',
    between: 'body',

    // Fallback
    contains: 'body',
  };

  return categoryMap[type] || 'body';
}

export function getOperatorsByDataType(
  dataType: string,
  isArray: boolean = false
): string[] {
  console.log('dataType123:', dataType, 'isArray:', isArray);

  // Array-specific operators - FIXED to match backend
  if (dataType === 'array' || isArray) {
    return [
      'array_length', // Exact length check
      'field_not_equals', // Not equal to length
      'greater_than', // Greater than length
      'less_than', // Less than length
      'less_than_or_equal', // Less than or equal
    ];
  }

  const operators: Record<string, string[]> = {
    string: ['contains', 'field_not_contains'],

    number: [
      'equals',
      'field_not_equals',
      'greater_than',
      'less_than',
      'greater_than_or_equal',
      'less_than_or_equal',
    ],

    boolean: ['field_is_true', 'field_is_false'],

    date: ['date_greater_than', 'date_less_than'],

    null: ['field_null', 'field_not_null'],

    object: ['exists', 'field_not_present'],

    // Performance operators for response_time and payload_size
    performance: ['less_than', 'greater_than', 'equals'],
  };

  return operators[dataType] || ['equals', 'field_not_equals'];
}

/**
 * Map operator type to display label for UI
 */
export function getOperatorDisplayLabel(operator: string): string {
  const labelMap: Record<string, string> = {
    // Array operators
    array_length: 'length =',
    field_not_equals: '≠',
    greater_than: '>',
    less_than: '<',
    less_than_or_equal: '≤',
    // greater_than_or_equal: '≥',
    // greater_than_zero: '> 0',
    // not_empty: 'not empty',
    // between: 'between',
    // array_present: 'exists',

    // String operators
    contains: 'contains',
    field_not_contains: 'not contains',

    // Number operators
    equals: '=',

    // Boolean operators
    field_is_true: 'is true',
    field_is_false: 'is false',

    // Date operators
    date_greater_than: '>',
    date_less_than: '<',

    // Null operators
    field_null: 'is null',
    field_not_null: 'not null',

    // Object operators
    exists: 'exists',
    field_not_present: 'not exists',
  };

  return labelMap[operator] || operator;
}

/**
 * Infer data type from a value
 * Added type inference to auto-detect data type from provided values
 */
export function inferDataType(value: any): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') {
    // Check if it looks like a number
    if (!isNaN(Number(value)) && value !== '') return 'number';
    return 'string';
  }
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return 'string';
}

/**
 * Get configuration for field assertions with dynamic operator selection
 * Enhanced configuration based on data type with sensible defaults
 */
export function getFieldAssertionConfig(
  operator: string,
  value: any,
  fieldPath: string,
  dataType?: string
): any {
  const detectedType = dataType || inferDataType(value);

  const config: any = {
    type: operator, // Will be overridden for arrays
    category: 'body',
    field: fieldPath,
    enabled: true,
    dataType: detectedType,
    operator: operator,
  };

  const displayLabel = getOperatorDisplayLabel(operator);

  switch (detectedType) {
    case 'string':
      config.expectedValue = String(value);
      const stringDesc = getOperatorDescription(operator);
      config.description = `${fieldPath} ${stringDesc} "${value}"`;
      break;

    case 'number':
      config.expectedValue = String(value);
      const numberDesc = getOperatorDescription(operator);
      config.description = `${fieldPath} ${numberDesc} ${value}`;
      break;

    case 'boolean':
      config.expectedValue = String(value);
      const boolDesc = getOperatorDescription(operator);
      config.description = `${fieldPath} ${boolDesc}`;
      break;

    case 'array':
      // CRITICAL: For arrays, type should always be 'array_length'
      // except for 'array_present' which is a different type
      if (operator === 'array_present') {
        config.type = 'array_present';
        config.expectedValue = '';
        config.description = `${fieldPath} array exists`;
      } else {
        // All other array operators use type 'array_length'
        config.type = 'array_length';

        // Handle special operators
        if (operator === 'greater_than_zero' || operator === 'not_empty') {
          config.expectedValue = '';
          const arrayEmptyDesc = getOperatorDescription(operator);
          config.description = `${fieldPath} array ${arrayEmptyDesc}`;
        } else if (operator === 'between') {
          config.expectedValue = String(value); // e.g., "1-5"
          config.description = `${fieldPath} array length is between ${value}`;
        } else {
          config.expectedValue = String(
            Array.isArray(value) ? value.length : value
          );
          const arrayDesc = getOperatorDescription(operator);
          config.description = `${fieldPath} array ${arrayDesc} ${config.expectedValue}`;
        }
      }
      break;

    case 'object':
      config.expectedValue = '';
      const objectDesc = getOperatorDescription(operator);
      config.description = `${fieldPath} ${objectDesc}`;
      break;

    case 'null':
      config.expectedValue = '';
      const nullDesc = getOperatorDescription(operator);
      config.description = `${fieldPath} ${nullDesc}`;
      break;
    default:
      config.expectedValue = String(value);
      const defaultDesc = getOperatorDescription(operator);
      config.description = `${fieldPath} ${defaultDesc} "${value}"`;
  }

  return config;
}

/**
 * Get configuration for array assertions with dynamic operator selection
 * Updated to match backend-supported operators
 */
export const getArrayAssertionConfig = (
  operator: string,
  value: string,
  fieldPath: string
) => {
  const config: any = {
    type: operator === 'array_present' ? 'array_present' : 'array_length',
    category: 'body',
    field: fieldPath,
    enabled: true,
    operator: operator,
  };

  switch (operator) {
    case 'array_length':
    case 'equals':
      config.expectedValue = String(value);
      config.description = `${fieldPath} array length equals ${value}`;
      break;

    case 'field_not_equals':
      config.expectedValue = String(value);
      config.description = `${fieldPath} array length does not equal ${value}`;
      break;

    case 'greater_than':
      config.expectedValue = String(value);
      config.description = `${fieldPath} array length is greater than ${value}`;
      break;

    case 'less_than':
      config.expectedValue = String(value);
      config.description = `${fieldPath} array length is less than ${value}`;
      break;

    // case 'greater_than_or_equal':
    //   config.expectedValue = String(value);
    //   config.description = `${fieldPath} array length is greater than or equal to ${value}`;
    //   break;

    case 'less_than_or_equal':
      config.expectedValue = String(value);
      config.description = `${fieldPath} array length is less than or equal to ${value}`;
      break;

    // case 'not_empty':
    //   config.expectedValue = '';
    //   config.description = `${fieldPath} array is not empty`;
    //   break;

    case 'greater_than_zero':
      config.expectedValue = '';
      config.description = `${fieldPath} array has at least one element`;
      break;

    // case 'between':
    //   config.expectedValue = String(value);
    //   config.description = `${fieldPath} array length is between ${value}`;
    //   break;

    // case 'array_present':
    //   config.type = 'array_present';
    //   config.expectedValue = '';
    //   config.description = `${fieldPath} array field exists`;
    //   break;

    default:
      config.expectedValue = String(value);
      config.description = `${fieldPath} array length equals ${value}`;
  }

  return config;
};

/**
 * Get descriptive text for operator (without special characters)
 */
function getOperatorDescription(operator: string): string {
  const descriptions: Record<string, string> = {
    // Comparison operators
    equals: 'equals',
    field_not_equals: 'does not equal',
    greater_than: 'is greater than',
    less_than: 'is less than',
    // greater_than_or_equal: 'is greater than or equal to',
    less_than_or_equal: 'is less than or equal to',

    // String operators
    contains: 'contains',
    field_not_contains: 'does not contain',

    // Boolean operators
    field_is_true: 'is true',
    field_is_false: 'is false',

    // Null operators
    field_null: 'is null',
    field_not_null: 'is not null',

    // Existence operators
    exists: 'exists',
    field_not_present: 'does not exist',

    // Date operators
    date_greater_than: 'is after',
    date_less_than: 'is before',

    // Array operators
    array_length: 'length equals',
    greater_than_zero: 'has at least one element',
    not_empty: 'is not empty',
    between: 'length is between',
    array_present: 'exists',
  };

  return descriptions[operator] || operator;
}
