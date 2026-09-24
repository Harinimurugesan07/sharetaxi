import { useEffect, useState } from "react";
import { Check, ChevronDown, LoaderCircle, Search } from "lucide-react";
import { searchLocations } from "../api/geocoding";
import "./LocationPicker.css";

export default function LocationPicker({ icon: Icon, value, onChange, onSelect, placeholder = "Search location" }) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        setResults(await searchLocations(query.trim(), controller.signal));
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setResults([]);
          setError(requestError.message);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, query]);

  const selectLocation = (location) => {
    setQuery(location.name);
    onChange(location.name);
    onSelect?.(location);
    setOpen(false);
  };

  return (
    <div className="input-shell location-picker">
      {Icon && <Icon className="input-icon" />}

      <input
        value={query}
        placeholder={placeholder}
        onChange={(event) => {
          setQuery(event.target.value);
          onChange(event.target.value);
          onSelect?.(null);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={`text-input location-picker__input ${Icon ? "text-input--with-icon" : ""}`}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
      />

      {loading ? (
        <LoaderCircle className="location-picker__status-icon location-picker__status-icon--spin" />
      ) : (
        <Search className="location-picker__status-icon" />
      )}

      <ChevronDown className={`location-picker__chevron ${open ? "location-picker__chevron--open" : ""}`} />

      {open && (
        <div className="location-picker__panel">
          {results.length > 0 ? (
            results.map((location) => (
              <button
                key={`${location.name}-${location.lat}-${location.lng}`}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectLocation(location)}
                className="location-picker__option"
              >
                <span className="location-picker__option-label">{location.name}</span>
                {location.name === value && <Check className="location-picker__option-check" />}
              </button>
            ))
          ) : (
            <p className="location-picker__empty">
              {error || (query.trim().length < 2 ? "Type at least 2 characters" : "No matching locations")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}