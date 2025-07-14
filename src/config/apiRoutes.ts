import { ENV } from "./env";

export const API_LOGIN = ENV.API_BASE_URL + "/auth/login";
export const API_LOGOUT = ENV.API_BASE_URL + "/auth/logout";
export const API_REGISTER = ENV.API_BASE_URL + "/auth/register";
export const API_GET_USER = ENV.API_BASE_URL + "/auth/user";
export const API_WORKSPACES = ENV.API_BASE_URL + "/workspaces";
export const API_COLLECTIONS = ENV.API_BASE_URL + "/collections";
export const API_COLLECTION_REQUESTS = ENV.API_BASE_URL + "/requests";
export const API_COLLECTION_IMPORT = ENV.API_BASE_URL + "/collections/import";
