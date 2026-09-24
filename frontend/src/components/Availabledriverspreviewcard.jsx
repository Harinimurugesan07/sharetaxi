import { useEffect, useState } from "react";
import { Car, Star, ChevronRight } from "lucide-react";
import Card from "../components/Card";
import { listAvailableDrivers } from "../api/driver";

function RowSkeleton() {
  return (
    <div className="flex items-center gap-2.5 py-2">
      <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-navy-100" />
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 w-2/3 animate-pulse rounded bg-navy-100" />
        <div className="h-2 w-1/3 animate-pulse rounded bg-navy-100" />
      </div>
    </div>
  );
}

/**
 * Compact preview card for the hero — pick an area from a dropdown (limited
 * to your known `cities`) and see a few online drivers there. Pairs with
 * <AvailableDriversSidebar /> which has the full free-text search list
 * further down the page (id="available-drivers").
 */
export default function AvailableDriversPreviewCard({ cities = [], defaultCity, className = "" }) {
  const [citySel, setCitySel] = useState(defaultCity || cities[0] || "");
  const [drivers, setDrivers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    listAvailableDrivers({ city: citySel || undefined, limit: 3 })
      .then((res) => {
        if (!active) return;
        const data = res?.data ?? res;
        setDrivers(data?.drivers ?? []);
        setTotal(data?.total ?? (data?.drivers ?? []).length);
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [citySel]);

  return (
    <Card className={`overflow-hidden p-0 ${className}`}>
      <div className="flex items-center justify-between gap-3 bg-navy-800 px-5 py-3">
        <span className="text-sm font-bold text-white">Available Drivers</span>
        <select
          value={citySel}
          onChange={(e) => setCitySel(e.target.value)}
          className="rounded-lg border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white outline-none focus:border-yellow-500"
        >
          {cities.length === 0 && <option value="">All areas</option>}
          {cities.map((c) => <option key={c} value={c} className="text-navy-800">{c}</option>)}
        </select>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="divide-y divide-navy-100">
            {[...Array(3)].map((_, i) => <RowSkeleton key={i} />)}
          </div>
        ) : error ? (
          <p className="py-3 text-center text-xs text-navy-400">Couldn't load drivers right now.</p>
        ) : drivers.length === 0 ? (
          <p className="py-3 text-center text-xs text-navy-400">
            No drivers online{citySel ? ` in ${citySel}` : ""} right now.
          </p>
        ) : (
          <div className="divide-y divide-navy-100">
            {drivers.map((d) => (
              <div key={d.id} className="flex items-center gap-2.5 py-2.5">
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-100">
                  <Car className="h-3.5 w-3.5 text-navy-700" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-success-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-navy-800">
                    {d.name || `Driver in ${d.city}`}
                  </p>
                  <p className="truncate text-[11px] text-navy-400">{d.total_trips} trips</p>
                </div>
                <div className="flex shrink-0 items-center gap-0.5 text-xs font-bold text-navy-800">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" /> {d.average_rating ?? "—"}
                </div>
              </div>
            ))}
          </div>
        )}

        <a
          href="#available-drivers"
          className="mt-3 flex items-center justify-center gap-1 rounded-lg bg-bg py-2 text-xs font-bold text-navy-700 transition-colors hover:bg-yellow-100"
        >
          {total > drivers.length ? `See all ${total} drivers` : "See all drivers"} <ChevronRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </Card>
  );
}