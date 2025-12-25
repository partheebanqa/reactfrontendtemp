export function getCategoryForAssertionType(type: string): string {
  const categoryMap: Record<string, string> = {
    // Status assertions
    status_equals: 'status',

    // Response time and payload assertions
    response_time: 'performance',
    payload_size: 'performance',

    // Header assertions
    header_present: 'header',
    header_equals: 'header',
    header_security_present: 'header',
    header_security_value: 'header',
    header_hsts_max_age: 'header',

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
