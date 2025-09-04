import { ContactFormData, SubmissionResponse } from '@/shared/types/contact';
import { sanitizeFormData } from '../utils/validation';
import { formRateLimiter, getClientFingerprint } from '../utils/security';

// Simulate API call - replace with your actual API endpoint
export const submitContactForm = async (
  data: ContactFormData
): Promise<SubmissionResponse> => {
  // Rate limiting check
  const clientId = getClientFingerprint();
  if (!formRateLimiter.isAllowed(clientId)) {
    const remainingTime = Math.ceil(
      formRateLimiter.getRemainingTime(clientId) / 1000 / 60
    );
    throw new Error(
      `Too many attempts. Please try again in ${remainingTime} minutes.`
    );
  }

  // Sanitize form data before processing
  const sanitizedData = sanitizeFormData(data);

  // Additional server-side validation would go here
  if (!sanitizedData.name || !sanitizedData.email || !sanitizedData.message) {
    throw new Error('Required fields are missing or invalid');
  }

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Simulate random success/failure for demo
  const shouldSucceed = Math.random() > 0.2;

  if (!shouldSucceed) {
    throw new Error('Failed to submit form. Please try again.');
  }

  // Log sanitized data (in production, use proper logging)

  return {
    success: true,
    message: "Thank you for your message! We'll get back to you soon.",
  };
};
