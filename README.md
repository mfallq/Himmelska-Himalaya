# Himmelska-Himalaya
This site is used for anyone who wants to trek Annapurna circuit trek

This repo is built by Claude AI based on my friends EBC trek site https://ciprian-everest-2026.creammouse1.chatgpt.site/owner/

## What it is

A trail companion for the Annapurna Circuit, in English, in five tabs:

- **Journey**: a globe with the way to Kathmandu and the trip door to door.
- **Relief 3D**: the Annapurna range as a 3D relief with the route, a day slider, a fly-through, and a field map of water, lodging, health posts and more along the trail.
- **Days**: the 18-day itinerary. Each day opens a sheet with the plan, stops, stories, kit, daylight times and a journal.
- **Altitude**: sleeping heights, the walk in profile, and the acclimatisation rules checked against the plan.
- **Practical**: permits, packing, seasons, a checklist, and the sources.

It is a static site with no build step and no dependencies. Dates, checklist ticks and the journal are stored in the visitor's browser only.

## Run it locally

```bash
node tools/serve.mjs
```

Then open http://localhost:5173. Any static file server works as well.

## Publish it

Serve the repository root as static files, for example with GitHub Pages (Settings → Pages → deploy from the `main` branch, root folder). All paths are relative, so it works under a sub-path.

After changing any site file, refresh the offline file list:

```bash
node tools/build-precache.mjs
```

### On expandialabs.com

The site is live at `expandialabs.com/himmelska-himalaya/`. That repository holds a published copy in `site/himmelska-himalaya/`. To update it, copy the browser files across, then commit and deploy from there:

```bash
node tools/publish.mjs ../expandialabs/site/himmelska-himalaya
```

The copy includes `deploy/htaccess` as `.htaccess`, which stops CSS and JS being cached for a year, a rule inherited from the main site.

## On a phone, without signal

The site saves a full copy of itself on the device the first time it is opened with a connection (about 2 MB on a phone). After that every request is answered from that copy, so it opens with no signal. The header shows "Offline: ready" only when every file has been checked as saved.

On an iPhone, open the site in Safari and use Share → Add to Home Screen. iOS can delete the saved copy of a website that has not been opened for a week; a Home Screen app is kept. Open it once from the Home Screen while still connected, then test it in flight mode before leaving.

## Where things live

| Path | What |
| --- | --- |
| `js/content/` | Everything written: itinerary, day guidance, practical notes, checklist |
| `js/views/` | One module per tab, plus the day sheet and the field map |
| `js/terrain/` | The WebGL relief renderer and its textures |
| `data/` | Generated data: route, elevation grid metadata, places, globe land mask |
| `assets/` | Fonts, icon, elevation grid (`terrain/dem.png`) |
| `tools/` | Scripts that build `data/` from open data |

## Rebuilding the data

Raw downloads go to `tools/.cache/` (ignored by git), or to the folder in `TREK_CACHE`.

```bash
node tools/fetch-osm.mjs        # OpenStreetMap extracts (trail, places, services)
node tools/build-dem.mjs        # elevation grid for the relief
node tools/build-route.mjs      # one line per day, with distance and climb
node tools/build-pois.mjs       # services within 1 km of the trail
node tools/build-land.mjs       # land dots for the globe (needs the world-atlas npm package unpacked in the cache)
node tools/build-precache.mjs   # offline file list
```

## Data and licences

- Trail, places and services: © OpenStreetMap contributors, Open Database Licence (ODbL).
- Elevation: Mapzen Terrain Tiles on AWS Open Data (SRTM and other public sources).
- Satellite picture (`assets/terrain/satellite.jpg`, built by `tools/satellite.html`): Sentinel-2 cloudless 2016 by EOX IT Services GmbH, contains modified Copernicus Sentinel data 2016, CC BY 4.0. The 2016 layer is used on purpose: later years are CC BY-NC-SA and not free for commercial sites.
- Globe coastlines: Natural Earth, public domain.
- Fonts: Instrument Serif and Instrument Sans, SIL Open Font Licence 1.1 (licence texts in `assets/fonts/`).

## Limits to know about

- Stage distances, times and altitudes are typical published figures. The elevation model is unreliable in the deep gorges, so trail heights are pinned to the published altitude of each village.
- Permit fees, the TIMS card and the guide rule changed several times after 2023 and sources disagree. The site says so and links to the official bodies.
- The site is a planning aid. It is not medical advice and not a substitute for a guide or a current map.
