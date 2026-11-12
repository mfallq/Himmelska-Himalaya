// The written guidance for each day, keyed by day number.
//
// Shape of an entry (every part is optional; the day sheet shows what exists):
//   summary  one paragraph
//   thread   four moments of the day: { label, text, points[] }
//   paces    three ways to do the day: { label, text }
//   stops    places worth a pause: { name, text, field, frame }
//   stories  history, culture, geography: { title, text }
//   wear, pack, ask   short lists
//   notes    one or two sentences per topic, keyed as in NOTE_LABELS
import { DETAILS_A } from './details-a.js';
import { DETAILS_B } from './details-b.js';

export const DETAILS = { ...DETAILS_A, ...DETAILS_B };

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
