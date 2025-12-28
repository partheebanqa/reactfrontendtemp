import { API_COLLECTION_REQUESTS } from '@/config/apiRoutes';
import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import { RequestData, ResponseData } from '@/shared/types/request';

export interface ApiError {
  type: 'network' | 'cors' | 'timeout' | 'server' | 'client' | 'unknown';
  message: string;
  description?: string;
  suggestions?: string[];
}

export interface RequestInput {
  method: string;
  url: string;
  params?: Array<{ key: string; value: string; enabled?: boolean }>;
  headers?: Array<{ key: string; value: string; enabled?: boolean }>;
  body?: any;
  bodyType?: string;
  authorizationType?: string;
  authorization?: {
    token?: string;
    username?: string;
    password?: string;
    key?: string;
    value?: string;
    addTo?: string;
  };
}

export const makeRequest = async (
  request: RequestInput
): Promise<ResponseData> => {
  const startTime = Date.now();

  try {
    let fullUrl = request.url;

    if (!/^https?:\/\//i.test(fullUrl)) {
      fullUrl = 'http://' + fullUrl;
    }

    const url = new URL(fullUrl);

    request.params?.forEach((param: any) => {
      if (param.enabled !== false && param.key) {
        url.searchParams.append(param.key, param.value || '');
      }
    });

    const headers: Record<string, string> = {
      Accept: '*/*',
    };

    if (
      !request.headers?.some(
        (h: any) =>
          h.key.toLowerCase() === 'content-type' && h.enabled !== false
      )
    ) {
      headers['Content-Type'] = 'application/json';
    }

    request.headers?.forEach((header: any) => {
      if (header.enabled !== false && header.key) {
        headers[header.key] = header.value || '';
      }
    });

    if (
      request.authorizationType === 'bearer' &&
      request.authorization?.token
    ) {
      headers['Authorization'] = `Bearer ${request.authorization.token}`;
    } else if (
      request.authorizationType === 'basic' &&
      request.authorization?.username
    ) {
      const auth = btoa(
        `${request.authorization.username}:${
          request.authorization.password || ''
        }`
      );
      headers['Authorization'] = `Basic ${auth}`;
    } else if (
      request.authorizationType === 'apiKey' &&
      request.authorization?.key
    ) {
      if (request.authorization.addTo === 'header') {
        headers[request.authorization.key] = request.authorization.value || '';
      } else if (request.authorization.addTo === 'query') {
        url.searchParams.append(
          request.authorization.key,
          request.authorization.value || ''
        );
      }
    }

    const config: AxiosRequestConfig = {
      method: request.method.toLowerCase(),
      url: url.toString(),
      headers,
      timeout: 30000, // 30 second timeout
      withCredentials: false, // Disable credentials for CORS
      validateStatus: (status) => status < 600, // Accept all status codes < 600
      maxRedirects: 5, // Allow up to 5 redirects
    };

    // Add body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(request.method.toUpperCase())) {
      // Handle different body types
      const bodyType = request.bodyType?.toLowerCase() || 'none';

      if (bodyType === 'none') {
        // No body
      } else if (bodyType === 'json') {
        try {
          // If it's already a string, try to parse it to validate JSON
          if (typeof request.body === 'string') {
            // Only parse if it's not empty
            if (request.body.trim()) {
              try {
                config.data = JSON.parse(request.body);
              } catch (e) {
                // If parsing fails, use as-is
                config.data = request.body;
              }
            }
          } else {
            // If it's already an object, use it directly
            config.data = request.body;
          }

          headers['Content-Type'] = 'application/json';
        } catch (e) {
          console.error('Error processing JSON body:', e);
          config.data = request.body || {};
          headers['Content-Type'] = 'application/json';
        }
      } else if (bodyType === 'form-data') {
        const formData = new FormData();
        if (request.body instanceof FormData) {
          config.data = request.body;
        } else if (typeof request.body === 'string') {
          config.data = request.body;
        } else if (typeof request.body === 'object') {
          Object.entries(request.body || {}).forEach(([key, value]) => {
            formData.append(key, value as string);
          });
          config.data = formData;
        }
        delete headers['Content-Type'];
      } else if (bodyType === 'x-www-form-urlencoded') {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';

        // Convert the body to URLSearchParams
        if (typeof request.body === 'object' && request.body !== null) {
          const params = new URLSearchParams();
          Object.entries(request.body).forEach(([key, value]) => {
            params.append(key, value as string);
          });
          config.data = params;
        } else {
          config.data = request.body;
        }
      } else if (bodyType === 'raw') {
        // Send raw content
        config.data = request.body;
        headers['Content-Type'] = 'text/plain';
      } else if (bodyType === 'binary') {
        // Binary data
        config.data = request.body;
        // Let the browser set the appropriate Content-Type
        delete headers['Content-Type'];
      }
    }

    const response = await axios(config);
    const endTime = Date.now();

    const diff = endTime - startTime;
    const formattedTime =
      diff < 1000 ? `${diff} ms` : `${(diff / 1000).toFixed(2)} s`;

    return {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      responseTime: formattedTime,
      size: calculateResponseSize(response.data),
    };
  } catch (error: any) {
    console.error('Request error:', error);
    const endTime = Date.now();
    const apiError = parseError(error);
    const diff = endTime - startTime;
    const formattedTime =
      diff < 1000 ? `${diff} ms` : `${(diff / 1000).toFixed(2)} s`;

    // Format the error response
    return {
      status: error.response?.status || 0,
      statusText: error.response?.statusText || apiError.type.toUpperCase(),
      headers: error.response?.headers || {},
      data: {
        error: {
          type: apiError.type,
          message: apiError.message,
          description: apiError.description,
          suggestions: apiError.suggestions,
          originalError: error.message,
        },
      },
      responseTime: formattedTime,
      size: calculateResponseSize(error.response?.data || apiError),
    };
  }
};

const parseError = (error: AxiosError): ApiError => {
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return {
        type: 'timeout',
        message: 'Request Timeout',
        description: 'The request took too long to complete and was cancelled.',
        suggestions: [
          'Check if the server is responding',
          'Try increasing the timeout value',
          'Verify the URL is correct',
        ],
      };
    }

    if (
      error.message.includes('Network Error') ||
      error.code === 'ERR_NETWORK'
    ) {
      return {
        type: 'network',
        message: 'Network Error',
        description:
          'Unable to connect to the server. This could be a network connectivity issue.',
        suggestions: [
          'Check your internet connection',
          'Verify the server URL is correct',
          'Check if the server is running',
        ],
      };
    }

    // CORS error detection
    if (
      error.message.includes('CORS') ||
      error.message.includes('Access-Control-Allow-Origin') ||
      (error.code === 'ERR_FAILED' && !error.response)
    ) {
      return {
        type: 'cors',
        message: 'CORS Error',
        description:
          'Cross-Origin Resource Sharing (CORS) policy is blocking this request.',
        suggestions: [
          'Use a CORS browser extension (for development only)',
          'Configure the server to allow CORS',
          'Use a proxy server to bypass CORS',
          'Run the request from the same domain as the API',
        ],
      };
    }

    return {
      type: 'unknown',
      message: 'Unknown Network Error',
      description: error.message || 'An unexpected network error occurred.',
      suggestions: [
        'Check your network connection',
        'Try the request again',
        'Contact your system administrator',
      ],
    };
  }

  // Server responded with an error status
  const status = error.response.status;

  if (status >= 400 && status < 500) {
    return {
      type: 'client',
      message: `Client Error (${status})`,
      description: `The request was invalid or unauthorized. ${error.response.statusText}`,
      suggestions: [
        'Check the request URL and parameters',
        'Verify authentication credentials',
        'Review the request headers and body',
      ],
    };
  }

  if (status >= 500) {
    return {
      type: 'server',
      message: `Server Error (${status})`,
      description: `The server encountered an error processing the request. ${error.response.statusText}`,
      suggestions: [
        'Try the request again later',
        'Contact the API provider',
        'Check the server status',
      ],
    };
  }

  return {
    type: 'unknown',
    message: 'Unknown Error',
    description: error.message || 'An unexpected error occurred.',
    suggestions: ['Try the request again'],
  };
};

const calculateResponseSize = (data: any): number => {
  try {
    return new Blob([JSON.stringify(data)]).size;
  } catch {
    return new Blob([String(data)]).size;
  }
};
