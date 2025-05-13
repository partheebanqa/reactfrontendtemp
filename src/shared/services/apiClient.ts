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

  // Only attach token if required and exists
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
      body: options.body ? options.body : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      showSnackbar('Something went wrong', 'error');
      throw new Error(data.message || 'API request failed');
    }
    return data;
  } catch (error: any) {
    showSnackbar('something went wrong', 'error');
    throw error;
  }
};



// import { apiClient } from './apiClient';

// export const UserService = {
//   getProfile: () => apiClient('https://api.example.com/user/profile', {
//     method: 'GET',
//     requiresAuth: true,
//   }),

//   updateProfile: (data: any) => apiClient('https://api.example.com/user/profile', {
//     method: 'PUT',
//     body: data,
//     requiresAuth: true,
//   }),
// };