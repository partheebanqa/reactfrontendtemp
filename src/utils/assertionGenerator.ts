import { ApiResponse, Assertion } from '@/shared/types/assertion';

// Header security configurations with priority and impact
const SECURITY_HEADERS = {
  // Security Headers
  'strict-transport-security': {
    group: 'security',
    priority: 'Critical' as const,
    impact: 'Prevents man-in-the-middle attacks and protocol downgrade attacks',
    description: 'HSTS header enforces HTTPS connections',
  },
  'content-security-policy': {
    group: 'security',
    priority: 'Critical' as const,
    impact: 'Prevents XSS, clickjacking, and code injection attacks',
    description: 'CSP header prevents malicious script execution',
  },
  'x-frame-options': {
    group: 'security',
    priority: 'High' as const,
    impact: 'Prevents clickjacking attacks by controlling iframe embedding',
    description: 'X-Frame-Options prevents clickjacking attacks',
  },
  'x-content-type-options': {
    group: 'security',
    priority: 'High' as const,
    impact: 'Prevents MIME type sniffing vulnerabilities',
    description: 'X-Content-Type-Options prevents MIME sniffing',
  },
  'referrer-policy': {
    group: 'security',
    priority: 'Medium' as const,
    impact: 'Controls referrer information leakage to external sites',
    description: 'Referrer-Policy controls referrer information disclosure',
  },
  'permissions-policy': {
    group: 'security',
    priority: 'Medium' as const,
    impact:
      'Controls browser feature access and prevents unauthorized API usage',
    description: 'Permissions-Policy controls browser feature access',
  },
  'x-xss-protection': {
    group: 'security',
    priority: 'High' as const,
    impact: 'Enables XSS filtering in older browsers',
    description: 'X-XSS-Protection enables browser XSS filtering',
  },
  'cross-origin-embedder-policy': {
    group: 'security',
    priority: 'Medium' as const,
    impact: 'Controls cross-origin resource embedding and isolation',
    description: 'COEP controls cross-origin resource embedding',
  },
  'cross-origin-opener-policy': {
    group: 'security',
    priority: 'Medium' as const,
    impact: 'Prevents cross-origin window references and attacks',
    description: 'COOP prevents cross-origin window access',
  },
  'cross-origin-resource-policy': {
    group: 'security',
    priority: 'Medium' as const,
    impact: 'Controls cross-origin resource loading',
    description: 'CORP controls cross-origin resource access',
  },

  // Performance & Caching Headers
  'cache-control': {
    group: 'performance and caching',
    priority: 'High' as const,
    impact: 'Optimizes caching strategy and reduces server load',
    description: 'Cache-Control optimizes resource caching',
  },
  etag: {
    group: 'performance and caching',
    priority: 'Medium' as const,
    impact: 'Enables efficient cache validation and reduces bandwidth',
    description: 'ETag enables efficient cache validation',
  },
  expires: {
    group: 'performance and caching',
    priority: 'Medium' as const,
    impact: 'Sets explicit expiration time for cached resources',
    description: 'Expires header sets cache expiration time',
  },
  'last-modified': {
    group: 'performance and caching',
    priority: 'Low' as const,
    impact: 'Enables conditional requests and cache validation',
    description: 'Last-Modified enables conditional requests',
  },
  age: {
    group: 'performance and caching',
    priority: 'Low' as const,
    impact: 'Indicates how long response has been cached',
    description: 'Age header shows cache freshness',
  },
  pragma: {
    group: 'performance and caching',
    priority: 'Low' as const,
    impact: 'Legacy cache control for HTTP/1.0 compatibility',
    description: 'Pragma provides legacy cache control',
  },
  'if-none-match': {
    group: 'performance and caching',
    priority: 'Low' as const,
    impact: 'Enables conditional requests based on ETag',
    description: 'If-None-Match enables conditional requests',
  },
  'if-modified-since': {
    group: 'performance and caching',
    priority: 'Low' as const,
    impact: 'Enables conditional requests based on modification time',
    description: 'If-Modified-Since enables conditional requests',
  },

  // Fast Response & Observability Headers
  'server-timing': {
    group: 'fast response and observability',
    priority: 'Medium' as const,
    impact: 'Provides performance metrics for optimization',
    description: 'Server-Timing provides performance insights',
  },
  'x-response-time': {
    group: 'fast response and observability',
    priority: 'Low' as const,
    impact: 'Tracks response time for performance monitoring',
    description: 'X-Response-Time tracks response performance',
  },
  'x-request-id': {
    group: 'fast response and observability',
    priority: 'Medium' as const,
    impact: 'Enables request tracing and debugging',
    description: 'X-Request-ID enables request tracing',
  },
  'x-correlation-id': {
    group: 'fast response and observability',
    priority: 'Medium' as const,
    impact: 'Enables distributed tracing across services',
    description: 'X-Correlation-ID enables distributed tracing',
  },
  'x-trace-id': {
    group: 'fast response and observability',
    priority: 'Medium' as const,
    impact: 'Provides unique identifier for request tracing',
    description: 'X-Trace-ID provides request tracing',
  },
  'x-powered-by': {
    group: 'fast response and observability',
    priority: 'Low' as const,
    impact: 'Indicates server technology (security consideration)',
    description: 'X-Powered-By shows server technology',
  },
  server: {
    group: 'fast response and observability',
    priority: 'Low' as const,
    impact: 'Identifies server software (security consideration)',
    description: 'Server header identifies server software',
  },
  'x-ratelimit-limit': {
    group: 'fast response and observability',
    priority: 'Medium' as const,
    impact: 'Communicates API rate limiting policies',
    description: 'X-RateLimit-Limit shows rate limit threshold',
  },
  'x-ratelimit-remaining': {
    group: 'fast response and observability',
    priority: 'Medium' as const,
    impact: 'Shows remaining API calls in rate limit window',
    description: 'X-RateLimit-Remaining shows remaining calls',
  },
  'x-ratelimit-reset': {
    group: 'fast response and observability',
    priority: 'Medium' as const,
    impact: 'Indicates when rate limit window resets',
    description: 'X-RateLimit-Reset shows reset time',
  },

  // Standards & Compatibility Headers
  'content-type': {
    group: 'standard and compatibility',
    priority: 'High' as const,
    impact: 'Ensures proper content interpretation by browsers',
    description: 'Content-Type ensures proper content handling',
  },
  'content-encoding': {
    group: 'standard and compatibility',
    priority: 'Medium' as const,
    impact: 'Enables compression and reduces payload size',
    description: 'Content-Encoding enables response compression',
  },
  vary: {
    group: 'standard and compatibility',
    priority: 'Medium' as const,
    impact: 'Ensures proper caching based on request headers',
    description: 'Vary header ensures proper cache variation',
  },
  'access-control-allow-origin': {
    group: 'standard and compatibility',
    priority: 'High' as const,
    impact: 'Controls cross-origin resource sharing and security',
    description: 'CORS header controls cross-origin access',
  },
  'access-control-allow-methods': {
    group: 'standard and compatibility',
    priority: 'High' as const,
    impact: 'Specifies allowed HTTP methods for CORS requests',
    description: 'CORS header specifies allowed methods',
  },
  'access-control-allow-headers': {
    group: 'standard and compatibility',
    priority: 'High' as const,
    impact: 'Specifies allowed headers for CORS requests',
    description: 'CORS header specifies allowed headers',
  },
  'access-control-allow-credentials': {
    group: 'standard and compatibility',
    priority: 'High' as const,
    impact: 'Controls whether credentials are included in CORS requests',
    description: 'CORS header controls credential inclusion',
  },
  'access-control-max-age': {
    group: 'standard and compatibility',
    priority: 'Medium' as const,
    impact: 'Sets preflight request cache duration for CORS',
    description: 'CORS header sets preflight cache duration',
  },
  'access-control-expose-headers': {
    group: 'standard and compatibility',
    priority: 'Medium' as const,
    impact: 'Specifies headers exposed to client in CORS responses',
    description: 'CORS header exposes response headers',
  },
  'content-length': {
    group: 'standard and compatibility',
    priority: 'Medium' as const,
    impact: 'Specifies response body size for proper handling',
    description: 'Content-Length specifies response size',
  },
  'content-disposition': {
    group: 'standard and compatibility',
    priority: 'Medium' as const,
    impact: 'Controls how content is displayed or downloaded',
    description: 'Content-Disposition controls content presentation',
  },
  'content-language': {
    group: 'standard and compatibility',
    priority: 'Low' as const,
    impact: 'Indicates content language for internationalization',
    description: 'Content-Language indicates content language',
  },
  'content-location': {
    group: 'standard and compatibility',
    priority: 'Low' as const,
    impact: 'Provides alternative location for content',
    description: 'Content-Location provides content location',
  },
  'content-range': {
    group: 'standard and compatibility',
    priority: 'Medium' as const,
    impact: 'Specifies partial content range information',
    description: 'Content-Range specifies partial content info',
  },
  'accept-ranges': {
    group: 'standard and compatibility',
    priority: 'Low' as const,
    impact: 'Indicates server support for range requests',
    description: 'Accept-Ranges indicates range request support',
  },
  location: {
    group: 'standard and compatibility',
    priority: 'High' as const,
    impact: 'Provides redirect target URL for 3xx responses',
    description: 'Location header provides redirect URL',
  },
  'www-authenticate': {
    group: 'standard and compatibility',
    priority: 'High' as const,
    impact: 'Specifies authentication method for 401 responses',
    description: 'WWW-Authenticate specifies auth method',
  },
  authorization: {
    group: 'standard and compatibility',
    priority: 'High' as const,
    impact: 'Contains client authentication credentials',
    description: 'Authorization contains auth credentials',
  },
  'user-agent': {
    group: 'standard and compatibility',
    priority: 'Low' as const,
    impact: 'Identifies client application and version',
    description: 'User-Agent identifies client application',
  },
  accept: {
    group: 'standard and compatibility',
    priority: 'Medium' as const,
    impact: 'Specifies acceptable response content types',
    description: 'Accept specifies acceptable content types',
  },
  'accept-encoding': {
    group: 'standard and compatibility',
    priority: 'Medium' as const,
    impact: 'Specifies acceptable response encodings',
    description: 'Accept-Encoding specifies acceptable encodings',
  },
  'accept-language': {
    group: 'standard and compatibility',
    priority: 'Low' as const,
    impact: 'Specifies acceptable response languages',
    description: 'Accept-Language specifies acceptable languages',
  },
  connection: {
    group: 'standard and compatibility',
    priority: 'Low' as const,
    impact: 'Controls connection persistence and behavior',
    description: 'Connection controls connection behavior',
  },
  upgrade: {
    group: 'standard and compatibility',
    priority: 'Medium' as const,
    impact: 'Enables protocol upgrade negotiations',
    description: 'Upgrade enables protocol upgrades',
  },
  'transfer-encoding': {
    group: 'standard and compatibility',
    priority: 'Medium' as const,
    impact: 'Specifies encoding used for message body transfer',
    description: 'Transfer-Encoding specifies transfer method',
  },
  te: {
    group: 'standard and compatibility',
    priority: 'Low' as const,
    impact: 'Specifies acceptable transfer encodings',
    description: 'TE specifies acceptable transfer encodings',
  },
  trailer: {
    group: 'standard and compatibility',
    priority: 'Low' as const,
    impact: 'Lists headers present in chunked transfer trailer',
    description: 'Trailer lists chunked transfer trailer headers',
  },
};

// Helper function to detect data type
const getDataType = (value: any): string => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  if (value instanceof Date) return 'date';

  const type = typeof value;
  if (type === 'object') return 'object';

  return type; // 'string', 'number', 'boolean'
};

// Helper function to check if string is a date
const isDateString = (value: string): boolean => {
  const date = new Date(value);
  return (
    !isNaN(date.getTime()) &&
    (value.includes('-') || value.includes('/') || value.includes('T'))
  );
};

export const generateAssertions = (
  response: ApiResponse,
  staticVariables?: Array<{ name: string; value: string }>,
  dynamicVariables?: Array<{ name: string; value: string }>
): Assertion[] => {
  const assertions: Assertion[] = [];

  // Status code assertions
  assertions.push({
    id: `status-${response.status}`,
    category: 'status',
    type: 'status_equals',
    description: `Status code equals ${response.status}`,
    operator: 'equals',
    expectedValue: `${response.status}`,
    dataType: 'number',
    enabled: false,
  });

  // Data Presence assertions - Static Variables
  if (staticVariables && staticVariables.length > 0) {
    staticVariables.forEach((variable) => {
      assertions.push({
        id: `data-presence-static-${variable.name}`,
        category: 'data presence',
        type: 'variable_present',
        description: `Static variable '${variable.name}' is present`,
        field: variable.name,
        dataType: 'string',
        enabled: false,
      });
    });
  }

  // Data Presence assertions - Dynamic Variables
  if (dynamicVariables && dynamicVariables.length > 0) {
    dynamicVariables.forEach((variable) => {
      assertions.push({
        id: `data-presence-dynamic-${variable.name}`,
        category: 'data presence',
        type: 'variable_present',
        description: `Dynamic variable '${variable.name}' is present`,
        field: variable.name,
        dataType: 'string',
        enabled: false,
      });
    });
  }

  // Header assertions
  // Generate HeaderGuard™ security assertions
  Object.entries(SECURITY_HEADERS).forEach(([headerName, config]) => {
    const headerValue = response.headers[headerName.toLowerCase()];
    const isPresent = headerValue !== undefined;

    // Header presence assertion
    assertions.push({
      id: `headerguard-presence-${headerName}`,
      category: 'HeaderGuard™',
      type: 'header_security_present',
      description: `Security header '${headerName}' should be present`,
      field: headerName,
      priority: config.priority,
      impact: config.impact,
      group: config.group,
      dataType: 'string',
      enabled: false,
    });

    if (isPresent) {
      // Header value validation assertions
      assertions.push({
        id: `headerguard-value-${headerName}`,
        category: 'HeaderGuard™',
        type: 'header_security_value',
        description: `Security header '${headerName}' should have a valid value`,
        field: headerName,
        expectedValue: headerValue,
        priority: config.priority,
        impact: config.impact,
        group: config.group,
        dataType: 'string',
        enabled: false,
      });

      // Specific validations based on header type
      if (headerName === 'strict-transport-security') {
        assertions.push({
          id: `headerguard-hsts-max-age-${headerName}`,
          category: 'HeaderGuard™',
          type: 'header_hsts_max_age',
          description: 'HSTS max-age should be ≥31536000 seconds (1 year)',
          field: headerName,
          operator: 'min_max_age',
          expectedValue: '31536000',
          priority: 'Critical',
          impact: 'Ensures long-term HTTPS enforcement',
          group: 'security',
          dataType: 'number',
          enabled: false,
        });
      }
    }
  });

  // Standard header assertions (existing)
  Object.entries(response.headers).forEach(([key, value]) => {
    assertions.push({
      id: `header-present-${key}`,
      category: 'headers',
      type: 'header_present',
      description: `Header '${key}' is present`,
      field: key,
      dataType: 'string',
      enabled: false,
    });

    assertions.push({
      id: `header-equals-${key}`,
      category: 'headers',
      type: 'header_equals',
      description: `Header '${key}' equals '${value}'`,
      field: key,
      expectedValue: value,
      dataType: 'string',
      enabled: false,
    });
  });

  // Performance assertions - convert to strings
  assertions.push({
    id: 'response-time',
    category: 'performance',
    type: 'response_time',
    description: `Response time is less than ${Math.max(
      response.responseTime * 2,
      500
    )} ms`,
    expectedValue: String(Math.max(response.responseTime * 2, 500)),
    dataType: 'number',
    enabled: false,
  });

  assertions.push({
    id: 'payload-size',
    category: 'performance',
    type: 'payload_size',
    description: `Payload size is less than ${Math.max(
      response.size * 2,
      10000
    )} bytes`,
    expectedValue: String(Math.max(response.size * 2, 10000)),
    dataType: 'number',
    enabled: false,
  });

  // Body assertions (for JSON responses)
  if (response.data && typeof response.data === 'object') {
    const bodyAssertions = generateBodyAssertions(response.data);
    assertions.push(...bodyAssertions);
  }

  return assertions;
};

const generateBodyAssertions = (data: any, prefix = ''): Assertion[] => {
  const assertions: Assertion[] = [];

  const processValue = (value: any, path: string) => {
    const dataType = getDataType(value);

    // Field presence assertion
    assertions.push({
      id: `field-present-${path}`,
      category: 'body',
      type: 'field_present',
      description: `Field '${path}' is present`,
      field: path,
      dataType,
      enabled: false,
    });

    // Field type assertion
    const type = Array.isArray(value) ? 'array' : typeof value;
    assertions.push({
      id: `field-type-${path}`,
      category: 'body',
      type: 'field_type',
      description: `Field '${path}' is of type '${type}'`,
      field: path,
      expectedValue: type,
      dataType,
      enabled: false,
    });

    // Type-specific assertions
    if (Array.isArray(value)) {
      assertions.push({
        id: `array-not-empty-${path}`,
        category: 'body',
        type: 'array_length',
        description: `Array '${path}' is not empty`,
        field: path,
        operator: 'greater_than_zero',
        dataType: 'array',
        enabled: false,
      });

      assertions.push({
        id: `array-length-${path}`,
        category: 'body',
        type: 'array_length',
        description: `Array '${path}' has length ${value.length}`,
        field: path,
        operator: 'equals',
        expectedValue: String(value.length),
        dataType: 'array',
        enabled: false,
      });

      // Add array presence assertion
      assertions.push({
        id: `array-present-${path}`,
        category: 'body',
        type: 'field_present',
        description: `Array '${path}' is present`,
        field: path,
        dataType: 'array',
        enabled: false,
      });

      // Add array size greater than specific number
      if (value.length > 1) {
        assertions.push({
          id: `array-size-gt-${path}`,
          category: 'body',
          type: 'array_length',
          description: `Array '${path}' has more than 1 item`,
          field: path,
          operator: 'greater_than',
          expectedValue: '1',
          dataType: 'array',
          enabled: false,
        });
      }

      // Process array elements if they exist
      if (value.length > 0) {
        const firstItem = value[0];
        if (typeof firstItem === 'object' && firstItem !== null) {
          Object.keys(firstItem).forEach((key) => {
            processValue(firstItem[key], `${path}[0].${key}`);
          });
        }
      }
    } else if (typeof value === 'string') {
      // Check if string is a date
      const stringDataType = isDateString(value) ? 'date' : 'string';

      assertions.push({
        id: `field-not-empty-${path}`,
        category: 'body',
        type: 'field_not_empty',
        description: `String field '${path}' is not empty`,
        field: path,
        dataType: stringDataType,
        enabled: false,
      });

      assertions.push({
        id: `field-equals-${path}`,
        category: 'body',
        type: 'field_equals',
        description: `Field '${path}' equals '${value}'`,
        field: path,
        expectedValue: value,
        dataType: stringDataType,
        enabled: false,
      });

      // Add contains assertion for strings
      if (value.length > 3) {
        const substring = value.substring(0, Math.min(value.length - 1, 10));
        assertions.push({
          id: `field-contains-${path}`,
          category: 'body',
          type: 'field_contains',
          description: `Field '${path}' contains '${substring}'`,
          field: path,
          expectedValue: substring,
          dataType: stringDataType,
          enabled: false,
        });
      }

      // Email pattern assertion
      if (value.includes('@') && value.includes('.')) {
        assertions.push({
          id: `field-email-${path}`,
          category: 'body',
          type: 'field_pattern',
          description: `Field '${path}' matches email pattern`,
          field: path,
          operator: 'email_pattern',
          dataType: 'string',
          enabled: false,
        });
      }
    } else if (typeof value === 'number') {
      assertions.push({
        id: `field-equals-${path}`,
        category: 'body',
        type: 'field_equals',
        description: `Field '${path}' equals ${value}`,
        field: path,
        expectedValue: String(value),
        dataType: 'number',
        enabled: false,
      });

      if (value >= 0) {
        assertions.push({
          id: `field-positive-${path}`,
          category: 'body',
          type: 'field_range',
          description: `Field '${path}' is positive`,
          field: path,
          operator: 'greater_than_or_equal',
          expectedValue: '0',
          dataType: 'number',
          enabled: false,
        });
      }

      // Add greater than assertion
      if (value > 1) {
        assertions.push({
          id: `field-gt-${path}`,
          category: 'body',
          type: 'field_range',
          description: `Field '${path}' is greater than ${Math.max(
            0,
            value - 10
          )}`,
          field: path,
          operator: 'greater_than',
          expectedValue: String(Math.max(0, value - 10)),
          dataType: 'number',
          enabled: false,
        });
      }
    } else if (typeof value === 'boolean') {
      assertions.push({
        id: `field-equals-${path}`,
        category: 'body',
        type: 'field_equals',
        description: `Field '${path}' is ${value}`,
        field: path,
        expectedValue: String(value),
        dataType: 'boolean',
        enabled: false,
      });
    } else if (value === null) {
      assertions.push({
        id: `field-null-${path}`,
        category: 'body',
        type: 'field_null',
        description: `Field '${path}' is null`,
        field: path,
        dataType: 'null',
        enabled: false,
      });
    } else if (typeof value === 'object') {
      // Process nested object
      Object.keys(value).forEach((key) => {
        processValue(value[key], `${path}.${key}`);
      });
    }
  };

  // Process top-level fields
  Object.keys(data).forEach((key) => {
    const path = prefix ? `${prefix}.${key}` : key;
    processValue(data[key], path);
  });

  // Add specific array assertions for top-level arrays
  Object.keys(data).forEach((key) => {
    const value = data[key];
    const path = prefix ? `${prefix}.${key}` : key;

    if (Array.isArray(value)) {
      // Add array presence assertion
      assertions.push({
        id: `array-present-${path}`,
        category: 'body',
        type: 'array_present',
        description: `Array '${path}' is present`,
        field: path,
        dataType: 'array',
        enabled: false,
      });

      // Add array not empty assertion
      assertions.push({
        id: `array-not-empty-${path}`,
        category: 'body',
        type: 'array_length',
        description: `Array '${path}' is not empty`,
        field: path,
        operator: 'not_empty',
        dataType: 'array',
        enabled: false,
      });

      // Add array size greater than zero
      assertions.push({
        id: `array-size-gt-zero-${path}`,
        category: 'body',
        type: 'array_length',
        description: `Array '${path}' has more than 0 items`,
        field: path,
        operator: 'greater_than',
        expectedValue: '0',
        dataType: 'array',
        enabled: false,
      });

      // Add array exact length assertion
      assertions.push({
        id: `array-exact-length-${path}`,
        category: 'body',
        type: 'array_length',
        description: `Array '${path}' has exactly ${value.length} items`,
        field: path,
        operator: 'equals',
        expectedValue: String(value.length),
        dataType: 'array',
        enabled: false,
      });

      // Add array size greater than 1 if applicable
      if (value.length > 1) {
        assertions.push({
          id: `array-size-gt-one-${path}`,
          category: 'body',
          type: 'array_length',
          description: `Array '${path}' has more than 1 item`,
          field: path,
          operator: 'greater_than',
          expectedValue: '1',
          dataType: 'array',
          enabled: false,
        });
      }
    }
  });

  return assertions;
};
