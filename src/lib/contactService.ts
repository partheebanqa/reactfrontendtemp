import axios from 'axios';
import { ContactFormData, SubmissionResponse } from '@/shared/types/contact';
import { sanitizeFormData } from '../utils/validation';
import { formRateLimiter, getClientFingerprint } from '../utils/security';

export const submitContactForm = async (
  data: ContactFormData
): Promise<SubmissionResponse> => {
  // 1. Rate limiting check
  const clientId = getClientFingerprint();
  const API_URL = 'https://apibackenddev.onrender.com/v1';

  if (!formRateLimiter.isAllowed(clientId)) {
    const remainingTime = Math.ceil(
      formRateLimiter.getRemainingTime(clientId) / 1000 / 60
    );
    throw new Error(
      `Too many attempts. Please try again in ${remainingTime} minutes.`
    );
  }

  // 2. Sanitize data
  const sanitizedData = sanitizeFormData(data);

  // 3. Extra validation before sending
  if (!sanitizedData.name || !sanitizedData.email || !sanitizedData.message) {
    throw new Error('Required fields are missing or invalid');
  }

  try {
    // 4. Send to API
    const response = await axios.post(`${API_URL}/contact`, sanitizedData, {
      headers: { 'Content-Type': 'application/json' },
    });

    return {
      success: true,
      message:
        response.data?.message ||
        "Thank you for your message! We'll get back to you soon.",
    };
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        error.response.data?.message || 'Failed to submit contact form'
      );
    } else if (error.request) {
      throw new Error('No response from server. Please try again later.');
    } else {
      throw new Error(error.message || 'Unexpected error');
    }
  }
};
