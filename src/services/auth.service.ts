import {
  API_GET_USER,
  API_LOGIN,
  API_LOGOUT,
  API_PASSWORD_CHANGE,
  API_REGISTER,
  API_FORGOT_PASSWORD,
  API_RESET_PASSWORD,
  API_PROFILE,
} from '@/config/apiRoutes';
import { USER_COOKIE_NAME } from '@/lib/constants';
import { getEncryptedCookie } from '@/lib/cookieUtils';
import { apiRequest } from '@/lib/queryClient';
import { ILoginResponse, SingUpForm, User } from '@/shared/types/auth';

export const refreshUserData = async () => {
  try {
    const cookieData = getEncryptedCookie(USER_COOKIE_NAME);
    if (!cookieData?.token) {
      return null;
    }

    const res = await apiRequest('GET', API_GET_USER);
    if (!res.ok) {
      throw new Error(`${res.status}: ${res.statusText}`);
    }
    return res.json();
  } catch {
    return null;
  }
};

export const loginApi = async (credentials: {
  email: string;
  password: string;
}) => {
  const response = await apiRequest('POST', API_LOGIN, {
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData?.error || 'Login failed. Please try again.');
  }

  const data = await response.json();

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as ILoginResponse;
};

export const logoutApi = async () => {
  try {
    const response = await apiRequest('POST', API_LOGOUT, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Logout failed with status: ${response.status}`);
    }

    return response.json();
  } catch (error: unknown) {
    console.error('Error during logout:', error);
    throw error;
  }
};

export const registerApi = async (userData: SingUpForm) => {
  try {
    const response = await apiRequest('POST', API_REGISTER, {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    return response.json();
  } catch (error) {
    console.error('Registration error:', error);
    throw error instanceof Error
      ? error
      : new Error('An unexpected error occurred during registration');
  }
};

export const changePasswordApi = async (passwordData: {
  oldPassword: string;
  newPassword: string;
}) => {
  const response = await apiRequest('POST', API_PASSWORD_CHANGE, {
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(passwordData),
  });
  if (!response.ok) {
    throw new Error('Failed to change password');
  }
  return response.json();
};

export const forgotPasswordApi = async (email: string) => {
  const response = await apiRequest('POST', API_FORGOT_PASSWORD, {
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    throw new Error('Failed to send reset email');
  }
  return response.json();
};

export const resetPasswordApi = async (data: {
  token: string;
  newPassword: string;
}) => {
  const response = await fetch(API_RESET_PASSWORD, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.token}`,
    },
    body: JSON.stringify({
      newPassword: data.newPassword,
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to reset password');
  }

  return response.json();
};

export const updateProfileApi = async (
  profileData: Partial<User> & {
    bio?: string | null;
    company?: string | null;
    companyWebsite?: string | null;
    sector?: string | null;
    jobTitle?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
  }
): Promise<{ user: User; message?: string }> => {
  const response = await apiRequest('PUT', API_PROFILE, {
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    let msg = 'Failed to update profile';
    try {
      const err = await response.json();
      msg = err?.error || err?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return response.json();
};
