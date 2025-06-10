import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { ButtonProps, buttonVariants } from "@/components/ui/button"

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">

/**
* Creates a paginated link component with outlined or ghost styling based on active state.
* @example
* PaginationLinkProps({ className: "custom-link", isActive: true, size: "small", href: "#" })
* Returns an anchor element with the specified class names and properties.
* @param {Object} PaginationLinkProps - Properties for the pagination link, including className, isActive, size, and other anchor attributes.
* @returns {JSX.Element} A rendered anchor element with pagination link styles applied.
* @description
*   - Overrides the aria-current attribute to "page" when the link is active for accessibility purposes.
*   - Combines custom class names with button variant classes for consistent styling.
*   - Accepts additional properties spread onto the anchor element for flexible usage.
*/
const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      className
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

/**
 * Creates a pagination link component for navigating to the previous page.
 * @example
 * createPreviousPageLink({ className: "custom-class" })
 * // Returns a PaginationLink component styled with a left-pointing Chevron icon.
 * @param {React.ComponentProps<typeof PaginationLink>} {className, ...props} - Props for the PaginationLink component.
 * @returns {JSX.Element} A React component representing a pagination link.
 * @description
 *   - Combines the provided className with default styling for consistent spacing.
 *   - Utilizes the ChevronLeft icon to visually indicate direction.
 *   - Maintains accessibility by setting aria-label to "Go to previous page".
 */
const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

/**
 * Component for rendering a pagination link that directs to the next page.
 * @example
 * renderNextPaginationLink({className: 'custom-class', onClick: handleClick})
 * // Returns a JSX element with a button to navigate to the next page
 * @param {object} {className, ...props} - Props inherited from PaginationLink component. 
 * @param {string} className - Additional classes for styling the component.
 * @returns {JSX.Element} A PaginationLink component with a "Next" button.
 * @description
 *   - Combines given className with default styling classes.
 *   - Passes down all additional props to the PaginationLink component.
 *   - Utilizes the ChevronRight icon for visual indication of forward navigation.
 */
const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

/**
* Renders a span element with accessible pagination controls
* @example
* PaginationComponent({ className: "custom-class", id: "pagination-1" })
* Returns a span element with additional pagination controls
* @param {React.ComponentProps<"span">} {className, ...props} - Props for the span element including any specified class name and additional properties.
* @returns {JSX.Element} A JSX span element used for pagination controls with accessibility features.
* @description
*   - Utilizes the 'MoreHorizontal' component to indicate additional pages visually.
*   - Includes a screen-reader-only text for better accessibility.
*   - Combines default styles with custom styles through the `className` prop.
*/
const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
