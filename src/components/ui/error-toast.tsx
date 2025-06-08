
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface ErrorToastProps {
  title: string;
  description?: string;
  type?: 'error' | 'success' | 'info' | 'warning';
}

export const showErrorToast = ({ title, description, type = 'error' }: ErrorToastProps) => {
  const icons = {
    error: AlertCircle,
    success: CheckCircle,
    info: Info,
    warning: AlertTriangle
  };

  const colors = {
    error: 'text-red-600',
    success: 'text-green-600',
    info: 'text-blue-600',
    warning: 'text-yellow-600'
  };

  const Icon = icons[type];

  const toastFunction = {
    error: toast.error,
    success: toast.success,
    info: toast.info,
    warning: toast.warning
  }[type];

  toastFunction(title, {
    description,
    duration: 4000,
    icon: <Icon className={`h-4 w-4 ${colors[type]}`} />,
    style: {
      background: 'white',
      border: `1px solid ${type === 'error' ? '#fee2e2' : type === 'success' ? '#dcfce7' : type === 'warning' ? '#fef3c7' : '#dbeafe'}`,
      color: '#1f2937'
    }
  });
};

export const showSuccessToast = (title: string, description?: string) => {
  showErrorToast({ title, description, type: 'success' });
};

export const showInfoToast = (title: string, description?: string) => {
  showErrorToast({ title, description, type: 'info' });
};

export const showWarningToast = (title: string, description?: string) => {
  showErrorToast({ title, description, type: 'warning' });
};
