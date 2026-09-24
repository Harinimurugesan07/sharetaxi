import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  CheckCircle2,
  XCircle,
  Info,
  X,
} from "lucide-react";

const ToastContext = createContext(null);

const TOAST_TITLES = {
  success: "Success",
  error: "Notice",
  info: "Info",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const timersRef = useRef(new Map());

  // -----------------------------------------
  // Dismiss toast
  // -----------------------------------------
  const dismiss = useCallback((id) => {
    setToasts((current) =>
      current.filter((toast) => toast.id !== id)
    );

    const timer = timersRef.current.get(id);

    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  // -----------------------------------------
  // Add toast
  // -----------------------------------------
  const push = useCallback(
    (
      message,
      type = "success",
      title = TOAST_TITLES[type] || "Success"
    ) => {
      const id =
        Math.random().toString(36).slice(2) +
        Date.now().toString(36);

      setToasts((current) => [
        ...current,
        {
          id,
          message,
          type,
          title,
        },
      ]);

      // Auto dismiss after 3 seconds
      const timer = setTimeout(() => {
        dismiss(id);
      }, 3000);

      timersRef.current.set(id, timer);
    },
    [dismiss]
  );

  // -----------------------------------------
  // Clear timers on unmount
  // -----------------------------------------
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => {
        clearTimeout(timer);
      });

      timersRef.current.clear();
    };
  }, []);

  // -----------------------------------------
  // Toast API
  // -----------------------------------------
  const toast = {
    success: (message, title = "Success") =>
      push(message, "success", title),

    error: (message, title = "Notice") =>
      push(message, "error", title),

    info: (message, title = "Info") =>
      push(message, "info", title),
  };

  // -----------------------------------------
  // Icons
  // -----------------------------------------
  const icons = {
    success: <CheckCircle2 size={20} strokeWidth={2.4} />,
    error: <XCircle size={20} strokeWidth={2.4} />,
    info: <Info size={20} strokeWidth={2.4} />,
  };

  // -----------------------------------------
  // Toast styles
  // -----------------------------------------
  const styles = {
    success: {
      container: {
        background:
          "linear-gradient(135deg, #24469b 0%, #526aa8 48%, #f1c94b 100%)",
        border: "1px solid rgba(255, 255, 255, 0.3)",
        boxShadow: "0 10px 28px rgba(19, 36, 90, 0.22)",
        color: "#ffffff",
      },

      iconWrap: {
        background: "rgba(255, 255, 255, 0.18)",
        border: "1px solid rgba(255, 255, 255, 0.25)",
        color: "#ffffff",
      },

      close: {
        color: "rgba(255, 255, 255, 0.9)",
      },
    },

    error: {
      container: {
        background:
          "linear-gradient(135deg, #9b2929 0%, #d85b5b 100%)",
        border: "1px solid rgba(255, 255, 255, 0.25)",
        boxShadow: "0 10px 28px rgba(148, 21, 21, 0.2)",
        color: "#ffffff",
      },

      iconWrap: {
        background: "rgba(255, 255, 255, 0.16)",
        border: "1px solid rgba(255, 255, 255, 0.25)",
        color: "#ffffff",
      },

      close: {
        color: "rgba(255, 255, 255, 0.9)",
      },
    },

    info: {
      container: {
        background:
          "linear-gradient(135deg, #24469b 0%, #488cff 100%)",
        border: "1px solid rgba(255, 255, 255, 0.25)",
        boxShadow: "0 10px 28px rgba(29, 57, 126, 0.2)",
        color: "#ffffff",
      },

      iconWrap: {
        background: "rgba(255, 255, 255, 0.16)",
        border: "1px solid rgba(255, 255, 255, 0.25)",
        color: "#ffffff",
      },

      close: {
        color: "rgba(255, 255, 255, 0.9)",
      },
    },
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast container */}
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",

          // Prevent full-width toast
          width: "max-content",
          maxWidth: "calc(100vw - 32px)",

          display: "flex",
          flexDirection: "column",
          gap: "10px",

          zIndex: 99999,
          pointerEvents: "none",

          // Prevent container from stretching
          alignItems: "flex-end",
        }}
      >
        {toasts.map((t) => {
          const tone = styles[t.type] || styles.success;

          return (
            <div
              key={t.id}
              role="status"
              aria-live="polite"
              style={{
                ...tone.container,

                // Compact toast size
                width: "min(360px, calc(100vw - 32px))",
                minHeight: "64px",

                display: "flex",
                alignItems: "center",
                gap: "12px",

                padding: "12px 14px",

                borderRadius: "14px",

                boxSizing: "border-box",

                animation:
                  "ticketnow-toast-in 0.22s ease-out",

                pointerEvents: "auto",

                fontFamily: "inherit",
              }}
            >
              {/* Icon */}
              <div
                style={{
                  ...tone.iconWrap,

                  width: "36px",
                  height: "36px",

                  minWidth: "36px",

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",

                  borderRadius: "10px",

                  boxSizing: "border-box",
                }}
              >
                {icons[t.type]}
              </div>

              {/* Content */}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,

                  display: "flex",
                  flexDirection: "column",
                  gap: "3px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    lineHeight: "16px",

                    letterSpacing: "0.01em",

                    color: "#ffffff",
                  }}
                >
                  {t.title}
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    lineHeight: "18px",

                    color: "rgba(255, 255, 255, 0.94)",

                    overflowWrap: "anywhere",
                  }}
                >
                  {t.message}
                </div>
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                style={{
                  ...tone.close,

                  width: "28px",
                  height: "28px",

                  minWidth: "28px",

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",

                  padding: 0,

                  border: "none",
                  borderRadius: "50%",

                  background: "transparent",

                  cursor: "pointer",

                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background =
                    "rgba(255, 255, 255, 0.16)";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background =
                    "transparent";
                }}
              >
                <X size={17} strokeWidth={2.2} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Toast animation */}
      <style>
        {`
          @keyframes ticketnow-toast-in {
            from {
              opacity: 0;
              transform: translateY(10px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @media (max-width: 480px) {
            .ticketnow-toast-container {
              bottom: 16px;
              right: 16px;
            }
          }
        `}
      </style>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);