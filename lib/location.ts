import proj4 from "proj4";

export type Coordinate = {
  lat: number;
  lng: number;
};

export type LocationStatus =
  | "idle"
  | "loading"
  | "granted"
  | "denied"
  | "unavailable"
  | "error";

const TM127_BESSEL =
  "+proj=tmerc +lat_0=38 +lon_0=127.0028902777778 +k=1 +x_0=200000 +y_0=500000 +ellps=bessel +towgs84=-145.907,505.034,685.756,-1.162,2.347,1.592,6.342 +units=m +no_defs";
const TM127_BESSEL_CRS = "TM127_BESSEL";

proj4.defs(TM127_BESSEL_CRS, TM127_BESSEL);

function isFiniteCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function hasCoordinates(
  value: Partial<Coordinate> | null | undefined,
): value is Coordinate {
  return Boolean(
    value &&
      isFiniteCoordinate(value.lat) &&
      isFiniteCoordinate(value.lng),
  );
}

export function convertTm127ToWgs84(
  posX: number | null | undefined,
  posY: number | null | undefined,
): Coordinate | null {
  if (!isFiniteCoordinate(posX) || !isFiniteCoordinate(posY)) {
    return null;
  }

  const [lng, lat] = proj4(TM127_BESSEL_CRS, proj4.WGS84, [posX, posY]);

  if (!isFiniteCoordinate(lat) || !isFiniteCoordinate(lng)) {
    return null;
  }

  return {
    lat,
    lng,
  };
}

export function haversineDistanceMeters(
  origin: Coordinate,
  destination: Coordinate,
) {
  const earthRadiusMeters = 6_371_000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(destination.lat - origin.lat);
  const dLng = toRadians(destination.lng - origin.lng);
  const startLat = toRadians(origin.lat);
  const endLat = toRadians(destination.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(startLat) *
      Math.cos(endLat) *
      Math.sin(dLng / 2) ** 2;

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistanceLabel(meters: number) {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }

  return `${(meters / 1000).toFixed(1)}km`;
}
