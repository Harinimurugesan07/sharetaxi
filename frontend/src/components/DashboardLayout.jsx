import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Bell, Menu, X, LogOut, Clock, Search, AlertCircle } from "lucide-react";

import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";
import { getProfileCompletion, supportsProfileCompletion } from "../lib/profileCompletion";
import { isOperatorOwnedDriver } from "../lib/driverType";

import "./DashboardLayout.css";


function groupNav(nav) {
  const groups = [];
  const bySection = new Map();

  nav.forEach((item) => {
    const key = item.section || "__default";
    if (!bySection.has(key)) {
      const group = { section: item.section || null, items: [] };
      bySection.set(key, group);
      groups.push(group);
    }
    bySection.get(key).items.push(item);
  });

  return groups;
}

function NavGroups({ items, onNavigate }) {
  return groupNav(items).map((group, idx) => (
    <div className="dashboard-nav-group" key={group.section || idx}>
      {group.section && (
        <span className="dashboard-nav-section-label">{group.section}</span>
      )}

      {group.items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `dashboard-nav-link ${
              isActive
                ? "dashboard-nav-link-active"
                : "dashboard-nav-link-inactive"
            }`
          }
        >
          <item.icon className="dashboard-nav-icon" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </div>
  ));
}

export default function DashboardLayout({
  nav,
  title,
  breadcrumb,
  children,
  subscriptionGated = false,
  onSearch,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const notificationsRef = useRef(null);
  const { user, logout } = useAuth();

  const operatorOwnedDriver = isOperatorOwnedDriver(user);
  const subscriptionRequired = subscriptionGated && !operatorOwnedDriver;
  // Days left come from the backend's subscription expiry on the session user.
  const subscriptionExpiry = subscriptionRequired && user?.subscription_status === "active" ? user?.subscription_expires_at : null;
  const daysLeft = subscriptionExpiry
    ? Math.max(0, Math.ceil((new Date(subscriptionExpiry).getTime() - Date.now()) / 86400000))
    : null;
  const shouldShowProfileCompletion = supportsProfileCompletion(user);
  const profileCompletion = shouldShowProfileCompletion ? getProfileCompletion(user) : null;
  const profileNeedsAttention = shouldShowProfileCompletion && profileCompletion < 100;

  const notifications = useMemo(() => {
    const items = [];
    const role = user?.role;

    if ((role === "driver" || role === "operator") && !operatorOwnedDriver && user?.subscription_status !== "active") {
      const isExpired = user?.subscription_status === "expired";
      items.push({
        id: "subscription-status",
        title: isExpired ? "Subscription ended" : "Subscription required",
        text: isExpired
          ? "Your subscription has ended. Renew now to continue using the dashboard."
          : "Activate your subscription to unlock the full dashboard experience.",
        to: "/subscribe",
        tone: isExpired ? "danger" : "warning",
      });
    }

    if ((role === "driver" || role === "operator") && user?.verification_status) {
      const verificationStatus = user.verification_status;
      if (verificationStatus === "pending") {
        items.push({
          id: "verification-pending",
          title: "Verification in progress",
          text: "Your account is being reviewed by the team. You will be notified once it is approved.",
          to: "/onboarding/verification",
          tone: "info",
        });
      }

      if (verificationStatus === "rejected") {
        items.push({
          id: "verification-rejected",
          title: "Verification update",
          text: "Your last verification submission was rejected. Please update your documents and resubmit.",
          to: "/onboarding/verification",
          tone: "danger",
        });
      }

      if (verificationStatus === "suspended") {
        items.push({
          id: "verification-suspended",
          title: "Verification on hold",
          text: "Your account has been temporarily paused. Please contact support for the next steps.",
          to: "/onboarding/verification",
          tone: "warning",
        });
      }
    }

    if (profileNeedsAttention) {
      items.push({
        id: "profile-completion",
        title: "Profile needs attention",
        text: `Your profile is ${profileCompletion}% complete. Complete the remaining details to unlock better access.`,
        to: role === "driver" ? "/driver/profile" : role === "operator" ? "/operator/profile" : "/passenger/profile",
        tone: "info",
      });
    }

    return items;
  }, [operatorOwnedDriver, profileCompletion, profileNeedsAttention, user]);

  const initial = (user?.full_name || "U").trim()[0]?.toUpperCase();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setProfileMenuOpen(false);
      }

      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    onSearch?.(searchValue);
  };

  const handleLogout = () => {
    setProfileMenuOpen(false);
    logout();
  };

  return (
    <div className="dashboard-layout">
      {/* Desktop sidebar */}
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar-header">
          <Logo />
        </div>

        <nav className="dashboard-sidebar-nav">
          <NavGroups items={nav} />
        </nav>

        <div className="dashboard-sidebar-footer">
          <span className="dashboard-sidebar-status-dot" aria-hidden="true" />
          <span className="dashboard-sidebar-status-label">
            {user?.role || "Member"}
          </span>
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="dashboard-mobile-drawer">
          <div
            className="dashboard-drawer-overlay"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />

          <aside className="dashboard-drawer">
            <div className="dashboard-drawer-header">
              <Logo />

              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="dashboard-drawer-close"
                aria-label="Close menu"
              >
                <X />
              </button>
            </div>

            <nav className="dashboard-drawer-nav">
              <NavGroups items={nav} onNavigate={() => setDrawerOpen(false)} />
            </nav>

            <div className="dashboard-drawer-footer">
              <button
                type="button"
                onClick={logout}
                className="dashboard-logout-button"
              >
                <LogOut className="dashboard-nav-icon" />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="dashboard-main">
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <button
              type="button"
              className="dashboard-menu-button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <Menu />
            </button>

            <div className="dashboard-title-block">
              {breadcrumb && breadcrumb.length > 0 && (
                <span className="dashboard-breadcrumb">
                  {breadcrumb.join(" / ")}
                </span>
              )}
              <h1 className="dashboard-title">{title}</h1>
            </div>
          </div>

          <form className="dashboard-search" onSubmit={submitSearch}>
            <Search className="dashboard-search-icon" />
            <input
              type="text"
              className="dashboard-search-input"
              placeholder="Quick search..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </form>

          <div className="dashboard-header-right">
            <div className="dashboard-notifications" ref={notificationsRef}>
              <button
                type="button"
                className="dashboard-notification-button"
                aria-label="Notifications"
                onClick={() => setNotificationsOpen((open) => !open)}
              >
                <Bell />
                {notifications.length > 0 && (
                  <span className="dashboard-notification-count">{notifications.length}</span>
                )}
                <span
                  className="dashboard-notification-dot"
                  aria-hidden="true"
                  style={{ opacity: notifications.length > 0 ? 1 : 0 }}
                />
              </button>

              {notificationsOpen && (
                <div className="dashboard-notifications-dropdown">
                  <div className="dashboard-notifications-header">
                    <h3>Notifications</h3>
                    <span>{notifications.length}</span>
                  </div>

                  {notifications.length > 0 ? (
                    <div className="dashboard-notifications-list">
                      {notifications.map((notification) => (
                        <Link
                          key={notification.id}
                          to={notification.to}
                          className={`dashboard-notification-item dashboard-notification-item-${notification.tone}`}
                          onClick={() => setNotificationsOpen(false)}
                        >
                          <div className="dashboard-notification-item-icon" aria-hidden="true">
                            {notification.tone === "danger" ? "!" : notification.tone === "warning" ? "!" : "i"}
                          </div>
                          <div className="dashboard-notification-item-body">
                            <strong>{notification.title}</strong>
                            <span>{notification.text}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="dashboard-notifications-empty">
                      You’re all caught up.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="dashboard-profile-menu" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((open) => !open)}
                className="dashboard-profile-trigger"
                aria-label="Open profile menu"
                aria-expanded={profileMenuOpen}
              >
                {shouldShowProfileCompletion && profileCompletion !== null ? (
                  <span
                    className="dashboard-profile-visual"
                    style={{
                      "--profile-progress": `${Math.max(0, Math.min(100, profileCompletion))}%`,
                    }}
                  >
                    <span className="dashboard-profile-ring-label">{profileCompletion}%</span>
                  </span>
                ) : null}
                <span className="dashboard-profile-info">
                  <span className="dashboard-profile-name">
                    {user?.full_name || "User"}
                  </span>
                  <span className="dashboard-profile-role">
                    {user?.role || "Member"}
                  </span>
                </span>
              </button>

              {profileMenuOpen && (
                <div className="dashboard-profile-dropdown">
                  <Link
                    to="profile"
                    className="dashboard-profile-menu-item dashboard-profile-menu-item-with-badge"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <span>Profile</span>
                    {profileNeedsAttention && (
                      <span className="dashboard-profile-menu-pill">{profileCompletion}%</span>
                    )}
                  </Link>
                  <button
                    type="button"
                    className="dashboard-profile-menu-item dashboard-profile-menu-logout"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="dashboard-content">
          {subscriptionRequired && daysLeft !== null && daysLeft <= 7 && (
            <div
              className={`dashboard-subscription-banner ${
                daysLeft <= 3
                  ? "dashboard-subscription-danger"
                  : "dashboard-subscription-warning"
              }`}
            >
              <Clock className="dashboard-subscription-icon" />

              {daysLeft <= 3 ? (
                <span>
                  Your subscription expires in {daysLeft} day
                  {daysLeft === 1 ? "" : "s"}.{" "}
                  <Link to="/subscribe" className="dashboard-renew-link">
                    Renew now
                  </Link>
                </span>
              ) : (
                <span>{daysLeft} days left in your subscription.</span>
              )}
            </div>
          )}

          {/* {profileNeedsAttention && (
            <div className="dashboard-profile-banner">
              <AlertCircle className="dashboard-profile-banner-icon" />
              <span>
                Your profile is {profileCompletion}% complete. <Link to="/passenger/profile" className="dashboard-profile-banner-link">Complete it now</Link>
              </span>
            </div>
          )} */}

          {children}
        </main>
      </div>

      {/* Mobile bottom nav — first 5 items */}
      <nav className="dashboard-bottom-nav">
        {nav.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `dashboard-bottom-nav-link ${
                isActive
                  ? "dashboard-bottom-nav-link-active"
                  : "dashboard-bottom-nav-link-inactive"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`dashboard-bottom-nav-icon ${
                    isActive ? "dashboard-bottom-nav-icon-active" : ""
                  }`}
                />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Prevent content from being hidden behind mobile bottom navigation */}
      <div className="dashboard-mobile-bottom-spacer" />
    </div>
  );
}