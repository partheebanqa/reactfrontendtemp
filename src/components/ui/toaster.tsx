import { useToast } from "@/hooks/useToast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { toastActions } from "@/store/toastStore";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, type, ...props }) {
        return (
          <Toast 
            key={id} 
            {...props} 
            variant={type as any}
            onOpenChange={(open) => {
              if (!open) toastActions.removeToast(id);
            }}
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action && (
              <div className="mt-2">
                <button 
                  className="rounded px-2 py-1 text-xs font-medium bg-primary text-primary-foreground"
                  onClick={() => {
                    action.onClick();
                    toastActions.removeToast(id);
                  }}
                >
                  {action.label}
                </button>
              </div>
            )}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
