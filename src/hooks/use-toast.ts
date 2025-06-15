import * as React from "react"
import { 
  Toast, 
  ToastClose, 
  ToastDescription, 
  ToastProvider, 
  ToastTitle, 
  ToastViewport, 
  type ToastProps, 
  type ToastActionElement 
} from "@/components/ui/toast"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000 // 5 secondi

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: Omit<ToasterToast, "id">
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast> & Pick<ToasterToast, "id">
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

/**
* Sets a timeout to remove a toast notification after a specified delay
* @example
* setToastRemovalTimeout("toast123")
* undefined
* @param {string} toastId - The unique identifier for the toast notification to be removed.
* @returns {void} Does not return a value.
* @description
*   - Prevents multiple removal timeouts from being set for the same toast by checking `toastTimeouts`.
*   - Utilizes `dispatch` with action type `REMOVE_TOAST` to remove the toast from the UI.
*   - Deletes the toast entry from `toastTimeouts` upon timeout completion.
*   - The removal delay is defined by the constant `TOAST_REMOVE_DELAY`.
*/
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: actionTypes.REMOVE_TOAST,
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

/**
 * Manages the state of toasts based on dispatched actions.
 * @example
 * stateManager(currentState, action)
 * returns a new state with updated toasts based on the action type.
 * @param {State} state - The current state of the toasts.
 * @param {Action} action - The action object containing type and payload to modify the state.
 * @returns {State} The new state after applying the action.
 * @description 
 *   - Actions include adding, updating, dismissing, and removing toasts.
 *   - Limits the number of toasts to a predefined constant, TOAST_LIMIT.
 *   - Dismissing a toast is a non-obvious side effect, managed via a removal queue.
 *   - Handles edge cases for action types without toast IDs effectively.
 */
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [
          { id: genId(), ...action.toast },
          ...state.toasts,
        ].slice(0, TOAST_LIMIT),
      }

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

/**
 * Generates a toast notification with unique ID and provides methods to update or dismiss it.
 * @example
 * const myToast = toast({ message: 'Hello World' });
 * myToast.dismiss();
 * @param {Toast} props - Properties to customize the toast notification such as message and type.
 * @returns {Object} Returns an object containing the unique ID, and methods 'dismiss' and 'update' for the toast.
 * @description
 *   - The toast is automatically added and set to open when initialized.
 *   - The `onOpenChange` handler automatically calls `dismiss` when the toast is closed.
 */
function toast(props: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id })

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

/**
 * Custom hook to manage toast notifications and their state.
 * @example
 * const { toast, dismiss } = useToast();
 * toast({ message: "Hello, World!" });
 * dismiss("toastId");
 * @param {State} memoryState - Initial state value for the toasts, managed internally.
 * @returns {Object} Returns an object containing the current state of toast notifications, a function to display toasts, and another to dismiss them based on their ID.
 * @description
 *   - Automatically subscribes to state changes and cleans up on component unmount.
 *   - Integrates with a global listeners array to manage state updates.
 */
function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  }
}

/**
+ * Helper per dismissare tutti i toast subito su richiesta
+ */
+export function dismissAllToasts() {
+  dispatch({ type: actionTypes.DISMISS_TOAST });
+}

export { useToast, toast }
