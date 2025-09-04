import { create } from 'zustand';

export type ToastType =
  | 'default'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'destructive';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  type: ToastType;
  duration?: number;
  action?: ToastAction;
}

interface ToastStore {
  toasts: Toast[];
}

export const useToastStore = create<ToastStore>(() => ({
  toasts: [],
}));

let toastCount = 0;
const generateId = () => `toast-${++toastCount}`;

export const toastActions = {
  addToast: (toast: Omit<Toast, 'id'>): string => {
    const id = generateId();
    const newToast = { ...toast, id };

    useToastStore.setState((state) => ({
      toasts: [newToast, ...state.toasts].slice(0, 5), // Limit to 5 toasts
    }));

    // Auto remove after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        toastActions.removeToast(id);
      }, duration);
    }

    return id;
  },

  removeToast: (id: string) => {
    useToastStore.setState((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  clearToasts: () => {
    useToastStore.setState({ toasts: [] });
  },

  success: (title: string, description?: string, duration?: number): string => {
    return toastActions.addToast({
      title,
      description,
      type: 'success',
      duration,
    });
  },

  error: (title: string, description?: string, duration?: number): string => {
    return toastActions.addToast({
      title,
      description,
      type: 'error',
      duration,
    });
  },

  warning: (title: string, description?: string, duration?: number): string => {
    return toastActions.addToast({
      title,
      description,
      type: 'warning',
      duration,
    });
  },

  info: (title: string, description?: string, duration?: number): string => {
    return toastActions.addToast({
      title,
      description,
      type: 'info',
      duration,
    });
  },
};
