
import { toast } from 'sonner';
import { useTheme } from '@/context/ThemeContext';

interface ErrorToastOptions {
  title: string;
  description?: string;
  duration?: number;
}

/**
 * Displays an error toast notification with customizable options.
 * @example
 * showErrorToast({ title: 'Error occurred', description: 'Please try again', duration: 3000 })
 * // Displays an error toast with a retry button
 * @param {Object} options - Configuration options for the error toast.
 * @param {string} options.title - The title of the error toast.
 * @param {string} [options.description] - Optional description providing more details about the error.
 * @param {number} [options.duration=5000] - The duration in milliseconds the toast should remain on the screen.
 * @returns {void} No return value.
 * @description
 *   - If a description is provided, a retry button is included in the toast.
 *   - This function uses the `toast.error` method from a toast library.
 *   - The default toast duration is 5000 milliseconds if not specified.
 */
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
