import { validateCSPCompliance } from '@/security/cspConfig';
import { QueryClient, QueryFunction } from '@tanstack/react-query';
import { getEncryptedCookie, removeCookie } from './cookieUtils';
import { USER_COOKIE_NAME } from './constants';
import { API_LOGIN } from '@/config/apiRoutes';
// import { i } from 'node_modules/vite/dist/node/types.d-aGj9QkWt';
import { authActions, authStore } from '@/store/authStore';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const response = await res.json();
    throw new Error(response.error || response.message || 'Request failed');
  }
}

interface IRequestOptions {
  body?: any;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
}

export async function apiRequest(
  method: string,
  url: string,
  options?: IRequestOptions
): Promise<Response> {
  try {
    // if (!validateCSPCompliance(url)) {
    //   throw new Error(
    //     `URL ${url} does not comply with Content Security Policy directives`
    //   );
    // }

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

    const headers: Record<string, string> = {
      ...(options?.headers || {}),
    };

    if (!isMultipartFormData && options?.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const body =
      options?.body && !isMultipartFormData && typeof options.body !== 'string'
        ? JSON.stringify(options.body)
        : options?.body;

    const fetchOptions: RequestInit = {
      method,
      headers,
      body,
      credentials: 'include',
    };

    const res = await fetch(url, fetchOptions);

    if (res.status === 401) {
      removeCookie(USER_COOKIE_NAME);
      authActions.clearAuth();
    }

    if (url !== API_LOGIN && !res.ok) {
      await throwIfResNotOk(res);
    }

    return res;
  } catch (error) {
    throw error;
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

      // if (!validateCSPCompliance(url)) {
      //   throw new Error(
      //     `URL ${url} does not comply with Content Security Policy directives`
      //   );
      // }

      const res = await apiRequest('GET', url);

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
      return null;
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
