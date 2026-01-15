import { useMutation } from '@tanstack/react-query';

import {
  validateAssertions,
  ValidationApiResponse,
  ValidationPayload,
  saveAssertions,
  SaveAssertionsPayload,
  SaveAssertionsResponse,
} from '@/services/assertionValidation.service';

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

interface UseSaveAssertionsOptions {
  onSuccess?: (data: SaveAssertionsResponse) => void;
  onError?: (error: Error) => void;
}

interface SaveAssertionsMutationParams {
  requestId: string;
  payload: SaveAssertionsPayload;
}

export const useSaveAssertionsMutation = (
  options?: UseSaveAssertionsOptions
) => {
  return useMutation<
    SaveAssertionsResponse,
    Error,
    SaveAssertionsMutationParams
  >({
    mutationFn: ({ requestId, payload }) => saveAssertions(requestId, payload),

    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },

    onError: (error) => {
      options?.onError?.(error);
    },
  });
};
