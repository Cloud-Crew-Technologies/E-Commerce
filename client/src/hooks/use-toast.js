import * as React from "react";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 3000; // 1 second delay before removing from DOM
const TOAST_AUTO_DISMISS_DELAY = 8000; // 5 seconds before auto-dismiss

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
};

const toastTimeouts = new Map();
const autoDismissTimeouts = new Map();
const listeners = [];
let memoryState = { toasts: [] };

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

function reducer(state, action) {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action;

      if (toastId) {
        // Clear auto-dismiss timeout when manually dismissing
        if (autoDismissTimeouts.has(toastId)) {
          clearTimeout(autoDismissTimeouts.get(toastId));
          autoDismissTimeouts.delete(toastId);
        }
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          if (autoDismissTimeouts.has(toast.id)) {
            clearTimeout(autoDismissTimeouts.get(toast.id));
            autoDismissTimeouts.delete(toast.id);
          }
          addToRemoveQueue(toast.id);
        });
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
      };
    }
    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    default:
      return state;
  }
}

function dispatch(action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

const addToRemoveQueue = (toastId) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: actionTypes.REMOVE_TOAST,
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

const addToAutoDismissQueue = (
  toastId,
  duration = TOAST_AUTO_DISMISS_DELAY
) => {
  // Don't auto-dismiss if duration is 0 or false
  if (duration === 0 || duration === false) {
    return;
  }

  const timeout = setTimeout(() => {
    autoDismissTimeouts.delete(toastId);
    dispatch({
      type: actionTypes.DISMISS_TOAST,
      toastId: toastId,
    });
  }, duration);

  autoDismissTimeouts.set(toastId, timeout);
};

function toast(props) {
  const id = genId();
  const { duration, ...restProps } = props;

  const update = (props) =>
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: { ...props, id },
    });

  const dismiss = () => {
    // Clear auto-dismiss timeout when manually dismissing
    if (autoDismissTimeouts.has(id)) {
      clearTimeout(autoDismissTimeouts.get(id));
      autoDismissTimeouts.delete(id);
    }
    dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id });
  };

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...restProps,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  // Set up auto-dismiss
  addToAutoDismissQueue(id, duration);

  return {
    id,
    dismiss,
    update,
  };
}

// Utility functions for common toast types
toast.success = (message, options = {}) => {
  return toast({
    title: "Success",
    description: message,
    variant: "default",
    duration: 4000,
    ...options,
  });
};

toast.error = (message, options = {}) => {
  return toast({
    title: "Error",
    description: message,
    variant: "destructive",
    duration: 6000, // Error messages stay longer
    ...options,
  });
};

toast.warning = (message, options = {}) => {
  return toast({
    title: "Warning",
    description: message,
    variant: "default",
    duration: 5000,
    ...options,
  });
};

toast.info = (message, options = {}) => {
  return toast({
    title: "Info",
    description: message,
    variant: "default",
    duration: 4000,
    ...options,
  });
};

// Toast that doesn't auto-dismiss
toast.persistent = (props) => {
  return toast({
    ...props,
    duration: 0, // Won't auto-dismiss
  });
};

function useToast() {
  const [state, setState] = React.useState(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId) => {
      // Clear auto-dismiss timeout when manually dismissing
      if (toastId && autoDismissTimeouts.has(toastId)) {
        clearTimeout(autoDismissTimeouts.get(toastId));
        autoDismissTimeouts.delete(toastId);
      }
      dispatch({ type: actionTypes.DISMISS_TOAST, toastId });
    },
  };
}

// Cleanup function to clear all timeouts (useful for testing or cleanup)
const clearAllTimeouts = () => {
  toastTimeouts.forEach((timeout) => clearTimeout(timeout));
  autoDismissTimeouts.forEach((timeout) => clearTimeout(timeout));
  toastTimeouts.clear();
  autoDismissTimeouts.clear();
};

export { useToast, toast, clearAllTimeouts };
