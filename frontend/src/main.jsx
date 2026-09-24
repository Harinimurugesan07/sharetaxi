import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { listenForForegroundMessages, requestPushToken } from "./lib/firebase";

function PushNotificationBoot() {
  useEffect(() => {
    const shouldRequest =
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default";

    if (!shouldRequest) return;

    requestPushToken().catch(() => undefined);

    const unsubscribe = listenForForegroundMessages((payload) => {
      const title = payload?.notification?.title || "ShareTaxi";
      const body = payload?.notification?.body || "You have a new update.";

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body });
      }
    });

    return unsubscribe;
  }, []);

  return null;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <PushNotificationBoot />
          <App />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
);
