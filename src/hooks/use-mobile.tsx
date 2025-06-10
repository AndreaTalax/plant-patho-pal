import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * Determines if the current window width indicates a mobile device.
 * @example
 * useIsMobile()
 * returns true if window.innerWidth is less than MOBILE_BREAKPOINT.
 * @returns {boolean} Returns `true` if the window width is below the specified MOBILE_BREAKPOINT, indicating a mobile device; otherwise, `false`.
 * @description
 *   - Uses the `window.matchMedia` API to track changes in the viewport width.
 *   - `React.useEffect` ensures the side effect of updating state during changes.
 *   - Listens for changes in viewport width and updates the state accordingly.
 *   - Returns a boolean value indicating the mobile status.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
