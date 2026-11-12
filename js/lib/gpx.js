// Export the mapped route as a GPX file for a phone map app or a GPS watch.
import { esc } from '../util.js';
import { data, DAYS, STOPS } from '../data.js';

export function buildGpx() {
  const overnight = [...new Set(DAYS.map((d) => d.to))].filter((id) => STOPS[id]);
  const waypoints = overnight
    .map((id) => {
      const s = STOPS[id];
      return `  <wpt lat="${s.lat}" lon="${s.lon}"><ele>${s.ele}</ele><name>${esc(s.name)}</name></wpt>`;
    })
    .join('\n');
  const tracks = data.route.legs
    .filter((leg) => leg.mode === 'trek')
    .map((leg) => {
      const d = DAYS[leg.day - 1];
      const points = leg.line.map((p) => `      <trkpt lat="${p[1]}" lon="${p[0]}"><ele>${p[2]}</ele></trkpt>`).join('\n');
      return `  <trk>\n    <name>Day ${leg.day}: ${esc(d.route)}</name>\n    <trkseg>\n${points}\n    </trkseg>\n  </trk>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Himmelska Himalaya" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Annapurna Circuit: planning route</name>
    <desc>Simplified from OpenStreetMap trails. A planning aid, not a recorded track: follow the trail on the ground and your guide.</desc>
    <copyright author="OpenStreetMap contributors"><license>https://opendatacommons.org/licenses/odbl/</license></copyright>
  </metadata>
${waypoints}
${tracks}
</gpx>
`;
}
