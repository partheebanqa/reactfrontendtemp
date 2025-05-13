// services/snackbarService.ts
type SnackbarType = 'success' | 'error';

let showSnackbarFn: ((message: string, type?: SnackbarType) => void) | null = null;

export const setShowSnackbar = (
  fn: (message: string, type?: SnackbarType) => void
) => {
  showSnackbarFn = fn;
};

export const showSnackbar = (
  message: string,
  type: SnackbarType = 'error'
) => {
  if (showSnackbarFn) {
    showSnackbarFn(message, type);
  } else {
    console.warn('Snackbar function not initialized');
  }
};
