import "./Landing.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  PiggyBank,
  ShieldCheck,
  MapPin,
  Smartphone,
  ArrowRight,
  Star,
  Car,
  Users,
  CheckCircle2,
  ChevronDown,
  Quote,
  Route as RouteIcon,
  Clock,
  Play,
  Search,
  Calendar,
  UserRound,
  Mail,
  Send,
  Headset,
  BadgeCheck,
} from "lucide-react";

import PublicHeader from "../components/PublicHeader";
import PublicFooter from "../components/PublicFooter";
import Button from "../components/Button";
import Card from "../components/Card";
import { fetchBlogs } from "../api/blogApi";
import { availableTrips } from "../api/trips";

import appPreviewImage from "../assets/app-screen.png";
import appStoreImage from "../assets/app-store.jpg";
import googlePlayImage from "../assets/playstore.jpg";
import vintageTaxiImage from "../assets/vintage-taxi.jpg";

import blogDelhiImage from "../assets/blog-delhi.jpg";
import blogTradeShowImage from "../assets/blog-tradeshow.jpg";
import blogGoaImage from "../assets/blog-goa.jpg";

const features = [
  {
    icon: PiggyBank,
    title: "Save Money",
    desc: "Split the fare with fellow passengers heading your way and pay a fraction of a solo cab.",
  },
  {
    icon: ShieldCheck,
    title: "Safe & Reliable",
    desc: "Every driver and vehicle is document-verified before they can accept a single ride.",
  },
  {
    icon: MapPin,
    title: "Real-time Tracking",
    desc: "Watch your driver approach on a live map from pickup to drop, every step of the way.",
  },
  {
    icon: Smartphone,
    title: "Easy Booking",
    desc: "Search, match, and book a shared seat in under a minute — no back and forth.",
  },
];

const cities = [
  "Chennai",
  "Coimbatore",
  "Erode",
  "Madurai",
  "Salem",
  "Trichy",
  "Bengaluru",
  "Hyderabad",
  "Kochi",
  "Pune",
];

const fallbackBlogImages = [blogDelhiImage, blogTradeShowImage, blogGoaImage];

// Abstract route-network nodes for the map visual (illustrative positions, not to scale)
const networkNodes = [
  { name: "Chennai", x: 78, y: 62 },
  { name: "Bengaluru", x: 52, y: 58 },
  { name: "Coimbatore", x: 40, y: 72 },
  { name: "Erode", x: 45, y: 66 },
  { name: "Hyderabad", x: 58, y: 30 },
  { name: "Madurai", x: 48, y: 88 },
];
const networkEdges = [[0, 1], [1, 2], [2, 3], [1, 4], [3, 5], [0, 4]];

const testimonials = [
  { name: "Priya S.", city: "Coimbatore", quote: "Cut my daily commute cost in half and the tracking made me feel safe riding alone at night.", rating: 5 },
  { name: "Arun K.", city: "Chennai", quote: "Booking takes seconds now. I just tell it where I'm going and it finds someone on the same route.", rating: 5 },
  { name: "Meena R.", city: "Erode", quote: "As a driver, filling empty seats on my regular route has genuinely added to my monthly income.", rating: 4 },
];

const faqs = [
  { q: "How is the fare split decided?", a: "Fares are calculated per seat based on distance, so you only pay for the portion of the route you actually travel." },
  { q: "Is it safe to share a ride with strangers?", a: "Every driver and vehicle goes through document verification, and live location sharing is available for the full trip." },
  { q: "Can I become a driver with my own car?", a: "Yes — sign up as a driver, complete verification, and start listing your regular routes to fill empty seats." },
  { q: "Which cities is ShareTaxi available in?", a: "We're live in 10+ cities and expanding steadily — check the app for coverage in your area." },
];

// Small top utility strip, mirrors the thin apromo bar pattern from the reference design
const topBarItems = [
  { icon: BadgeCheck, label: "Verified drivers only" },
  { icon: MapPin, label: "Live GPS tracking" },
  { icon: ShieldCheck, label: "Secure in-app payments" },
  { icon: Headset, label: "24/7 rider support" },
];

// function useLiveStats() {
//   const [stats, setStats] = useState(null);
//   const [error, setError] = useState(false);
//   useEffect(() => {
//     let active = true;
//     fetch("/api/stats/summary")
//       .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
//       .then((data) => active && setStats(data))
//       .catch(() => active && setError(true));
//     return () => { active = false; };
//   }, []);
//   return { stats, error };
// }

function StatSkeleton() {
  return (
    <div className="landing-stat-skeleton">
      <div className="landing-stat-skeleton-number" />
      <div className="landing-stat-skeleton-label" />
    </div>
  );
}

// A more literal yellow-cab illustration — checkered livery, roof light, glass and
// hubcaps — instead of the earlier abstract blocky shape.
function TaxiIllustration() {
  return (
    <svg viewBox="0 0 480 320" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="checker" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(0)">
          <rect width="16" height="16" fill="#0B183F" />
          <rect width="8" height="8" fill="#FFC928" />
          <rect x="8" y="8" width="8" height="8" fill="#FFC928" />
        </pattern>
        <linearGradient id="bodyFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFD23F" />
          <stop offset="100%" stopColor="#F0B400" />
        </linearGradient>
      </defs>

      {/* road + shadow */}
      <rect x="0" y="270" width="480" height="4" fill="#0B183F" opacity="0.08" />
      <ellipse cx="240" cy="292" rx="170" ry="14" fill="#0B183F" opacity="0.1" />

      {/* route line the cab is driving along */}
      <path
        d="M20 250 C 120 210, 170 260, 240 220 S 380 150, 460 120"
        fill="none" stroke="#0B183F" strokeOpacity="0.2" strokeWidth="3"
        strokeDasharray="9 9" className="route-line"
      />

      {/* rear-view mirror + antenna */}
      <rect x="118" y="118" width="6" height="16" rx="2" fill="#0B183F" />
      <rect x="352" y="118" width="6" height="16" rx="2" fill="#0B183F" />

      {/* cab body */}
      <g>
        <path
          d="M96 236 C90 236 86 231 86 225 L86 205 C86 197 92 191 100 189 L128 182 L150 146 C156 136 167 130 179 130 L301 130 C313 130 324 136 330 146 L352 182 L380 189 C388 191 394 197 394 205 L394 225 C394 231 390 236 384 236 Z"
          fill="url(#bodyFill)" stroke="#0B183F" strokeWidth="3"
        />
        {/* checkered livery band */}
        <rect x="86" y="205" width="308" height="14" fill="url(#checker)" />
        {/* windows */}
        <path d="M168 186 L184 152 C187 146 193 142 199 142 L281 142 C287 142 293 146 296 152 L312 186 Z" fill="#DDEBFF" opacity="0.9" />
        <line x1="240" y1="142" x2="240" y2="186" stroke="#0B183F" strokeWidth="3" />
        {/* roof light */}
        <rect x="212" y="118" width="56" height="16" rx="4" fill="#0B183F" />
        <rect x="220" y="121" width="40" height="10" rx="2" fill="#FFC928" />
        {/* door handle + line */}
        <line x1="240" y1="189" x2="240" y2="234" stroke="#0B183F" strokeWidth="2" opacity="0.4" />
        <rect x="196" y="206" width="14" height="4" rx="2" fill="#0B183F" opacity="0.6" />
        <rect x="278" y="206" width="14" height="4" rx="2" fill="#0B183F" opacity="0.6" />
        {/* headlight / taillight */}
        <rect x="88" y="214" width="10" height="8" rx="2" fill="#FFF3C4" />
        <rect x="382" y="214" width="10" height="8" rx="2" fill="#500d80" opacity="0.6" />
        {/* bumper */}
        <rect x="82" y="230" width="316" height="10" rx="5" fill="#0B183F" />
      </g>

      {/* wheels */}
      <g>
        <circle cx="150" cy="240" r="26" fill="#0B183F" />
        <circle cx="150" cy="240" r="11" fill="#E7EEFF" />
        <circle cx="150" cy="240" r="4" fill="#0B183F" />
        <circle cx="330" cy="240" r="26" fill="#0B183F" />
        <circle cx="330" cy="240" r="11" fill="#E7EEFF" />
        <circle cx="330" cy="240" r="4" fill="#0B183F" />
      </g>

      {/* floating pickup/drop pins */}
      <g className="animate-float-slow">
        <path d="M60 96c-9.9 0-18 8.1-18 18 0 13.5 18 34 18 34s18-20.5 18-34c0-9.9-8.1-18-18-18z" fill="#C42E2E" />
        <circle cx="60" cy="114" r="7" fill="#fff" />
      </g>
      <g className="animate-float-slow" style={{ animationDelay: "1.2s" }}>
        <path d="M420 60c-8.3 0-15 6.7-15 15 0 11.3 15 28.5 15 28.5s15-17.2 15-28.5c0-8.3-6.7-15-15-15z" fill="#FFC928" />
        <circle cx="420" cy="75" r="6" fill="#0B183F" />
      </g>
    </svg>
  );
}

// Small square phone mockup used in the "See It In Action" grid
function PhoneMock({ label, image, children }) {
  return (
    <div className="landing-phone-mock">
      <div className="landing-phone-mock-device">

        <div className="landing-phone-mock-speaker" />

        {image ? (
          <img
            src={image}
            alt={label}
            className="landing-phone-mock-image"
          />
        ) : (
          <div className="landing-phone-mock-content">
            {children}
          </div>
        )}

      </div>

      <p className="landing-phone-mock-label">
        {label}
      </p>
    </div>
  );
}

// Realistic large phone frame (notch + side buttons) used in the "Get the App" band
function PhoneFrame({ image, alt }) {
  return (
    <div className="landing-phone-frame">
      {/* Phone side buttons */}
      <div className="landing-phone-side-button landing-phone-volume-1" />
      <div className="landing-phone-side-button landing-phone-volume-2" />
      <div className="landing-phone-side-button landing-phone-power" />

      <div className="landing-phone-device">
        {/* Phone notch */}
        <div className="landing-phone-notch" />

        <div className="landing-phone-image-container">
          <img
            src={image}
            alt={alt}
            className="landing-phone-preview-image"
          />
        </div>
      </div>
    </div>
  );
}

// Initials avatar used in the testimonial cards (no stock photos, driven by real names)
function InitialsAvatar({ name }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");

  return (
    <div className="landing-initials-avatar">
      {initials}
    </div>
  );
}

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(0);
  const [landingBlogs, setLandingBlogs] = useState([]);
  const [popularRoutes, setPopularRoutes] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let active = true;

    async function loadLandingBlogs() {
      try {
        const response = await fetchBlogs({ status: "published", page: 1 });
        if (!active) return;

        const blogs = (response.items || []).map((blog, index) => ({
          ...blog,
          image: blog.coverImage || fallbackBlogImages[index % fallbackBlogImages.length],
          date:
            blog.publishedAt || blog.createdAt
              ? new Date(blog.publishedAt || blog.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Recently",
        }));

        setLandingBlogs(blogs);
      } catch (error) {
        console.error("Failed to load landing blogs", error);
        if (active) {
          setLandingBlogs([]);
        }
      }
    }

    loadLandingBlogs();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadPopularRoutes() {
      try {
        const trips = await availableTrips();
        if (!active) return;

        const routeMap = new Map();

        (Array.isArray(trips) ? trips : []).forEach((trip) => {
          const from = trip.origin_name || "Unknown";
          const to = trip.destination_name || "Destination";
          const key = `${from}::${to}`;

          const current = routeMap.get(key) || {
            from,
            to,
            count: 0,
            fare: 0,
            seats: 0,
          };

          current.count += 1;
          current.fare = Math.max(current.fare, Number(trip.fare_per_seat || 0));
          current.seats = Math.max(current.seats, Number(trip.available_seats || 0));
          routeMap.set(key, current);
        });

        const routes = [...routeMap.values()]
          .sort((a, b) => b.count - a.count)
          .slice(0, 4)
          .map((route) => ({
            from: route.from,
            to: route.to,
            fare: `₹${Number(route.fare || 0).toFixed(0)}`,
            time: `${Math.max(1, route.seats || 1)} seats left`,
          }));

        setPopularRoutes(routes);
      } catch (error) {
        console.error("Failed to load popular routes", error);
        if (active) {
          setPopularRoutes([]);
        }
      }
    }

    loadPopularRoutes();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!location.hash) return;

    const target = document.getElementById(location.hash.replace("#", ""));
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  }, [location.hash]);

  // Floating hero search widget — no backend search route exists yet, so submitting
  // routes into the existing signup flow rather than a fake results page.
  const [search, setSearch] = useState({ from: "", to: "", date: "", seats: "1" });
  const handleSearch = (e) => {
    e.preventDefault();
    navigate("/signup");
  };

  // Newsletter box — local-only confirmation, no email service wired up yet.
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
  };

  return (
    <div className="landing-page">
     

      {/* Top utility strip */}
      <div className="landing-topbar">
  <div className="landing-topbar-container">
    {topBarItems.map((item) => (
      <span key={item.label} className="landing-topbar-item">
        <item.icon className="landing-topbar-icon" />
        {item.label}
      </span>
    ))}
  </div>
</div>

      <PublicHeader />

     <section
  className="landing-hero"
  style={{
    backgroundImage: `url(${vintageTaxiImage})`,
  }}
>
  <div className="landing-hero-overlay" />

  <div className="landing-hero-glow" />

  <div className="landing-hero-container">
    <div className="landing-hero-content">

      <span className="landing-hero-badge">
        <Car className="landing-badge-icon" />
        Now live across {cities.length}+ cities
      </span>

      <h1 className="landing-hero-title">
        Share Your Ride,
        <br />
        <span>Split the Fare</span>
      </h1>

      <p className="landing-hero-description">
        ShareTaxi connects you with verified drivers and fellow passengers
        travelling your route — so every trip costs less and feels safer.
      </p>

      <div className="landing-hero-actions">
        <Button
          as={Link}
          to="/signup"
          size="lg"
          className="landing-primary-button"
        >
          Get Started
          <ArrowRight size={18} />
        </Button>

        <Button
          as={Link}
          to="/signup?role=driver"
          variant="outline"
          size="lg"
          className="landing-driver-button"
        >
          Become a Driver
        </Button>
      </div>

      <div className="landing-trust-section">

        <div className="landing-avatars">
          {["PS", "AK", "MR", "+"].map((label) => (
            <div key={label} className="landing-avatar">
              {label}
            </div>
          ))}
        </div>

        <div className="landing-rating">
          <div className="landing-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="landing-star"
                fill="currentColor"
              />
            ))}
          </div>

          <p>
            Trusted by riders and drivers across {cities.length}+ cities
          </p>
        </div>

      </div>

      <div className="landing-benefits">

        <span className="landing-benefit">
          <ShieldCheck size={18} />
          Verified Drivers
        </span>

        <span className="landing-benefit">
          <MapPin size={18} />
          Live Tracking
        </span>

        <span className="landing-benefit">
          <PiggyBank size={18} />
          Split Fare
        </span>

      </div>

    </div>
  </div>

  <div className="landing-city-bar">
    <div className="landing-city-marquee">
      {[...cities, ...cities].map((city, i) => (
        <span
          key={`${city}-${i}`}
          className="landing-city-item"
        >
          <MapPin size={16} />
          {city}
        </span>
      ))}
    </div>
  </div>
</section>

      
      {/* Why ShareTaxi */}
<section className="landing-features-section">
  <div className="landing-container">

    <div className="landing-section-heading fade-in-section">
      <span className="landing-section-label">
        Why choose us
      </span>

      <h2>Why ShareTaxi?</h2>

      <p>
        Built around one idea — getting where you're going should
        cost less and feel safer.
      </p>
    </div>

    <div className="landing-features-grid">
      {features.map((feature, index) => (
        <Card
          key={feature.title}
          className="landing-feature-card fade-in-section"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="landing-feature-icon">
            <feature.icon />
          </div>

          <h3>{feature.title}</h3>

          <p>{feature.desc}</p>
        </Card>
      ))}
    </div>

  </div>
</section>

      {/* Popular routes — photo-style cards to match the destination-card treatment */}
      {/* Popular Routes */}
<section className="landing-routes-section">

  <div className="landing-container">

    <div className="landing-routes-header fade-in-section">

      <div>
        <span className="landing-section-label">
          Travel together
        </span>

        <h2>Popular Routes</h2>

        <p>
          Frequently shared routes with fellow passengers.
        </p>
      </div>

      <Link
        to="/signup"
        className="landing-view-routes"
      >
        View all routes
        <ArrowRight />
      </Link>

    </div>

    <div className="landing-routes-grid">
      {popularRoutes.length > 0 ? (
        popularRoutes.map((route, index) => (
          <Card
            key={`${route.from}-${route.to}`}
            className="landing-route-card fade-in-section"
            style={{
              animationDelay: `${index * 0.1}s`,
            }}
          >
            <div className="landing-route-image">
              <RouteIcon className="landing-route-icon" />
              <span className="landing-popular-badge">Popular</span>
            </div>

            <div className="landing-route-content">
              <h3>
                {route.from}
                <span>→</span>
                {route.to}
              </h3>

              <div className="landing-route-details">
                <span className="landing-route-time">
                  <Clock />
                  {route.time}
                </span>

                <strong>From {route.fare}</strong>
              </div>
            </div>
          </Card>
        ))
      ) : (
        <div className="landing-routes-empty">No live routes available right now.</div>
      )}
    </div>

  </div>

</section>

      {/* Latest Blogs */}
           {/* Latest Blogs */}
      <section id="blog" className="landing-blogs-section">
        <div className="landing-container">

          <div className="landing-section-heading fade-in-section">
            <span className="landing-section-label">From the blog</span>
            <h2>Latest Blogs</h2>
            <p>Tips, stories, and updates from the ShareTaxi community.</p>
          </div>

        </div>

        <div className="landing-blogs-marquee">
          <div className="landing-blogs-track">
            {landingBlogs.length > 0 ? (
              [...landingBlogs, ...landingBlogs].map((post, index) => (
                <Link
                  to={`/blog/${post.slug}`}
                  key={`${post.slug}-${index}`}
                  className="landing-blog-card"
                >
                  <div className="landing-blog-image">
                    <img src={post.image} alt={post.title} />
                  </div>

                  <div className="landing-blog-content">
                    <span className="landing-blog-date">
                      <Calendar size={13} />
                      {post.date}
                    </span>

                    <h3>{post.title}</h3>
                    <p>{post.excerpt}</p>

                    <span className="landing-blog-readmore">
                      Read More
                      <ArrowRight size={16} />
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="landing-blogs-empty">No published blogs yet.</div>
            )}
          </div>
        </div>
      </section>
     


      {/* Passenger vs Driver */}
      {/* Passenger vs Driver */}
<section className="landing-role-section">

  <div className="landing-container">

    <div className="landing-role-heading fade-in-section">

      <span className="landing-role-label">
        Choose your journey
      </span>

      <h2>Ride With Us, Your Way</h2>

      <p>
        Whether you're looking for an affordable ride or want to earn
        from your journeys, ShareTaxi has a place for you.
      </p>

    </div>

    <div className="landing-role-grid">

      {/* Passenger */}
      <Card className="landing-role-card fade-in-section">

        <div className="landing-role-icon">
          <Users />
        </div>

        <h3>For Passengers</h3>

        <p className="landing-role-description">
          Find affordable shared rides and travel comfortably.
        </p>

        <ul className="landing-role-list">

          <li>
            <CheckCircle2 />
            <span>Pay only for your share of the ride</span>
          </li>

          <li>
            <CheckCircle2 />
            <span>Verified drivers and live tracking</span>
          </li>

          <li>
            <CheckCircle2 />
            <span>Match with riders on your route</span>
          </li>

        </ul>

        <Button
          as={Link}
          to="/signup"
          className="landing-role-button"
        >
          Get Started
          <ArrowRight />
        </Button>

      </Card>

      {/* Driver */}
      <Card
        className="landing-role-card landing-driver-card fade-in-section"
        style={{ animationDelay: "0.1s" }}
      >

        <div className="landing-role-icon">
          <Car />
        </div>

        <h3>For Drivers</h3>

        <p className="landing-role-description">
          Turn your regular journeys into earning opportunities.
        </p>

        <ul className="landing-role-list">

          <li>
            <CheckCircle2 />
            <span>Fill empty seats on routes you already drive</span>
          </li>

          <li>
            <CheckCircle2 />
            <span>Set your own trips and schedule</span>
          </li>

          <li>
            <CheckCircle2 />
            <span>Earn extra on every drive</span>
          </li>

        </ul>

        <Button
          as={Link}
          to="/signup?role=driver"
          variant="secondary"
          className="landing-role-button"
        >
          Become a Driver
          <ArrowRight />
        </Button>

      </Card>

    </div>

  </div>

</section>

     {/* Get the App — big phone frame band. Left untouched, as requested. */}
<section className="landing-app-section">
  <div className="landing-app-pattern" aria-hidden="true" />
  <div className="landing-app-grid">
    <div className="landing-app-content fade-in-section">
      <span className="landing-app-label">GET THE APP</span>
      <h2>
        Share your ride
        <br />
        with the ShareTaxi app
      </h2>
      <p>
        Track your driver in real time, save your favourite routes, unlock app-only fares,
        and rebook a shared ride in a single tap.
      </p>
      <div className="landing-app-buttons">
        <a href="#" className="landing-store-button landing-store-button-image" aria-label="Google Play">
          <img src={googlePlayImage} alt="Google Play" className="landing-store-image" />
        </a>
        <a href="#" className="landing-store-button landing-store-button-image" aria-label="App Store">
          <img src={appStoreImage} alt="App Store" className="landing-store-image" />
        </a>
      </div>
    </div>

    <div className="landing-app-phone fade-in-section" style={{ animationDelay: "0.15s" }}>
      <PhoneFrame image={appPreviewImage} alt="ShareTaxi app preview" />
    </div>
  </div>
</section>

   
     {/* Testimonials */}
<section className="landing-testimonials-section">

  <div className="landing-container">

    <div className="landing-section-heading fade-in-section">

      <span className="landing-section-label">
        Testimonials
      </span>

      <h2>What Riders Say</h2>

      <p>
        Real experiences from passengers and drivers using ShareTaxi.
      </p>

    </div>

    <div className="landing-testimonials-grid">

      {testimonials.map((t, i) => (
        <Card class="app-card-testi"
          key={t.name}
          className="landing-testimonial-card fade-in-section"
          style={{
            animationDelay: `${i * 0.1}s`,
          }}
        >

          <Quote className="landing-testimonial-quote" />

          <p className="landing-testimonial-text">
            {t.quote}
          </p>

          <div className="landing-testimonial-footer">

            <div className="landing-testimonial-user">

              <InitialsAvatar name={t.name} />

              <div>
                <strong>{t.name}</strong>
                <span>{t.city}</span>
              </div>

            </div>

            <div className="landing-testimonial-stars">
              {[...Array(t.rating)].map((_, j) => (
                <Star
                  key={j}
                  fill="currentColor"
                />
              ))}
            </div>

          </div>

        </Card>
      ))}

    </div>

  </div>

</section>

      {/* Newsletter / Ride Alerts */}
<section className="landing-newsletter-section">

  <div className="landing-container">

    <div className="landing-newsletter-card fade-in-section">

      <div className="landing-newsletter-content">

        <span className="landing-newsletter-label">
          Stay Updated
        </span>

        <h3>
          Get Ride Alerts & Fare Drops
        </h3>

        <p>
          Be the first to know when a new route opens near you or
          fares drop on your usual trip.
        </p>

        {subscribed ? (

          <div className="landing-subscribe-success">
            <CheckCircle2 />
            <span>
              You're on the list — thanks!
            </span>
          </div>

        ) : (

          <form
            onSubmit={handleSubscribe}
            className="landing-newsletter-form"
          >

            <label className="landing-email-input">

              <Mail />

              <input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

            </label>

            <Button
              type="submit"
              className="landing-subscribe-button"
            >
              <Send />
              Subscribe
            </Button>

          </form>

        )}

      </div>

      <div className="landing-newsletter-icon">
        <Car />
      </div>

    </div>

  </div>

</section>

      

     {/* FAQ */}


           <PublicFooter />

      <div className="landing-legal-bar">
        <div className="landing-legal-container">
          <p>© {new Date().getFullYear()} ShareTaxi. All rights reserved.</p>

          <nav className="landing-legal-links">
            <a href="/terms">Terms &amp; Conditions</a>
            <span className="landing-legal-divider" aria-hidden="true" />
            <a href="/privacy">Privacy Policy</a>
            <span className="landing-legal-divider" aria-hidden="true" />
            <a href="/cookies">Cookie Policy</a>
          </nav>
        </div>
      </div>
    </div>
  );
}
