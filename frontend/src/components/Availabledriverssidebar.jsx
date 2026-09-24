import { useEffect, useState } from "react";
import { Car, MapPin, Star, RefreshCcw, Search, X } from "lucide-react";
import Card from "../components/Card";
import { listAvailableDrivers } from "../api/driver";

function DriverRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-navy-100" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-2/3 animate-pulse rounded bg-navy-100" />
        <div className="h-2.5 w-1/3 animate-pulse rounded bg-navy-100" />
      </div>
    </div>
  );
}

export default function AvailableDriversSidebar({ city, cities = [], className = "" }) {
  const [citySel, setCitySel] = useState(city || "");
  const [debouncedCity, setDebouncedCity] = useState(city || "");
  const [drivers, setDrivers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Keep the search box in sync if the parent's selected drop city changes
  // (e.g. the hero search bar), but the user can still type over it freely.
  useEffect(() => {
    setCitySel(city || "");
  }, [city]);

  // Debounce free-text typing so we're not firing a request on every keystroke —
  // this is what lets someone type "Thanjavur" or "Trichy" and search any area,
  // not just the fixed city list.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedCity(citySel.trim()), 400);
    return () => clearTimeout(t);
  }, [citySel]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    listAvailableDrivers({ city: debouncedCity || undefined, limit: 15 })
      .then((res) => {
        if (!active) return;
        const data = res?.data ?? res;
        setDrivers(data?.drivers ?? []);
        setTotal(data?.total ?? (data?.drivers ?? []).length);
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [debouncedCity]);

  return (
    <Card className={`flex max-h-[560px] flex-col overflow-hidden p-0 lg:sticky lg:top-24 ${className}`}>
      <div className="flex items-center justify-between gap-2 border-b border-navy-100 bg-navy-800 px-4 py-3.5">
        <div>
          <p className="text-sm font-bold text-white">Available Drivers</p>
          <p className="text-xs text-navy-200">{loading ? "Checking who's online…" : `${total} online${debouncedCity ? ` in ${debouncedCity}` : ""}`}</p>
        </div>
        <button
          type="button"
          onClick={() => setDebouncedCity((c) => c)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label="Refresh"
        >
          <RefreshCcw className="h-4 w-4" />
        </button>
      </div>

      <div className="border-b border-navy-100 px-4 py-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <input
            type="text"
            value={citySel}
            onChange={(e) => setCitySel(e.target.value)}
            placeholder="Search any area — Thanjavur, Trichy…"
            list="driver-area-suggestions"
            className="w-full rounded-lg border border-navy-100 bg-bg py-2 pl-9 pr-8 text-sm font-semibold text-navy-800 outline-none focus:border-yellow-500"
          />
          {citySel && (
            <button
              type="button"
              onClick={() => setCitySel("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-700"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {/* Known cities are offered as suggestions, but any area name can be typed and searched */}
          {cities.length > 0 && (
            <datalist id="driver-area-suggestions">
              {cities.map((c) => <option key={c} value={c} />)}
            </datalist>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="divide-y divide-navy-100">
            {[...Array(5)].map((_, i) => <DriverRowSkeleton key={i} />)}
          </div>
        ) : error ? (
          <p className="px-4 py-6 text-center text-sm text-navy-400">
            Couldn't load drivers right now. Try again shortly.
          </p>
        ) : drivers.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-navy-400">
            No drivers online{debouncedCity ? ` in ${debouncedCity}` : ""} right now.
          </p>
        ) : (
          <div className="divide-y divide-navy-100">
            {drivers.map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-100">
                  <Car className="h-4.5 w-4.5 text-navy-700" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-success-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy-800">
                    {d.name || `Driver in ${d.city}`}
                  </p>
                  <p className="flex items-center gap-1 truncate text-xs text-navy-400">
                    <MapPin className="h-3 w-3 shrink-0 text-yellow-500" /> {d.city} · {d.total_trips} trips
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1 text-xs font-bold text-navy-800">
                  <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                  {d.average_rating ?? "—"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}