import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Menu,
  X,
  Car,
  Home,
  Info,
  ShieldCheck,
  Users,
  ChevronRight,
} from "lucide-react";

import "./PublicHeader.css";

const links = [
  { to: "/", label: "Home", icon: Home },
  { to: "/how-it-works", label: "How It Works", icon: Info },
  { to: "/safety", label: "Safety", icon: ShieldCheck },
  { to: "/about", label: "About", icon: Users },
];

export default function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };

    onScroll();

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <header
      className={`public-header ${
        scrolled ? "public-header-scrolled" : ""
      }`}
    >
      {/* Accent line */}
      <div className="public-header-accent" />

      {/* Main header */}
      <div
        className={`public-header-inner ${
          scrolled ? "public-header-inner-scrolled" : ""
        }`}
      >
        {/* Logo */}
        <Link
          to="/"
          onClick={() => setOpen(false)}
          className="public-header-logo"
          aria-label="ShareTaxi Home"
        >
          <div className="public-header-logo-mark">
            <Car
              size={22}
              strokeWidth={2.25}
              className="public-header-car-icon"
            />

            <span className="public-header-logo-dot" />
          </div>

          <div className="public-header-logo-text">
            <div className="public-header-brand-name">
              <span>Share</span>
              <span>Taxi</span>
            </div>

            <span className="public-header-tagline">
              Ride together
            </span>
          </div>
        </Link>

        {/* Desktop navigation */}
        <nav className="public-header-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `public-header-nav-link ${
                  isActive ? "public-header-nav-link-active" : ""
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="public-header-actions">
          <Link to="/login" className="public-header-login">
            Log in
          </Link>

          <Link to="/signup" className="public-header-signup">
            <span>Sign up</span>

            <ChevronRight
              size={16}
              strokeWidth={3}
              className="public-header-signup-icon"
            />
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="public-header-mobile-button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`public-header-mobile-menu ${
          open ? "public-header-mobile-menu-open" : ""
        }`}
      >
        <div className="public-header-mobile-inner">
          <nav className="public-header-mobile-nav">
            {links.map((link) => {
              const Icon = link.icon;

              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `public-header-mobile-link ${
                      isActive
                        ? "public-header-mobile-link-active"
                        : ""
                    }`
                  }
                >
                  {({ isActive }) => (
                    <span className="public-header-mobile-link-content">
                      <Icon
                        size={18}
                        strokeWidth={2.25}
                        className={
                          isActive
                            ? "public-header-mobile-icon-active"
                            : "public-header-mobile-icon"
                        }
                      />

                      <span>{link.label}</span>
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="public-header-mobile-actions">
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="public-header-mobile-login"
            >
              Log in
            </Link>

            <Link
              to="/signup"
              onClick={() => setOpen(false)}
              className="public-header-mobile-signup"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}