import { useEffect, useState } from "react";
import { Bell, Lock, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getNotificationStatus, saveNotificationToken, deleteNotificationToken } from "../../api/notifications";
import { isPushSupported, requestPushToken } from "../../lib/firebase";
import "./Settings.css";

function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`cp-toggle ${checked ? "cp-toggle-on" : ""}`}
      type="button"
      disabled={disabled}
    >
      <span className="cp-toggle-knob" />
    </button>
  );
}

export default function Settings() {
  const { logout } = useAuth();
  const toast = useToast();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supportsPush, setSupportsPush] = useState(false);
  const [permissionState, setPermissionState] = useState("default");

  useEffect(() => {
    const permission = "Notification" in window ? Notification.permission : "unsupported";
    setSupportsPush(isPushSupported());
    setPermissionState(permission);

    const loadStatus = async () => {
      try {
        const status = await getNotificationStatus();
        setPushEnabled(Boolean(status?.enabled));
      } catch {
        setPushEnabled(false);
      }
    };

    loadStatus();
  }, []);

  const handlePushToggle = async () => {
    if (!supportsPush) {
      toast.info("This browser does not support push notifications.");
      return;
    }

    if (permissionState === "denied") {
      toast.error("Notifications are blocked for this site. Please allow them in your browser site settings.");
      return;
    }

    setLoading(true);

    try {
      if (!pushEnabled) {
        const token = await requestPushToken();
        if (!token) {
          setPermissionState("Notification" in window ? Notification.permission : "unsupported");
          toast.error("Push permission was not granted. Please allow notifications in the browser prompt or site settings.");
          return;
        }
        await saveNotificationToken(token);
        setPushEnabled(true);
        setPermissionState("granted");
        toast.success("Ride alerts are enabled.");
        return;
      }

      const token = localStorage.getItem("st_push_token");
      if (token) {
        await deleteNotificationToken(token);
      }
      localStorage.removeItem("st_push_token");
      setPushEnabled(false);
      setPermissionState("default");
      toast.info("Push notifications were disabled.");
    } catch (error) {
      const message = error?.message || "Unable to update notification settings.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const showEnableBanner = supportsPush && !pushEnabled && permissionState !== "granted";

  return (
    <div className="se-wrap">
      {/* Notifications */}
      <section className="cp-panel">
        <div className="cp-section">
          <div className="cp-section-head">
            <span className="cp-section-icon">
              <Bell />
            </span>
            <p className="cp-section-title">Notifications</p>
          </div>

          {showEnableBanner && (
            <div className={`cp-alert ${permissionState === "denied" ? "cp-alert--danger" : "cp-alert--amber"}`}>
              <p>
                {permissionState === "denied"
                  ? "Notifications are blocked for this site. Enable them in browser settings to receive trip alerts."
                  : "Enable browser notifications to receive ride, booking, and trip updates on this device."}
              </p>
              <button type="button" className="cp-btn cp-btn-outline" onClick={handlePushToggle} disabled={loading}>
                {permissionState === "denied" ? "Fix permission" : "Enable"}
              </button>
            </div>
          )}

          <div className="cp-row">
            <div>
              <p className="cp-row-label">Browser push alerts</p>
              <p className="cp-row-desc">
                {supportsPush
                  ? "Receive trip status, booking, and driver updates on this device."
                  : "Push notifications are not available in this browser."}
              </p>
            </div>
            <Toggle checked={pushEnabled} onChange={handlePushToggle} disabled={loading || !supportsPush} />
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="cp-panel">
        <div className="cp-section">
          <div className="cp-section-head">
            <span className="cp-section-icon">
              <Lock />
            </span>
            <p className="cp-section-title">Security</p>
          </div>
          <p className="cp-row-desc cp-row-desc--standalone">Manage how you sign in and keep your account secure.</p>
          <button className="cp-btn cp-btn-outline">Change password</button>
        </div>
      </section>

      {/* Danger zone — spans full width below the two cards above */}
      <section className="cp-panel cp-panel--danger-zone">
        <div className="cp-section">
          <div className="cp-section-head">
            <span className="cp-section-icon cp-section-icon--danger">
              <Trash2 />
            </span>
            <p className="cp-section-title cp-section-title--danger">Danger zone</p>
          </div>
          <p className="cp-row-desc">Logging out will end your session on this device.</p>
          <button className="cp-btn cp-btn-danger" onClick={logout}>
            Log out
          </button>
        </div>
      </section>
    </div>
  );
}