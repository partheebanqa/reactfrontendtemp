import type { APIRequest } from '@/shared/types/requestChain.model';

export interface AnalyzedRequest {
  index: number;
  name: string;
  method: string;
  url: string;
  authToken?: string;
  authSource?: {
    apiIndex: number;
    apiName: string;
    path: string;
  };
  suggestedAuthSource?: {
    apiIndex: number;
    apiName: string;
    path: string;
    reason: string;
  };
  queryParams: Array<{
    name: string;
    value: string;
    source?: {
      apiIndex: number;
      apiName: string;
      path: string;
    };
  }>;
  hasAuthWarning: boolean;
  // NEW: flag specifically for 401 + no auth configured
  has401WithNoAuth?: boolean;
}

function extractAuthToken(request: APIRequest): string | undefined {
  if (request.authorization?.token) {
    return request.authorization.token.trim();
  }

  if (request.authToken) {
    return request.authToken.trim();
  }

  if (request.headers) {
    const authHeader = request.headers.find(
      (h) => h.key.toLowerCase() === 'authorization',
    );
    if (authHeader) {
      const match = authHeader.value.match(/Bearer\s+(.+)/i);
      return match?.[1]?.trim();
    }
  }

  return undefined;
}

function extractQueryParams(
  request: APIRequest,
): Array<{ name: string; value: string }> {
  const params: Array<{ name: string; value: string }> = [];

  if (request.params) {
    request.params.forEach((param) => {
      if (param.key && param.value && param.enabled !== false) {
        params.push({ name: param.key, value: param.value });
      }
    });
  }

  if (request.url && request.url.includes('?')) {
    try {
      const url = new URL(
        request.url.startsWith('http')
          ? request.url
          : `https://example.com${request.url}`,
      );
      url.searchParams.forEach((value, key) => {
        if (!params.some((p) => p.name === key)) {
          params.push({ name: key, value });
        }
      });
    } catch (e) {
      console.error(e);
    }
  }

  return params;
}

function searchInResponse(
  responseBody: string,
  searchValue: string,
): string | null {
  try {
    const parsed = JSON.parse(responseBody);

    const findPath = (
      obj: any,
      target: string,
      currentPath: string = '',
    ): string | null => {
      if (typeof obj !== 'object' || obj === null) {
        if (String(obj) === target) {
          return currentPath;
        }
        return null;
      }

      for (const key in obj) {
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        const result = findPath(obj[key], target, newPath);
        if (result) return result;
      }

      return null;
    };

    return findPath(parsed, searchValue);
  } catch {
    return null;
  }
}

function isAuthEndpoint(name: string, url: string): boolean {
  const lowerName = name.toLowerCase();
  const lowerUrl = url.toLowerCase();
  return (
    lowerName.includes('login') ||
    lowerName.includes('auth') ||
    lowerName.includes('signin') ||
    lowerName.includes('token') ||
    lowerUrl.includes('/login') ||
    lowerUrl.includes('/signin') ||
    lowerUrl.includes('/token')
  );
}

function getHostname(url: string): string | null {
  try {
    return new URL(url.startsWith('http') ? url : `https://example.com${url}`)
      .hostname;
  } catch {
    return null;
  }
}

function looksLikeJWT(value: any): boolean {
  if (typeof value !== 'string') return false;
  const parts = value.split('.');
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

function looksLikeToken(value: any): boolean {
  return typeof value === 'string' && value.length > 20;
}

/**
 * Searches a parsed response body for the first token-like value.
 * Returns the dot-notation path, or null if not found.
 */
function findTokenPathInResponse(parsed: any): string | null {
  const commonPaths = [
    'token',
    'accessToken',
    'access_token',
    'authToken',
    'auth_token',
    'data.token',
    'data.accessToken',
    'data.access_token',
    'result.token',
    'result.accessToken',
  ];

  const getNestedValue = (obj: any, path: string): any =>
    path.split('.').reduce((current, key) => current?.[key], obj);

  for (const path of commonPaths) {
    const value = getNestedValue(parsed, path);
    if (value && (looksLikeJWT(value) || looksLikeToken(value))) {
      return path;
    }
  }

  // Deep search for JWT/token-shaped values
  const findDeep = (obj: any, currentPath: string = ''): string | null => {
    if (looksLikeJWT(obj) || looksLikeToken(obj)) {
      return currentPath;
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        const result = findDeep(obj[key], newPath);
        if (result) return result;
      }
    }
    return null;
  };

  return findDeep(parsed);
}

export function analyzeRequestChain(
  requests: APIRequest[],
  executionLogs: Record<string, any>,
): AnalyzedRequest[] {
  const analyzed: AnalyzedRequest[] = [];

  const valueToFirstSource = new Map<
    string,
    { apiIndex: number; apiName: string; path: string }
  >();

  for (let i = 0; i < requests.length; i++) {
    const request = requests[i];
    const log = executionLogs[request.id];

    if (log?.response?.body) {
      try {
        const parsed = JSON.parse(log.response.body);

        const recordValues = (obj: any, currentPath: string = '') => {
          if (typeof obj !== 'object' || obj === null) {
            const valueStr = String(obj);
            if (valueStr.trim() && !valueToFirstSource.has(valueStr)) {
              valueToFirstSource.set(valueStr, {
                apiIndex: i,
                apiName: request.name,
                path: currentPath,
              });
            }
            return;
          }

          for (const key in obj) {
            const newPath = currentPath ? `${currentPath}.${key}` : key;
            recordValues(obj[key], newPath);
          }
        };

        recordValues(parsed);
      } catch (e) {
        console.error(e);
      }
    }
  }

  for (let i = 0; i < requests.length; i++) {
    const request = requests[i];
    const authToken = extractAuthToken(request);
    const queryParams = extractQueryParams(request);

    const pathSegments: Array<{ segment: string; position: number }> = [];
    try {
      const urlPath = request.url.includes('?')
        ? request.url.split('?')[0]
        : request.url;

      const pathOnly = urlPath.replace(/^https?:\/\/[^\/]+/, '');

      const segments = pathOnly.split('/').filter((s) => s.trim() !== '');

      segments.forEach((segment, index) => {
        if (!segment.startsWith('{{') && segment.length > 0) {
          pathSegments.push({ segment, position: index });
        }
      });
    } catch (e) {
      console.error(e);
    }

    let authSource: AnalyzedRequest['authSource'] | undefined;
    let suggestedAuthSource: AnalyzedRequest['suggestedAuthSource'] | undefined;
    let hasAuthWarning = false;
    let has401WithNoAuth = false;

    const requestLog = executionLogs[request.id];
    const got401 = requestLog?.response?.status === 401;
    const hasNoAuth = !authToken || authToken.trim() === '';

    // ── NEW: 401 with no auth configured ──────────────────────────────────────
    if (got401 && hasNoAuth) {
      hasAuthWarning = true;
      has401WithNoAuth = true;

      const currentHostname = getHostname(request.url);

      for (let j = 0; j < i; j++) {
        const prevRequest = requests[j];
        const prevLog = executionLogs[prevRequest.id];

        let tokenPath: string | null = null;

        if (prevLog?.response?.body) {
          try {
            const parsed = JSON.parse(prevLog.response.body);
            tokenPath = findTokenPathInResponse(parsed);
          } catch (e) {
            console.error(
              'Failed to parse response for 401 token detection:',
              e,
            );
          }
        }

        const prevHostname = getHostname(prevRequest.url);
        const sameDomain =
          currentHostname && prevHostname && currentHostname === prevHostname;

        const isCandidate =
          tokenPath ||
          isAuthEndpoint(prevRequest.name, prevRequest.url) ||
          sameDomain;

        if (isCandidate) {
          const reasonParts: string[] = [
            'This request returned 401 Unauthorized.',
          ];
          if (tokenPath) {
            reasonParts.push(
              `Found potential auth token at path "${tokenPath}" in "${prevRequest.name}".`,
            );
          } else if (sameDomain) {
            reasonParts.push(
              `"${prevRequest.name}" shares the same domain and may contain auth data.`,
            );
          } else {
            reasonParts.push(
              `"${prevRequest.name}" appears to be an authentication endpoint.`,
            );
          }

          suggestedAuthSource = {
            apiIndex: j,
            apiName: prevRequest.name,
            path: tokenPath || 'data.token',
            reason: reasonParts.join(' '),
          };
          break;
        }
      }
    }
    // ── END NEW ───────────────────────────────────────────────────────────────

    // Existing logic: auth token is present but hardcoded (not a variable)
    if (authToken && !authToken.startsWith('{{')) {
      const firstOccurrence = valueToFirstSource.get(authToken);

      if (firstOccurrence && firstOccurrence.apiIndex < i) {
        authSource = firstOccurrence;
      } else if (!firstOccurrence) {
        hasAuthWarning = true;

        for (let j = 0; j < i; j++) {
          const prevRequest = requests[j];
          const prevLog = executionLogs[prevRequest.id];

          if (isAuthEndpoint(prevRequest.name, prevRequest.url)) {
            let tokenPath: string | null = null;

            if (prevLog?.response?.body) {
              try {
                const parsed = JSON.parse(prevLog.response.body);
                tokenPath = findTokenPathInResponse(parsed);
              } catch (e) {
                console.error(
                  'Failed to parse response for token detection:',
                  e,
                );
              }
            }

            suggestedAuthSource = {
              apiIndex: j,
              apiName: prevRequest.name,
              path: tokenPath || 'data.token',
              reason: tokenPath
                ? `Found potential auth token at path: ${tokenPath}`
                : 'This appears to be an authentication endpoint. Consider extracting the auth token from its response.',
            };
            break;
          }
        }
      }
    }

    const analyzedParams = queryParams.map((param) => {
      let source: AnalyzedRequest['queryParams'][0]['source'] | undefined;

      if (param.value.startsWith('{{')) {
        return { ...param, source };
      }

      const firstOccurrence = valueToFirstSource.get(param.value);

      if (firstOccurrence && firstOccurrence.apiIndex < i) {
        source = firstOccurrence;
      }

      return { ...param, source };
    });

    const analyzedPathSegments = pathSegments
      .map((pathSeg) => {
        let source: AnalyzedRequest['queryParams'][0]['source'] | undefined;

        const firstOccurrence = valueToFirstSource.get(pathSeg.segment);

        if (firstOccurrence && firstOccurrence.apiIndex < i) {
          source = firstOccurrence;
          return {
            name: `path segment [${pathSeg.position}]`,
            value: pathSeg.segment,
            source,
          };
        }

        return null;
      })
      .filter(Boolean) as Array<{
      name: string;
      value: string;
      source: AnalyzedRequest['queryParams'][0]['source'];
    }>;

    const allParams = [...analyzedParams, ...analyzedPathSegments];

    analyzed.push({
      index: i,
      name: request.name,
      method: request.method,
      url: request.url,
      authToken,
      authSource,
      suggestedAuthSource,
      queryParams: allParams,
      hasAuthWarning,
      has401WithNoAuth,
    });
  }

  return analyzed;
}
