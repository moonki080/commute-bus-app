import "server-only";

import proj4 from "proj4";

import type { Coordinate } from "@/lib/location";

const TM127_BESSEL =
  "+proj=tmerc +lat_0=38 +lon_0=127.0028902777778 +k=1 +x_0=200000 +y_0=500000 +ellps=bessel +towgs84=-145.907,505.034,685.756,-1.162,2.347,1.592,6.342 +units=m +no_defs";
const TM127_BESSEL_CRS = "TM127_BESSEL";

proj4.defs(TM127_BESSEL_CRS, TM127_BESSEL);

function isFiniteCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
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
