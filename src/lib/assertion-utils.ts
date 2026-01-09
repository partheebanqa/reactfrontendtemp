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

    // Fallback
    contains: 'body',
  };

  return categoryMap[type] || 'body';
}

export const getArrayAssertionConfig = (
  operator: string,
  value: string,
  fieldPath: string
) => {
  const config: any = {
    type: 'array_length',
    category: 'body',
    field: fieldPath,
    enabled: true,
  };

  switch (operator) {
    case 'array_length':
      // User will provide the expected length
      config.operator = 'equals';
      config.expectedValue = value;
      config.description = `${fieldPath} array has exactly ${value} elements`;
      break;

    case 'equals':
      config.operator = 'equals';
      config.expectedValue = value;
      config.description = `${fieldPath} array has exactly ${value} elements`;
      break;

    case 'field_not_equals':
      config.operator = 'not_equals';
      config.expectedValue = value;
      config.description = `${fieldPath} array does not have ${value} elements`;
      break;

    case 'field_greater_than':
      config.operator = 'greater_than';
      config.expectedValue = value;
      config.description = `${fieldPath} array has more than ${value} elements`;
      break;

    case 'field_less_than':
      config.operator = 'less_than';
      config.expectedValue = value;
      config.description = `${fieldPath} array has less than ${value} elements`;
      break;

    case 'field_greater_equal':
      config.operator = 'greater_than_or_equal';
      config.expectedValue = value;
      config.description = `${fieldPath} array has at least ${value} elements`;
      break;

    case 'field_less_equal':
      config.operator = 'less_than_or_equal';
      config.expectedValue = value;
      config.description = `${fieldPath} array has at most ${value} elements`;
      break;

    case 'not_empty':
      config.operator = 'not_empty';
      config.expectedValue = '';
      config.description = `${fieldPath} array is not empty`;
      break;

    case 'greater_than_zero':
      config.operator = 'greater_than_zero';
      config.expectedValue = '';
      config.description = `${fieldPath} array is not empty`;
      break;

    default:
      config.operator = 'equals';
      config.expectedValue = value;
      config.description = `${fieldPath} array length equals ${value}`;
  }

  return config;
};
