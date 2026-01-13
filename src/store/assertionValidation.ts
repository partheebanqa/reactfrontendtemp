import {
  validateAssertions,
  ValidationApiResponse,
  ValidationPayload,
} from '@/services/assertionValidation.service';
import { useMutation } from '@tanstack/react-query';

interface UseValidateAssertionsOptions {
  onSuccess?: (data: ValidationApiResponse) => void;
  onError?: (error: Error) => void;
}

export const useValidateAssertionsMutation = (
  options?: UseValidateAssertionsOptions
) => {
  return useMutation<ValidationApiResponse, Error, ValidationPayload>({
    mutationFn: (payload: ValidationPayload) => validateAssertions(payload),

    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },

    onError: (error) => {
      options?.onError?.(error);
    },
  });
};
