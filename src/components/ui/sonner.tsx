import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

/**
 * Renders a customized toaster with theme support using Sonner library.
 * @example
 * renderToaster({ theme: "dark", position: "top-right" })
 * The function will return and render a Sonner component with the specified theme and position.
 * @param {ToasterProps} props - Properties to customize the appearance and behavior of the toaster.
 * @returns {JSX.Element} A Sonner component customized with the given toaster properties.
 * @description
 *   - Allows overriding the theme with the useTheme hook.
 *   - Applies specific group-based class names for styling different parts of the toast.
 *   - Utilizes Sonner's toastOptions to define custom visual styles.
 *   - Supports spreading additional properties passed through the ToasterProps.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
