// Downloads the OpenStreetMap extracts the site data is built from.
//   node tools/fetch-osm.mjs [route|places|pois ...]
// Files land in the cache folder (see config.mjs). Existing files are kept;
// delete one to refresh it. Data © OpenStreetMap contributors, ODbL.
import fs from 'node:fs/promises';
import path from 'node:path';
import { CACHE, OSM_BBOX as BBOX, ROUTE_RELATION, USER_AGENT } from './config.mjs';

const bb = `${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east}`;
const QUERIES = {
  route: `[out:json][timeout:180];relation(${ROUTE_RELATION});out geom;`,
  places: `[out:json][timeout:180];(
    node["place"~"^(city|town|village|hamlet|locality|isolated_dwelling|suburb)$"]["name"](${bb});
    node["natural"~"^(peak|saddle|glacier)$"]["name"](${bb});
    node["mountain_pass"="yes"](${bb});
    nwr["natural"="water"]["name"](${bb});
  );out center tags;`,
  pois: `[out:json][timeout:240];(
    nwr["amenity"~"^(drinking_water|water_point|toilets|shelter|hospital|clinic|doctors|pharmacy|atm|bank|police|restaurant|cafe|place_of_worship|bus_station)$"](${bb});
    nwr["tourism"~"^(guest_house|hotel|hostel|alpine_hut|wilderness_hut|camp_site|viewpoint|information|attraction|museum)$"](${bb});
    nwr["shop"](${bb});
    nwr["natural"~"^(hot_spring|spring)$"](${bb});
    nwr["emergency"](${bb});
    nwr["aeroway"~"^(aerodrome|helipad)$"](${bb});
    nwr["healthcare"](${bb});
    nwr["waterway"="waterfall"](${bb});
    nwr["historic"](${bb});
    way["bridge"]["highway"~"^(path|footway|track)$"](${bb});
  );out center tags;`,
  // Paths and roads for the stretches the hiking relation leaves unmapped:
  // Thorong La to Jomsom, and the Poon Hill spur above Ghorepani.
  'extra-gaps': `[out:json][timeout:180];(
    way["highway"~"^(path|footway|steps|track|pedestrian|unclassified|tertiary|secondary|service|residential)$"](28.755,83.69,28.86,83.955);
    way["highway"~"^(path|footway|steps|track)$"](28.39,83.68,28.412,83.71);
  );out geom;`,
};
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dir = path.join(CACHE, 'osm');
await fs.mkdir(dir, { recursive: true });
const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(QUERIES);

for (const name of wanted) {
  const file = path.join(dir, `${name}.json`);
  try {
    await fs.access(file);
    console.log(`${name}: cached`);
    continue;
  } catch {}
  let done = false;
  for (let attempt = 0; attempt < 12 && !done; attempt++) {
    const endpoint = ENDPOINTS[attempt % ENDPOINTS.length];
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'User-Agent': USER_AGENT, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(QUERIES[name]),
        signal: AbortSignal.timeout(280_000),
      });
      const text = await res.text();
      if (!res.ok || !text.startsWith('{') || /"remark":\s*"runtime error/.test(text)) {
        throw new Error(`HTTP ${res.status}`);
      }
      JSON.parse(text);
      await fs.writeFile(file, text);
      console.log(`${name}: ${(text.length / 1024).toFixed(0)} KB via ${new URL(endpoint).host}`);
      done = true;
    } catch (err) {
      const wait = Math.min(120, 12 * 2 ** Math.min(attempt, 4));
      console.log(`${name}: ${err.message} from ${new URL(endpoint).host}; retry in ${wait}s`);
      await sleep(wait * 1000);
    }
  }
  if (!done) console.log(`${name}: FAILED`);
}
