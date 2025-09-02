import * as React from 'react';
import type { ToastActionElement, ToastProps } from '@/components/ui/toast';
import { useToastStore, toastActions, ToastType } from '@/store/toastStore';

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  type?: ToastType;
  duration?: number;
};

type Toast = Omit<ToasterToast, 'id'>;

function toast({ ...props }: Toast) {
  let actionData = undefined;
  if (props.action) {
    actionData = {
      label: 'Action',
      onClick: () => console.log('Toast action clicked'),
    };
  }

  const id = toastActions.addToast({
    title: props.title as string,
    description: props.description as string,
    type: props.type || 'default',
    duration: props.duration,
    action: actionData,
  });

  return {
    id,
    dismiss: () => toastActions.removeToast(id),
    update: (props: Partial<Toast>) => {
      // Updates not supported in current implementation
    },
  };
}

export function useToast() {
  const { toasts } = useToastStore();

  const toastFunctions = React.useMemo(
    () => ({
      // Base toast function (legacy support)
      toast: (props: Toast) => {
        let actionData = undefined;
        if (props.action) {
          actionData = {
            label: 'Action',
            onClick: () => console.log('Toast action clicked'),
          };
        }

        const id = toastActions.addToast({
          title: props.title as string,
          description: props.description as string,
          type: props.type || 'default',
          duration: props.duration,
          action: actionData,
        });

        return {
          id,
          dismiss: () => toastActions.removeToast(id),
          update: (props: Partial<Toast>) => {
            // Updates not supported in current implementation
          },
        };
      },

      // Typed variants
      success: (title: string, description?: string, duration?: number) => {
        const id = toastActions.success(title, description, duration);
        return {
          id,
          dismiss: () => toastActions.removeToast(id),
        };
      },

      error: (title: string, description?: string, duration?: number) => {
        const id = toastActions.error(title, description, duration);
        return {
          id,
          dismiss: () => toastActions.removeToast(id),
        };
      },

      info: (title: string, description?: string, duration?: number) => {
        const id = toastActions.info(title, description, duration);
        return {
          id,
          dismiss: () => toastActions.removeToast(id),
        };
      },

      warning: (title: string, description?: string, duration?: number) => {
        const id = toastActions.warning(title, description, duration);
        return {
          id,
          dismiss: () => toastActions.removeToast(id),
        };
      },

      // Dismiss functions
      dismiss: (id?: string) => {
        if (id) {
          toastActions.removeToast(id);
        } else {
          toastActions.clearToasts();
        }
      },
    }),
    []
  );

  return {
    toasts,
    ...toastFunctions,
  };
}

export { toast };
