import { queryClient } from './queryClient'; // or wherever it's defined
import { removeCookie } from '@/lib/cookieUtils';
import { USER_COOKIE_NAME } from '@/lib/constants';
import { workspaceActions } from '@/store/workspaceStore';
import { authActions } from '@/store/authStore';

export const logoutClientSide = async () => {
  // 1. Remove cookies
  removeCookie(USER_COOKIE_NAME);

  // 2. Clear browser storage
  localStorage.clear();
  sessionStorage.clear();

  // 3. Reset app state
  workspaceActions.reset(); // ✅ Clears workspace store
  authActions.clearAuth(); // ✅ Clears auth store

  // 4. Clear TanStack Query client
  await queryClient.cancelQueries();
  await queryClient.removeQueries();
  await queryClient.cancelQueries();
  queryClient.clear();

  // 5. Hard redirect to signin
  window.location.replace('/signin');
};
