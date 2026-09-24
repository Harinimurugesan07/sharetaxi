const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

function normalizeLocation(result) {
  return {
    name: result.display_name,
    lat: Number(result.lat),
    lng: Number(result.lon),
  };
}

export async function searchLocations(query, signal) {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    limit: "6",
  });
  const response = await fetch(`${NOMINATIM_URL}?${params}`, {
    signal,
    headers: { "Accept-Language": "en" },
  });

  if (!response.ok) {
    throw new Error("Unable to search map locations right now.");
  }

  const results = await response.json();
  return results.map(normalizeLocation);
}

export async function geocodeLocation(query) {
  const results = await searchLocations(query);
  return results[0] || null;
}
