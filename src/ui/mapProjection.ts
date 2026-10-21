import { MAP_HEIGHT, MAP_LAT_MAX, MAP_LAT_MIN, MAP_WIDTH } from '../content/worldMap';

export function project(lat: number, lon: number): { x: number; y: number } {
  const x = ((lon + 180) / 360) * MAP_WIDTH;
  const y = ((MAP_LAT_MAX - Math.max(MAP_LAT_MIN, Math.min(MAP_LAT_MAX, lat))) / (MAP_LAT_MAX - MAP_LAT_MIN)) * MAP_HEIGHT;
  return { x, y };
}
