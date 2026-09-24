// How far along the origin -> destination line a GPS point is (0..1), or null
// when the trip has no coordinates / the point is invalid. Uses a flat
// (equirectangular) projection, which is accurate enough over a single ride.
export function routeProgress(trip, point) {
  const oLat = Number(trip?.origin_lat);
  const oLng = Number(trip?.origin_lng);
  const dLat = Number(trip?.destination_lat);
  const dLng = Number(trip?.destination_lng);
  const lat = Number(point?.lat ?? point?.latitude);
  const lng = Number(point?.lng ?? point?.longitude);

  if (![oLat, oLng, dLat, dLng, lat, lng].every(Number.isFinite)) return null;

  const kx = Math.cos((((oLat + dLat) / 2) * Math.PI) / 180);
  const ox = oLng * kx;
  const dx = dLng * kx - ox;
  const dy = dLat - oLat;
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return null;

  const t = ((lng * kx - ox) * dx + (lat - oLat) * dy) / lengthSquared;
  return Math.min(1, Math.max(0, t));
}
