// Units conversion utilities

export const METERS_TO_YARDS = 1.09361;

export function metersToYards(meters: number): number {
  return meters * METERS_TO_YARDS;
}

export function yardsToMeters(yards: number): number {
  return yards / METERS_TO_YARDS;
}

export function formatDistance(
  distance: number, 
  unit: 'm' | 'yd' = 'm',
  precision: number = 0
): string {
  if (unit === 'yd') {
    const yards = metersToYards(distance);
    return `${yards.toFixed(precision)} yd`;
  }
  return `${distance.toFixed(precision)} m`;
}

export function convertDistance(
  distance: number,
  fromUnit: 'm' | 'yd',
  toUnit: 'm' | 'yd'
): number {
  if (fromUnit === toUnit) return distance;
  
  if (fromUnit === 'm' && toUnit === 'yd') {
    return metersToYards(distance);
  }
  
  if (fromUnit === 'yd' && toUnit === 'm') {
    return yardsToMeters(distance);
  }
  
  return distance;
}