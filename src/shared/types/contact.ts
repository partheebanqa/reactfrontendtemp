export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  country: string;
  company: string;
  message: string;
  subscribe: boolean;
}

export interface ContactFormErrors {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  message?: string;
}

export interface SubmissionResponse {
  success: boolean;
  message: string;
}