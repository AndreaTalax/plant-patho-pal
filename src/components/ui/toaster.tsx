import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

/**
 * Renders a collection of toast notifications using a React component.
 * @example
 * Toaster()
 * <ToastProvider>...</ToastProvider>
 * @returns {JSX.Element} A React component representing a list of toast notifications with various properties.
 * @description
 *   - Utilizes the `useToast` hook to access the list of active toasts.
 *   - Each toast can optionally include a title, description, and custom actions.
 *   - The `ToastProvider` is used to encapsulate the toasts for proper context management.
 */
export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
