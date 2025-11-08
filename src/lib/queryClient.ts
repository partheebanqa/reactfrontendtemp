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

    // Create fetch options - don't modify the Content-Type header if it's multipart/form-data
    // The browser will automatically set the correct boundary
    const isMultipartFormData =
      options?.headers?.['content-type']?.includes('multipart/form-data') ||
      options?.headers?.['Content-Type']?.includes('multipart/form-data');

    let fetchOptions: RequestInit = {
      method,
      headers: {},
    };

    // Handle body based on content type
    if (options?.body) {
      // For multipart/form-data, don't stringify the body and let the browser handle it
      if (isMultipartFormData) {
        fetchOptions.body = options.body;

        // For multipart/form-data, don't set the Content-Type header manually
        // The browser will set it with the correct boundary
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

    // Only throw for non-auth related errors to prevent login issues
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
