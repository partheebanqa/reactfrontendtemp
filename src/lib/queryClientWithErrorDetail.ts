import { validateCSPCompliance } from '@/security/cspConfig';
import { QueryClient, QueryFunction } from '@tanstack/react-query';
import { getEncryptedCookie, removeCookie } from './cookieUtils';
import { USER_COOKIE_NAME } from './constants';
import { API_LOGIN } from '@/config/apiRoutes';
import { authActions } from '@/store/authStore';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let response: any = {};
    try {
      response = await res.json();
    } catch {}

    const errorMsg = response.error || response.message || 'Request failed';
    const errorDetails = response.errorDetails || '';

    const fullMessage =
      errorDetails && errorDetails !== errorMsg
        ? `${errorMsg}: ${errorDetails}`
        : errorMsg;
    const error = new Error(fullMessage);
    (error as any).error = errorMsg;
    (error as any).errorDetails = errorDetails;

    throw error;
  }
}

interface IRequestOptions {
  body?: any;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
}

export async function apiRequestWithErrorDetails(
  method: string,
  url: string,
  options?: IRequestOptions
): Promise<Response> {
  try {
    const cachedUserData = getEncryptedCookie(USER_COOKIE_NAME);

    if (cachedUserData && cachedUserData.token) {
      options = {
        ...options,
        headers: {
          ...options?.headers,
          Authorization: `Bearer ${cachedUserData.token}`,
        },
      };
    }

    const isMultipartFormData =
      options?.headers?.['content-type']?.includes('multipart/form-data') ||
      options?.headers?.['Content-Type']?.includes('multipart/form-data');

    let fetchOptions: RequestInit = {
      method,
      headers: {},
    };

    if (options?.body) {
      if (isMultipartFormData) {
        fetchOptions.body = options.body;

        const headers = { ...options?.headers };
        if (headers['content-type']?.includes('multipart/form-data')) {
          delete headers['content-type'];
        }
        if (headers['Content-Type']?.includes('multipart/form-data')) {
          delete headers['Content-Type'];
        }
        fetchOptions.headers = headers;
      } else {
        fetchOptions.body = options.body;
        fetchOptions.headers = { ...options?.headers };
      }
    } else {
      fetchOptions.headers = { ...options?.headers };
    }

    const res = await fetch(url, fetchOptions);

    if (res.status === 401) {
      removeCookie(USER_COOKIE_NAME);
      authActions.clearAuth();
    }

    if (url !== API_LOGIN && !res.ok) {
      await throwIfResNotOk(res);
    }

    return res;
  } catch (errorDetails) {
    console.error('Caught error:', errorDetails);
    throw errorDetails;
  }
}

type UnauthorizedBehavior = 'returnNull' | 'throw';
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const url = queryKey[0] as string;

      const res = await apiRequestWithErrorDetails('GET', url);

      if (res.status === 401) {
        removeCookie(USER_COOKIE_NAME);
        authActions.clearAuth();
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error('Query Function Error:', error);
      if (unauthorizedBehavior === 'throw') {
        throw error;
      }
      return null; // Return null for 401 errors if configured to do so
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: 'throw' }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
