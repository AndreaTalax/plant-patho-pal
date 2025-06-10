import { GripVertical } from "lucide-react"
import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "@/lib/utils"

/**
 * A React component that wraps ResizablePrimitive.PanelGroup with custom styling and additional properties.
 * @example
 * resizableComponent({className: "custom-class"})
 * <ResizablePrimitive.PanelGroup className="custom-class flex h-full w-full data-[panel-group-direction=vertical]:flex-col" />
 * @param {React.ComponentProps<typeof ResizablePrimitive.PanelGroup>} {className, ...props} - The properties received from the ResizablePrimitive.PanelGroup component.
 * @returns {JSX.Element} A JSX element representing a styled resizable panel group.
 * @description
 *   - Allows flexible layout orientation by manipulating the direction through CSS classes.
 *   - Passes all additional props to the underlying ResizablePrimitive.PanelGroup component for further customization.
 */
const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
)

const ResizablePanel = ResizablePrimitive.Panel

/**
 * Creates a resizable panel handle component with optional grip UI.
 * @example
 * createResizablePanelHandle({ withHandle: true, className: 'custom-class' })
 * Returns a JSX element of a resizable panel handle, possibly with a grip.
 * @param {boolean} withHandle - Determines if the panel handle includes a grip element.
 * @param {string} className - Additional CSS classes for panel handle styling.
 * @returns {JSX.Element} Returns a JSX element representing a panel handle used in a resizable layout.
 * @description
 *   - Uses `ResizablePrimitive.PanelResizeHandle` from `resizable.tsx`.
 *   - Applies styles conditionally based on the direction of the panel group.
 *   - The grip appears when `withHandle` is set to true, providing a visual indication for resizing.
 *   - Ensures accessibility with focus-visible and ring styling.
 */
const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean
}) => (
  <ResizablePrimitive.PanelResizeHandle
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
