import { showSnackbar } from "./snackbarService";

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: HTTPMethod;
  body?: any;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
}

export const apiClient = async (
  endpoint: string,
  options: RequestOptions = {}
): Promise<any> => {
  let token = "";
  const userDetails = localStorage.getItem('userDetails');
  if (userDetails) {
    try {
      const details = JSON.parse(userDetails);
      token = details.token;
    } catch {
      // silently fail if malformed
    }
  }

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (options.requiresAuth && token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(endpoint, {
      method: options.method || 'GET',
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      body:
        options.body && options.method !== 'GET'
          ? options.body
          : undefined,
    });

    const data = response.status !== 204 ? await response.json() : null;

    if (!response.ok) {
      const errorMsg = data?.error || data?.message || 'Something went wrong';
      showSnackbar(errorMsg, 'error');
      throw new Error(errorMsg);
    }
    return data;
  } catch (error: any) {
    console.log(error);
    showSnackbar(error.message || 'Something went wrong', 'error');
    throw error;
  }
};
