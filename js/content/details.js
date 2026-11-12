// The written guidance for each day, keyed by day number.
//
// Shape of an entry (every part is optional; the day sheet shows what exists):
//   key      two or three lines to know first (see key.js)
//   summary  one paragraph
//   thread   four moments of the day: { label, text, points[] }
//   paces    three ways to do the day: { label, text }
//   stops    places worth a pause: { name, text, field, frame }
//   stories  history, culture, geography: { title, text }
//   wear, pack, ask   short lists
//   notes    one or two sentences per topic, keyed as in NOTE_LABELS
import { DETAILS_A } from './details-a.js';
import { DETAILS_B } from './details-b.js';
import { KEY } from './key.js';

const merged = { ...DETAILS_A, ...DETAILS_B };
export const DETAILS = Object.fromEntries(Object.entries(merged).map(([n, d]) => [n, { ...d, key: KEY[n] }]));

export const NOTE_LABELS = {
  permits: 'Papers and permits',
  health: 'Health and altitude',
  water: 'Water, food and hygiene',
  gear: 'Kit and bags',
  route: 'Route and orientation',
  weather: 'Weather and risks',
  power: 'Phone, power and offline maps',
  lodging: 'Transport and beds',
  money: 'Money and local custom',
  photo: 'Photography and journal',
};
