import { Star } from "lucide-react";

export default function StarRating({ value = 5, size = "h-3.5 w-3.5" }) {
  return (
    <span className="inline-flex items-center gap-1 text-navy-700">
      <Star className={`${size} fill-yellow-500 text-yellow-500`} />
      <span className="text-sm font-semibold">{Number(value).toFixed(1)}</span>
    </span>
  );
}
