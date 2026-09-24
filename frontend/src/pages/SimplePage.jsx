import PublicHeader from "../components/PublicHeader";
import PublicFooter from "../components/PublicFooter";
import Card from "../components/Card";
import "./PublicPages.css";

export function HowItWorks() {
  const steps = [
    { title: "Search your route", desc: "Enter pickup, drop, date and time. We match you with drivers heading the same way." },
    { title: "Pick a shared ride", desc: "Compare drivers, ratings, vehicle and fare per seat, then book instantly." },
    { title: "Pay securely", desc: "Confirm your seats and pay online. Your booking is locked in immediately." },
    { title: "Track & ride", desc: "Follow your driver live on the map from pickup to drop-off." },
  ];
  return (
    <div className="public-page">
      <PublicHeader />
      <div className="public-page-container">
        <h1 className="public-page-title">How ShareTaxi Works</h1>
        <p className="public-page-subtitle">Four simple steps between you and a cheaper, safer ride.</p>
        <div className="howitworks-grid">
          {steps.map((s, i) => (
            <Card key={s.title} className="howitworks-card">
              <span className="howitworks-number">
                {i + 1}
              </span>
              <div>
                <p className="howitworks-card-title">{s.title}</p>
                <p className="howitworks-card-desc">{s.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}

export function Safety() {
  const points = [
    "Every driver's license is verified before they can drive on ShareTaxi.",
    "Every vehicle's registration and insurance is checked by our admin team.",
    "Live location sharing lets a trusted contact follow your trip in real time.",
    "In-app call and message keep your phone number private from your driver.",
    "Ratings after every ride keep drivers and passengers accountable.",
  ];
  return (
    <div className="public-page">
      <PublicHeader />
      <div className="public-page-container">
        <h1 className="public-page-title">Safety at ShareTaxi</h1>
        <p className="public-page-subtitle">Verified people, tracked trips, and a support team that's always reachable.</p>
        <Card className="safety-card">
          {points.map((p) => (
            <div key={p} className="safety-item">{p}</div>
          ))}
        </Card>
      </div>
      <PublicFooter />
    </div>
  );
}

export function About() {
  return (
    <div className="public-page">
      <PublicHeader />
      <div className="public-page-container">
        <h1 className="public-page-title">About ShareTaxi</h1>
        <p className="about-text">
          ShareTaxi exists to make everyday travel affordable without giving up safety or
          convenience. We connect passengers heading the same direction with verified drivers,
          so every trip splits the cost, cuts the number of cars on the road, and gets everyone
          there on time.
        </p>
        <p className="about-text">
          What started as a handful of shared commutes has grown into a platform used across
          dozens of cities — but the goal hasn't changed: share the ride, share the journey.
        </p>
      </div>
      <PublicFooter />
    </div>
  );
}