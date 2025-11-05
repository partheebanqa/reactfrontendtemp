export interface ILoginResponse {
  error(error: any): unknown;
  token: string;
  message?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  organization: string | null;
}

export interface SingUpForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  workspaceName: string;
  os: string;
  browser: string;
  browserVersion: string;
  timezone: string;
  agreedToTerms: boolean;
}
