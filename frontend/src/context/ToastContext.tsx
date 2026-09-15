import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
});

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = nextId++;
    setToasts((t) => [...t.slice(-4), { id, message, type }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const success = useCallback((msg: string) => toast(msg, "success"), [toast]);
  const error   = useCallback((msg: string) => toast(msg, "error"),   [toast]);
  const info    = useCallback((msg: string) => toast(msg, "info"),    [toast]);

  const icons = { success: CheckCircle, error: XCircle, info: Info };
  const colors = {
    success: { bg: "#F0FDF4", border: "#BBF7D0", icon: "#22A06B", text: "#14532D" },
    error:   { bg: "#FEF2F2", border: "#FECACA", icon: "#E5484D", text: "#7F1D1D" },
    info:    { bg: "#EFF6FF", border: "#BFDBFE", icon: "#4F7CFF", text: "#1E3A8A" },
  };

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      {createPortal(
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9000, display: "flex", flexDirection: "column", gap: 10, maxWidth: 360 }}>
          {toasts.map((t) => {
            const Icon = icons[t.type];
            const c = colors[t.type];
            return (
              <div
                key={t.id}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "12px 14px",
                  background: c.bg, border: `1px solid ${c.border}`,
                  borderRadius: 12,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                  animation: "toastIn 200ms ease-out both",
                }}
              >
                <Icon size={16} style={{ color: c.icon, flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 13, color: c.text, flex: 1, lineHeight: 1.5, margin: 0 }}>{t.message}</p>
                <button
                  onClick={() => dismiss(t.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: c.icon, padding: 0, flexShrink: 0 }}
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
