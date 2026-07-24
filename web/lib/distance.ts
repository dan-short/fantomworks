// Shop location — 23517 (Portsmouth, VA), matches migrations/0001 zipcodes seed.
const SHOP_LAT = 36.8695
const SHOP_LNG = -76.2945
const EARTH_RADIUS_MI = 3958.8

export function haversineMiles(lat: number, lng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat - SHOP_LAT)
  const dLng = toRad(lng - SHOP_LNG)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(SHOP_LAT)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_MI * c
}
