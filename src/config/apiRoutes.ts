import { ENV } from './env';

export const API_LOGIN = ENV.API_BASE_URL + '/auth/login';
export const API_LOGOUT = ENV.API_BASE_URL + '/auth/logout';
export const API_REGISTER = ENV.API_BASE_URL + '/auth/register';
export const API_PASSWORD_CHANGE = ENV.API_BASE_URL + '/auth/change-password';
export const API_GET_USER = ENV.API_BASE_URL + '/auth/details';

// Added for forgotten and reset password
export const API_FORGOT_PASSWORD = ENV.API_BASE_URL + '/auth/forgot-password';
export const API_RESET_PASSWORD = ENV.API_BASE_URL + '/auth/reset-password';

export const API_WORKSPACES = ENV.API_BASE_URL + '/workspaces';
export const API_COLLECTIONS = ENV.API_BASE_URL + '/collections';
export const API_COLLECTION_REQUESTS = ENV.API_BASE_URL + '/requests';
export const API_COLLECTION_IMPORT = ENV.API_BASE_URL + '/collections/import';
export const API_ENVIRONMENT = ENV.API_BASE_URL + '/environments';
export const API_VARIABLES = ENV.API_BASE_URL + '/environment-variables';
export const API_UPLOAD_REQUEST_SCHEMA =
  ENV.API_BASE_URL + '/requests/{id}/upload-schema';
export const API_GET_REQUEST_SCHEMA =
  ENV.API_BASE_URL + '/requests/{id}/schema';
export const API_TEST_SUITES = ENV.API_BASE_URL + '/test-suites';
export const API_TEST_CASES = ENV.API_BASE_URL + '/test-cases';
export const API_REQUEST = ENV.API_BASE_URL + '/requests';
export const API_EXECUTOR = ENV.API_BASE_URL + '/executor';
export const API_REQUEST_CHAIN = ENV.API_BASE_URL + '/request-chains';
export const API_REPORTS = ENV.API_BASE_URL + '/reports';
