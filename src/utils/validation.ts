import { ContactFormData, ContactFormErrors } from '../types/contact';
import { 
  sanitizeText, 
  sanitizeEmail, 
  sanitizePhone, 
  validateCSP,
  preventSQLInjection 
} from './security';

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

export const validateContactForm = (data: ContactFormData): ContactFormErrors => {
  const errors: ContactFormErrors = {};

  // Sanitize and validate name
  const sanitizedName = sanitizeText(data.name, 100);
  if (!sanitizedName.trim()) {
    errors.name = 'Name is required';
  } else if (sanitizedName.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters long';
  } else if (!validateCSP(sanitizedName)) {
    errors.name = 'Name contains invalid characters';
  } else if (!/^[a-zA-Z\s\-'\.]+$/.test(sanitizedName)) {
    errors.name = 'Name can only contain letters, spaces, hyphens, apostrophes, and periods';
  }

  // Sanitize and validate email
  const sanitizedEmail = sanitizeEmail(data.email);
  if (!sanitizedEmail.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(sanitizedEmail)) {
    errors.email = 'Please enter a valid email address';
  } else if (!validateCSP(sanitizedEmail)) {
    errors.email = 'Email contains invalid characters';
  }

  // Sanitize and validate phone
  const sanitizedPhone = sanitizePhone(data.phone);
  if (!sanitizedPhone.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!validatePhone(sanitizedPhone)) {
    errors.phone = 'Please enter a valid phone number';
  } else if (!validateCSP(sanitizedPhone)) {
    errors.phone = 'Phone number contains invalid characters';
  }

  // Sanitize and validate company
  const sanitizedCompany = sanitizeText(data.company, 200);
  if (!sanitizedCompany.trim()) {
    errors.company = 'Company name is required';
  } else if (sanitizedCompany.trim().length < 2) {
    errors.company = 'Company name must be at least 2 characters long';
  } else if (!validateCSP(sanitizedCompany)) {
    errors.company = 'Company name contains invalid characters';
  } else if (!/^[a-zA-Z0-9\s\-'\.&,()]+$/.test(sanitizedCompany)) {
    errors.company = 'Company name contains invalid characters';
  }

  // Sanitize and validate message
  const sanitizedMessage = sanitizeText(data.message, 2000);
  if (!sanitizedMessage.trim()) {
    errors.message = 'Message is required';
  } else if (sanitizedMessage.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters long';
  } else if (!validateCSP(sanitizedMessage)) {
    errors.message = 'Message contains potentially unsafe content';
  }

  // Additional security check for SQL injection patterns
  const fieldsToCheck = [sanitizedName, sanitizedEmail, sanitizedCompany, sanitizedMessage];
  for (const field of fieldsToCheck) {
    const cleanField = preventSQLInjection(field);
    if (cleanField !== field) {
      errors.message = 'Form contains potentially unsafe content';
      break;
    }
  }

  return errors;
};

/**
 * Sanitizes the entire form data before submission
 */
export const sanitizeFormData = (data: ContactFormData): ContactFormData => {
  return {
    name: sanitizeText(data.name, 100),
    email: sanitizeEmail(data.email),
    phone: sanitizePhone(data.phone),
    country: sanitizeText(data.country, 10), // Country codes are short
    company: sanitizeText(data.company, 200),
    message: sanitizeText(data.message, 2000),
    subscribe: Boolean(data.subscribe) // Ensure boolean type
  };
};