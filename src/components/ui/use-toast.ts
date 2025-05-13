
import { toast } from "sonner";

// Re-export toast function so it can be used throughout the app
export { toast };

// Add custom toast helper functions for common notifications
export const showSuccessToast = (title: string, description?: string) => {
  toast.success(title, {
    description,
    duration: 5000,
    id: `success-${Date.now()}`, // Generate unique IDs to prevent duplications
    dismissible: true,
  });
};

export const showErrorToast = (title: string, description?: string) => {
  toast.error(title, {
    description,
    duration: 7000,
    id: `error-${Date.now()}`,
    dismissible: true,
  });
};

export const showInfoToast = (title: string, description?: string) => {
  toast.info(title, {
    description,
    duration: 4000,
    id: `info-${Date.now()}`,
    dismissible: true,
  });
};

export const showWarningToast = (title: string, description?: string) => {
  toast.warning(title, {
    description,
    duration: 6000,
    id: `warning-${Date.now()}`,
    dismissible: true,
  });
};

// Create a function to clear all toasts
export const clearAllToasts = () => {
  toast.dismiss();
};
