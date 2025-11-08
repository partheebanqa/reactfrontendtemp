import { KeyValuePair } from '@/shared/types/collection';

export function createUrlWithParams(
  url: string,
  params: Record<string, string>
): string {
  if (!url) return '';
  if (!params || Object.keys(params).length === 0) return url;

  try {
    const urlObj = new URL(url.startsWith('http') ? url : `http://${url}`);

    Object.entries(params).forEach(([key, value]) => {
      if (key && value) {
        urlObj.searchParams.append(key, value);
      }
    });

    return urlObj.toString();
  } catch (error) {
    console.error('Error creating URL with params:', error);
    return url;
  }
}

export function prepareRequestBody(options: {
  method: string;
  body: string;
  isGraphQL?: boolean;
  graphQLQuery?: string;
  graphQLVariables?: string;
}): string | undefined {
  const { method, body, isGraphQL, graphQLQuery, graphQLVariables } = options;

  if (method === 'GET') return undefined;

  if (isGraphQL) {
    try {
      return JSON.stringify({
        query: graphQLQuery || '',
        variables: graphQLVariables ? JSON.parse(graphQLVariables) : {},
      });
    } catch (error) {
      console.error('Error preparing GraphQL body:', error);
      return JSON.stringify({ query: graphQLQuery || '' });
    }
  }

  return body || undefined;
}

/**
 * Prepares the fetch request options
 * @param method HTTP method
 * @param headers Request headers
 * @param body Request body
 * @param isGraphQL Whether the request is GraphQL
 * @returns Fetch request options
 */
export function prepareRequestOptions(
  method: string,
  headers: Record<string, string>,
  body?: string,
  isGraphQL?: boolean
): RequestInit {
  const options: RequestInit = {
    method,
    headers: {
      ...headers,
    },
  };

  if (body && method !== 'GET') {
    options.body = body;

    // Set content type for JSON if not already set
    if (!headers['Content-Type'] && !isGraphQL) {
      (options.headers as Record<string, string>)['Content-Type'] =
        'application/json';
    }

    // Set content type for GraphQL if needed
    if (isGraphQL && !headers['Content-Type']) {
      (options.headers as Record<string, string>)['Content-Type'] =
        'application/json';
    }
  }

  return options;
}

/**
 * Performs a fetch with a timeout
 * @param url Request URL
 * @param options Fetch options
 * @param timeout Timeout in milliseconds (default: 30000)
 * @returns Promise with the fetch response
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new RequestError('Request timeout', 408);
    }
    throw error;
  }
}

/**
 * Custom error class for request errors
 */
export class RequestError extends Error {
  status?: number;
  statusText?: string;
  response?: Response;

  constructor(message: string, status?: number, response?: Response) {
    super(message);
    this.name = 'RequestError';
    this.status = status;
    this.response = response;
    this.statusText = response?.statusText;
  }
}
