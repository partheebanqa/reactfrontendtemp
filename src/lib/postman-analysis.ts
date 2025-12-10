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
      (h) => h.key.toLowerCase() === 'authorization'
    );
    if (authHeader) {
      const match = authHeader.value.match(/Bearer\s+(.+)/i);
      return match?.[1]?.trim();
    }
  }

  return undefined;
}

function extractQueryParams(
  request: APIRequest
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
          : `https://example.com${request.url}`
      );
      url.searchParams.forEach((value, key) => {
        if (!params.some((p) => p.name === key)) {
          params.push({ name: key, value });
        }
      });
    } catch (e) {
      // Invalid URL, skip
    }
  }

  return params;
}

function searchInResponse(
  responseBody: string,
  searchValue: string
): string | null {
  try {
    const parsed = JSON.parse(responseBody);

    const findPath = (
      obj: any,
      target: string,
      currentPath: string = ''
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
    lowerUrl.includes('/auth') ||
    lowerUrl.includes('/signin') ||
    lowerUrl.includes('/token')
  );
}

export function analyzeRequestChain(
  requests: APIRequest[],
  executionLogs: Record<string, any>
): AnalyzedRequest[] {
  const analyzed: AnalyzedRequest[] = [];

  for (let i = 0; i < requests.length; i++) {
    const request = requests[i];
    const authToken = extractAuthToken(request);
    const queryParams = extractQueryParams(request);

    let authSource: AnalyzedRequest['authSource'] | undefined;
    let suggestedAuthSource: AnalyzedRequest['suggestedAuthSource'] | undefined;
    let hasAuthWarning = false;

    if (authToken && !authToken.startsWith('{{')) {
      for (let j = i - 1; j >= 0; j--) {
        const prevRequest = requests[j];
        const prevLog = executionLogs[prevRequest.id];

        if (prevLog?.response?.body) {
          const path = searchInResponse(prevLog.response.body, authToken);
          if (path) {
            authSource = {
              apiIndex: j,
              apiName: prevRequest.name,
              path,
            };
            break;
          }
        }
      }

      if (!authSource) {
        hasAuthWarning = true;

        for (let j = i - 1; j >= 0; j--) {
          const prevRequest = requests[j];
          const prevLog = executionLogs[prevRequest.id];

          if (isAuthEndpoint(prevRequest.name, prevRequest.url)) {
            let tokenPath: string | null = null;

            if (prevLog?.response?.body) {
              try {
                const parsed = JSON.parse(prevLog.response.body);

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

                const getNestedValue = (obj: any, path: string): any => {
                  return path
                    .split('.')
                    .reduce((current, key) => current?.[key], obj);
                };

                const looksLikeJWT = (value: any): boolean => {
                  if (typeof value !== 'string') return false;
                  const parts = value.split('.');
                  return (
                    parts.length === 3 && parts.every((part) => part.length > 0)
                  );
                };

                for (const path of commonPaths) {
                  const value = getNestedValue(parsed, path);
                  if (
                    value &&
                    (looksLikeJWT(value) ||
                      (typeof value === 'string' && value.length > 20))
                  ) {
                    tokenPath = path;
                    break;
                  }
                }

                if (!tokenPath) {
                  const findJWTPath = (
                    obj: any,
                    currentPath: string = ''
                  ): string | null => {
                    if (looksLikeJWT(obj)) {
                      return currentPath;
                    }

                    if (typeof obj === 'object' && obj !== null) {
                      for (const key in obj) {
                        const newPath = currentPath
                          ? `${currentPath}.${key}`
                          : key;
                        const result = findJWTPath(obj[key], newPath);
                        if (result) return result;
                      }
                    }

                    return null;
                  };

                  tokenPath = findJWTPath(parsed);
                }
              } catch (e) {
                console.error(
                  'Failed to parse response for token detection:',
                  e
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

      for (let j = i - 1; j >= 0; j--) {
        const prevRequest = requests[j];
        const prevLog = executionLogs[prevRequest.id];

        if (prevLog?.response?.body) {
          const path = searchInResponse(prevLog.response.body, param.value);
          if (path) {
            source = {
              apiIndex: j,
              apiName: prevRequest.name,
              path,
            };
            break;
          }
        }
      }

      return { ...param, source };
    });

    analyzed.push({
      index: i,
      name: request.name,
      method: request.method,
      url: request.url,
      authToken,
      authSource,
      suggestedAuthSource,
      queryParams: analyzedParams,
      hasAuthWarning,
    });
  }

  return analyzed;
}
