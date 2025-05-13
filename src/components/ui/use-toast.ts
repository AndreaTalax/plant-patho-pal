
import { useToast as useToastHook } from "@/hooks/use-toast";
import { toast } from "sonner";

// Re-export toast functions so they can be used throughout the app
export { useToastHook as useToast, toast };

// Add custom toast helper functions for common notifications
export const showSuccessToast = (title: string, description?: string) => {
  toast.success(title, {
    description,
    duration: 5000,
  });
};

export const showErrorToast = (title: string, description?: string) => {
  toast.error(title, {
    description,
    duration: 7000,
  });
};

export const showInfoToast = (title: string, description?: string) => {
  toast.info(title, {
    description,
    duration: 4000,
  });
};

export const showWarningToast = (title: string, description?: string) => {
  toast.warning(title, {
    description,
    duration: 6000,
  });
};
