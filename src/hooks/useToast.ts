import * as React from "react";
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";
import { useToastStore, toastActions, ToastType } from "@/store/toastStore";

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  type?: ToastType;
  duration?: number;
};

type Toast = Omit<ToasterToast, "id">;

export function useToast() {
  const { toasts } = useToastStore();

  const toast = React.useMemo(
    () => ({
      // Base toast function
      toast: (props: Toast) => {
        // Extract action data if present
        let actionData = undefined;
        if (props.action) {
          // We'll assume the action component has data-* attributes we can access
          // This is a simplification - in a real app, you might want to use a ref
          // or modify the ToastAction component to accept and forward these props
          actionData = {
            label: "Action",
            onClick: () => console.log("Toast action clicked")
          };
        }
        
        const id = toastActions.addToast({
          title: props.title as string,
          description: props.description as string,
          type: props.type || "default",
          duration: props.duration,
          action: actionData
        });
        
        return {
          id,
          dismiss: () => toastActions.removeToast(id),
          update: (props: Partial<Toast>) => {
            // Current implementation doesn't support updates, 
            // but we could add this functionality to the store
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
    ...toast,
  };
}
