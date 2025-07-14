export interface ILoginResponse{
  token: string;
  message?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  organization: string;
}