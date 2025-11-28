import { queryClient } from './queryClient';
import { removeCookie } from '@/lib/cookieUtils';
import { USER_COOKIE_NAME } from '@/lib/constants';
import { workspaceActions } from '@/store/workspaceStore';
import { authActions } from '@/store/authStore';
import { dataManagementActions } from '@/store/dataManagementStore';
import { clearWorkspaceStorage } from '@/utils/workspaceStorage';
import { clearAllEnvironmentStorage } from '@/utils/environmentStorage';

export const logoutClientSide = async () => {
  clearWorkspaceStorage();
  clearAllEnvironmentStorage();

  removeCookie(USER_COOKIE_NAME);

  localStorage.clear();
  sessionStorage.clear();

  workspaceActions.reset();
  authActions.clearAuth();
  dataManagementActions.setEnvironments([]);
  dataManagementActions.setActiveEnvironment(null);
  dataManagementActions.setVariables([]);
  dataManagementActions.setDynamicVariables([]);

  await queryClient.cancelQueries();
  await queryClient.removeQueries();
  queryClient.clear();

  window.location.replace('/signin');
};
