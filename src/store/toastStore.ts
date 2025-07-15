import { Store, useStore } from '@tanstack/react-store';

// Define toast types
export type ToastType = 'default' | 'success' | 'error' | 'info' | 'warning';

// Define the shape of a toast
export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  duration?: number; // Duration in milliseconds
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Define the shape of our toast state
interface ToastState {
  toasts: Toast[];
}

// Initial state for toast
export const initialToastState: ToastState = {
  toasts: [],
};

// Create the store
export const toastStore = new Store<ToastState>(initialToastState);

// Generate unique ID for toasts
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

// Define actions to update the store
export const toastActions = {
  // Add a new toast
  addToast: (toast: Omit<Toast, 'id'>) => {
    const id = generateId();

    toastStore.setState((state) => ({
      ...state,
      toasts: [...state.toasts, { ...toast, id }],
    }));

    // Auto-remove toast after duration
    if (toast.duration !== Infinity) {
      setTimeout(() => {
        toastActions.removeToast(id);
      }, toast.duration || 5000); // Default duration: 5 seconds
    }

    return id;
  },

  // Remove a toast by ID
  removeToast: (id: string) => {
    toastStore.setState((state) => ({
      ...state,
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  // Clear all toasts
  clearToasts: () => {
    toastStore.setState((state) => ({
      ...state,
      toasts: [],
    }));
  },

  // Helper methods for common toast types
  success: (title: string, description?: string, duration?: number) => {
    return toastActions.addToast({
      title,
      description,
      type: 'success',
      duration,
    });
  },

  error: (title: string, description?: string, duration?: number) => {
    return toastActions.addToast({
      title,
      description,
      type: 'error',
      duration,
    });
  },

  info: (title: string, description?: string, duration?: number) => {
    return toastActions.addToast({
      title,
      description,
      type: 'info',
      duration,
    });
  },

  warning: (title: string, description?: string, duration?: number) => {
    return toastActions.addToast({
      title,
      description,
      type: 'warning',
      duration,
    });
  },
};

// Hook to use the toast store
export const useToastStore = () => {
  return useStore(toastStore);
};
