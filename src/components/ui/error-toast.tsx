
import { toast } from 'sonner';

interface ErrorToastOptions {
  title: string;
  description?: string;
  duration?: number;
}

export const showErrorToast = ({ title, description, duration = 5000 }: ErrorToastOptions) => {
  toast.error(title, {
    description,
    duration,
    action: description ? {
      label: 'Riprova',
      onClick: () => {
        // Optional retry logic can be added here
      }
    } : undefined
  });
};

export const showSuccessToast = (message: string, duration = 3000) => {
  toast.success(message, { duration });
};

export const showWarningToast = (message: string, duration = 4000) => {
  toast.warning(message, { duration });
};

export const showInfoToast = (message: string, duration = 3000) => {
  toast.info(message, { duration });
};
