// Shared settings for the data-building tools.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Raw downloads live outside the site. Override with TREK_CACHE. */
export const CACHE = process.env.TREK_CACHE
  ? path.resolve(process.env.TREK_CACHE)
  : path.join(ROOT, 'tools', '.cache');

/** Region covered by the 3D relief and the field map: [west, south, east, north]. */
// Wide enough to keep Dhaulagiri (west) and Manaslu (east) clear of the faded border.
export const BBOX = { west: 83.36, south: 28.1, east: 84.7, north: 28.95 };

/** Area the OpenStreetMap place and service extracts were taken from. */
export const OSM_BBOX = { west: 83.45, south: 28.1, east: 84.6, north: 28.95 };

/** Elevation grid written to assets/terrain/dem.png. */
export const DEM = { width: 576, height: 0, zoom: 11, step: 4 };

/** OpenStreetMap relation for the Annapurna Circuit hiking route. */
export const ROUTE_RELATION = 1187310;

export const USER_AGENT = 'trek-site-builder/0.1';
