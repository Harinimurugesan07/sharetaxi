import { Phone, Mail, MapPin } from "lucide-react";
import Logo from "./Logo";
import appStoreImage from "../assets/app-store.jpg";
import googlePlayImage from "../assets/playstore.jpg";

import "./PublicFooter.css";

const FacebookIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.86c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94z" />
  </svg>
);

const InstagramIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const XIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.15 2h3.05l-6.66 7.61L22.5 22h-6.14l-4.81-6.3L5.98 22H2.93l7.12-8.14L2 2h6.29l4.35 5.76L18.15 2zm-1.07 18.17h1.69L7.02 3.73H5.2L17.08 20.17z" />
  </svg>
);

const YoutubeIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M23.5 7.2s-.23-1.64-.94-2.36c-.9-.94-1.9-.95-2.36-1C16.9 3.5 12 3.5 12 3.5h-.01s-4.9 0-8.2.34c-.46.05-1.46.06-2.36 1C.72 5.56.5 7.2.5 7.2S.26 9.12.26 11.05v1.72c0 1.93.24 3.85.24 3.85s.23 1.64.93 2.36c.9.95 2.08.92 2.6 1.02 1.9.18 8.07.34 8.07.34s4.9-.01 8.2-.35c.46-.05 1.46-.06 2.36-1 .7-.72.94-2.36.94-2.36s.24-1.92.24-3.85v-1.72c0-1.93-.24-3.85-.24-3.85zM9.7 14.9V8.6l6.4 3.16-6.4 3.14z" />
  </svg>
);

const socialLinks = [
  { label: "Facebook", Icon: FacebookIcon },
  { label: "Instagram", Icon: InstagramIcon },
  { label: "Twitter / X", Icon: XIcon },
  { label: "YouTube", Icon: YoutubeIcon },
];

export default function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="public-footer-container">
        <div className="public-footer-grid">
          {/* Brand */}
          <div className="public-footer-brand">
            <Logo dark />

            <p className="public-footer-description">
              Share your ride. Share your journey. Affordable, verified
              shared taxi travel.
            </p>

            <div className="public-footer-socials">
              {socialLinks.map(({ label, Icon }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="public-footer-social"
                >
                  <Icon className="public-footer-social-icon" />
                </a>
              ))}
            </div>
          </div>

          {/* Company */}
          <div className="public-footer-column">
            <p className="public-footer-title">Company</p>
            <ul className="public-footer-links">
              <li>About</li>
              <li>Safety</li>
              <li>Careers</li>
            </ul>
          </div>

          {/* Product */}
          <div className="public-footer-column">
            <p className="public-footer-title">Product</p>
            <ul className="public-footer-links">
              <li>Book a Ride</li>
              <li>Become a Driver</li>
              <li>How It Works</li>
            </ul>
          </div>

          {/* Support */}
          <div className="public-footer-column">
            <p className="public-footer-title">Support</p>
            <ul className="public-footer-links">
              <li>Help Center</li>
              <li>Contact Us</li>
              <li>Terms &amp; Privacy</li>
            </ul>

            <ul className="public-footer-contact">
              <li>
                <Phone size={14} />
                <span>+91 00000 00000</span>
              </li>
              <li>
                <Mail size={14} />
                <span>support@sharetaxi.app</span>
              </li>
            </ul>
          </div>

          {/* Download */}
          <div className="public-footer-download">
            <p className="public-footer-title">Get the app</p>
            <div className="public-footer-stores">
              <a href="#" className="public-store-button" aria-label="Google Play">
                <img src={googlePlayImage} alt="Google Play" className="public-store-image" />
              </a>
              <a href="#" className="public-store-button" aria-label="App Store">
                <img src={appStoreImage} alt="App Store" className="public-store-image" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="public-footer-bottom">
          <p>
            © {new Date().getFullYear()} ShareTaxi. All rights reserved.
            <br />
            SDL Creative Groups &amp; Private Limited
          </p>

          <p className="public-footer-location">
            <MapPin size={14} />
            <span>Available across 10+ cities in India</span>
          </p>
        </div>
      </div>
    </footer>
  );
}