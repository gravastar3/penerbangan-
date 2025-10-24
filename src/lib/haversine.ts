/**
 * Calculate the great circle distance between two points 
 * on the earth (specified in decimal degrees)
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function haversineDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Calculate distance between two airports
 * @param airport1 First airport with latitude and longitude
 * @param airport2 Second airport with latitude and longitude
 * @returns Distance in kilometers
 */
export function calculateAirportDistance(
  airport1: { latitude: number; longitude: number },
  airport2: { latitude: number; longitude: number }
): number {
  return haversineDistance(
    airport1.latitude,
    airport1.longitude,
    airport2.latitude,
    airport2.longitude
  );
}

/**
 * Calculate segment distances for a route
 * @param path Array of airport codes in order
 * @param airports Array of all airports
 * @returns Array of segment distances
 */
export function calculateSegmentDistances(
  path: string[],
  airports: Array<{ code: string; latitude: number; longitude: number }>
): Array<{
  from: string;
  to: string;
  distance: number;
  fromName: string;
  toName: string;
}> {
  const segments: Array<{
    from: string;
    to: string;
    distance: number;
    fromName: string;
    toName: string;
  }> = [];

  for (let i = 0; i < path.length - 1; i++) {
    const fromCode = path[i];
    const toCode = path[i + 1];
    
    const fromAirport = airports.find(a => a.code === fromCode);
    const toAirport = airports.find(a => a.code === toCode);
    
    if (fromAirport && toAirport) {
      const distance = calculateAirportDistance(fromAirport, toAirport);
      segments.push({
        from: fromCode,
        to: toCode,
        distance,
        fromName: fromAirport.name,
        toName: toAirport.name
      });
    }
  }

  return segments;
}