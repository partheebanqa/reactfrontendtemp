import type { Assertion } from '@/shared/types/assertion';

const SECURITY_HEADERS: Record<string, any> = {
  'strict-transport-security': {
    group: 'security',
    priority: 'Critical',
    impact: 'Prevents man-in-the-middle attacks and protocol downgrade attacks',
    description: 'HSTS header enforces HTTPS connections',
  },
  'content-security-policy': {
    group: 'security',
    priority: 'Critical',
    impact: 'Prevents XSS, clickjacking, and code injection attacks',
    description: 'CSP header prevents malicious script execution',
  },
  'x-frame-options': {
    group: 'security',
    priority: 'High',
    impact: 'Prevents clickjacking attacks by controlling iframe embedding',
    description: 'X-Frame-Options prevents clickjacking attacks',
  },
  'x-content-type-options': {
    group: 'security',
    priority: 'High',
    impact: 'Prevents MIME type sniffing vulnerabilities',
    description: 'X-Content-Type-Options prevents MIME sniffing',
  },
  'referrer-policy': {
    group: 'security',
    priority: 'Medium',
    impact: 'Controls referrer information leakage to external sites',
    description: 'Referrer-Policy controls referrer information disclosure',
  },
  'permissions-policy': {
    group: 'security',
    priority: 'Medium',
    impact:
      'Controls browser feature access and prevents unauthorized API usage',
    description: 'Permissions-Policy controls browser feature access',
  },
  'x-xss-protection': {
    group: 'security',
    priority: 'High',
    impact: 'Enables XSS filtering in older browsers',
    description: 'X-XSS-Protection enables browser XSS filtering',
  },
  'cache-control': {
    group: 'performance',
    priority: 'High',
    impact: 'Optimizes caching strategy and reduces server load',
    description: 'Cache-Control optimizes resource caching',
  },
  etag: {
    group: 'performance',
    priority: 'Medium',
    impact: 'Enables efficient cache validation and reduces bandwidth',
    description: 'ETag enables efficient cache validation',
  },
};

export const getHeaderSuggestions = (
  headerName: string,
  headerValue: string
): Assertion[] => {
  const suggestions: Assertion[] = [];
  const normalizedHeaderName = headerName.toLowerCase();
  const config = SECURITY_HEADERS[normalizedHeaderName];

  if (config) {
    // Header presence assertion
    suggestions.push({
      id: `headerguard-presence-${normalizedHeaderName}`,
      category: 'HeaderGuard',
      type: 'header_present',
      description: `Security header '${headerName}' should be present`,
      field: normalizedHeaderName,
      priority: config.priority,
      impact: config.impact,
      group: config.group,
      enabled: false,
    });

    // Header value assertion
    suggestions.push({
      id: `headerguard-value-${normalizedHeaderName}`,
      category: 'HeaderGuard',
      type: 'header_equals',
      description: `Header '${headerName}' equals '${headerValue}'`,
      field: normalizedHeaderName,
      expectedValue: headerValue,
      priority: config.priority,
      impact: config.impact,
      group: config.group,
      enabled: false,
    });

    // Header contains assertion
    if (headerValue.length > 5) {
      const substring = headerValue.substring(
        0,
        Math.min(20, headerValue.length)
      );
      suggestions.push({
        id: `headerguard-contains-${normalizedHeaderName}`,
        category: 'HeaderGuard',
        type: 'header_contains',
        description: `Header '${headerName}' contains '${substring}'`,
        field: normalizedHeaderName,
        expectedValue: substring,
        priority: config.priority,
        impact: config.impact,
        group: config.group,
        enabled: false,
      });
    }
  } else {
    // Generic header assertions for unknown headers
    suggestions.push({
      id: `header-present-${normalizedHeaderName}`,
      category: 'headers',
      type: 'header_present',
      description: `Header '${headerName}' is present`,
      field: normalizedHeaderName,
      enabled: false,
    });

    suggestions.push({
      id: `header-equals-${normalizedHeaderName}`,
      category: 'headers',
      type: 'header_equals',
      description: `Header '${headerName}' equals '${headerValue}'`,
      field: normalizedHeaderName,
      expectedValue: headerValue,
      enabled: false,
    });
  }

  return suggestions;
};
