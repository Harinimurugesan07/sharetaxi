import { Link } from "react-router-dom";
import Button from "../components/Button";
import Logo from "../components/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-4 text-center">
      <Logo />
      <p className="text-5xl font-extrabold text-navy-800">404</p>
      <p className="text-navy-400">This page took a wrong turn. Let's get you back on route.</p>
      <Button as={Link} to="/">Back to Home</Button>
    </div>
  );
}
