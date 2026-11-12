// Geography of the itinerary: every named place the site shows, and the legs
// that join them. Coordinates here are starting points; tools/build-route.mjs
// refines the ones on the trail against OpenStreetMap and writes the result to
// data/route.json, which the site prefers when it is present.
//
// ele: the commonly quoted altitude in metres. Sources disagree by tens of
// metres for most villages, so the site always shows these as approximate.

/** kind: city | town | village | camp | pass | viewpoint | lake | peak */
export const STOPS = {
  kathmandu: { name: 'Kathmandu', lon: 85.324, lat: 27.7172, ele: 1400, kind: 'city' },
  pokhara: { name: 'Pokhara', lon: 83.9914, lat: 28.2095, ele: 820, kind: 'city' },
  besisahar: { name: 'Besisahar', lon: 84.3761, lat: 28.2313, ele: 760, kind: 'town' },
  bhulbhule: { name: 'Bhulbhule', lon: 84.3716, lat: 28.2903, ele: 840, kind: 'village' },
  bahundanda: { name: 'Bahundanda', lon: 84.4063, lat: 28.3431, ele: 1310, kind: 'village' },
  syange: { name: 'Syange', lon: 84.4021, lat: 28.3873, ele: 1100, kind: 'village' },
  jagat: { name: 'Jagat', lon: 84.4065, lat: 28.413, ele: 1300, kind: 'village' },
  chamje: { name: 'Chamje', lon: 84.3891, lat: 28.4379, ele: 1430, kind: 'village' },
  tal: { name: 'Tal', lon: 84.3737, lat: 28.4686, ele: 1700, kind: 'village' },
  dharapani: { name: 'Dharapani', lon: 84.3584, lat: 28.519, ele: 1860, kind: 'village' },
  danaque: { name: 'Danaque', lon: 84.325, lat: 28.5331, ele: 2300, kind: 'village' },
  timang: { name: 'Timang', lon: 84.3049, lat: 28.5271, ele: 2750, kind: 'village' },
  koto: { name: 'Koto', lon: 84.2593, lat: 28.5522, ele: 2600, kind: 'village' },
  chame: { name: 'Chame', lon: 84.2424, lat: 28.5507, ele: 2670, kind: 'town' },
  bhratang: { name: 'Bhratang', lon: 84.1904, lat: 28.5728, ele: 2850, kind: 'village' },
  dhukurpokhari: { name: 'Dhikur Pokhari', lon: 84.1794, lat: 28.6023, ele: 3060, kind: 'village' },
  upperpisang: { name: 'Upper Pisang', lon: 84.153, lat: 28.6164, ele: 3300, kind: 'village' },
  ghyaru: { name: 'Ghyaru', lon: 84.1373, lat: 28.6418, ele: 3730, kind: 'village' },
  ngawal: { name: 'Ngawal', lon: 84.1013, lat: 28.649, ele: 3680, kind: 'village' },
  braga: { name: 'Braga', lon: 84.0399, lat: 28.6572, ele: 3450, kind: 'village' },
  manang: { name: 'Manang', lon: 84.0231, lat: 28.6661, ele: 3540, kind: 'town' },
  gunsang: { name: 'Gunsang', lon: 83.9987, lat: 28.6845, ele: 3900, kind: 'village' },
  yakkharka: { name: 'Yak Kharka', lon: 83.9738, lat: 28.7227, ele: 4050, kind: 'camp' },
  ledar: { name: 'Ledar', lon: 83.9731, lat: 28.739, ele: 4200, kind: 'camp' },
  thorongphedi: { name: 'Thorong Phedi', lon: 83.9726, lat: 28.7768, ele: 4450, kind: 'camp' },
  highcamp: { name: 'High Camp', lon: 83.9675, lat: 28.7829, ele: 4880, kind: 'camp' },
  thorongla: { name: 'Thorong La', lon: 83.9388, lat: 28.7935, ele: 5416, kind: 'pass' },
  muktinath: { name: 'Muktinath', lon: 83.8715, lat: 28.8169, ele: 3760, kind: 'village' },
  jharkot: { name: 'Jharkot', lon: 83.8497, lat: 28.8177, ele: 3550, kind: 'village' },
  kagbeni: { name: 'Kagbeni', lon: 83.7843, lat: 28.8378, ele: 2810, kind: 'village' },
  jomsom: { name: 'Jomsom', lon: 83.7305, lat: 28.7838, ele: 2720, kind: 'town' },
  marpha: { name: 'Marpha', lon: 83.6862, lat: 28.7519, ele: 2670, kind: 'village' },
  tukuche: { name: 'Tukuche', lon: 83.6452, lat: 28.7109, ele: 2590, kind: 'village' },
  kalopani: { name: 'Kalopani', lon: 83.596, lat: 28.642, ele: 2530, kind: 'village' },
  ghasa: { name: 'Ghasa', lon: 83.6426, lat: 28.5995, ele: 2010, kind: 'village' },
  tatopani: { name: 'Tatopani', lon: 83.6543, lat: 28.4967, ele: 1190, kind: 'village' },
  shikha: { name: 'Shikha', lon: 83.672, lat: 28.4442, ele: 1935, kind: 'village' },
  ghorepani: { name: 'Ghorepani', lon: 83.6999, lat: 28.4025, ele: 2860, kind: 'village' },
  poonhill: { name: 'Poon Hill', lon: 83.6895, lat: 28.4, ele: 3210, kind: 'viewpoint' },
  ulleri: { name: 'Ulleri', lon: 83.7354, lat: 28.3567, ele: 1960, kind: 'village' },
  birethanti: { name: 'Birethanti', lon: 83.7748, lat: 28.3095, ele: 1025, kind: 'village' },
  nayapul: { name: 'Nayapul', lon: 83.7679, lat: 28.2981, ele: 1070, kind: 'village' },
  // side trips
  icelake: { name: 'Ice Lake', lon: 84.0614, lat: 28.6797, ele: 4600, kind: 'lake' },
  tilicholake: { name: 'Tilicho Lake', lon: 83.8527, lat: 28.6911, ele: 4919, kind: 'lake' },
  khangsar: { name: 'Khangsar', lon: 83.9734, lat: 28.6697, ele: 3745, kind: 'village' },
};

export const PEAKS = [
  { id: 'annapurna1', name: 'Annapurna I', ele: 8091, lon: 83.8199, lat: 28.5958, major: true },
  { id: 'annapurna2', name: 'Annapurna II', ele: 7937, lon: 84.1218, lat: 28.535, major: true },
  { id: 'annapurna3', name: 'Annapurna III', ele: 7555, lon: 83.9891, lat: 28.5854, major: true },
  { id: 'annapurna4', name: 'Annapurna IV', ele: 7525, lon: 84.0836, lat: 28.5369 },
  { id: 'gangapurna', name: 'Gangapurna', ele: 7455, lon: 83.9635, lat: 28.6057, major: true },
  { id: 'annapurnasouth', name: 'Annapurna South', ele: 7219, lon: 83.8063, lat: 28.5184 },
  { id: 'machhapuchhre', name: 'Machhapuchhre', ele: 6993, lon: 83.9459, lat: 28.498, major: true },
  { id: 'dhaulagiri', name: 'Dhaulagiri', ele: 8167, lon: 83.4895, lat: 28.6976, major: true },
  { id: 'tukuchepeak', name: 'Tukuche Peak', ele: 6920, lon: 83.5574, lat: 28.745 },
  { id: 'nilgiri', name: 'Nilgiri North', ele: 7061, lon: 83.7441, lat: 28.6891, major: true },
  { id: 'tilichopeak', name: 'Tilicho Peak', ele: 7134, lon: 83.8115, lat: 28.6829, major: true },
  { id: 'manaslu', name: 'Manaslu', ele: 8163, lon: 84.5597, lat: 28.55, major: true },
  { id: 'lamjung', name: 'Lamjung Himal', ele: 6983, lon: 84.1886, lat: 28.4895 },
  { id: 'pisangpeak', name: 'Pisang Peak', ele: 6091, lon: 84.1881, lat: 28.6487 },
  { id: 'chuluwest', name: 'Chulu West', ele: 6419, lon: 84.0228, lat: 28.7454 },
  { id: 'thorongpeak', name: 'Thorong Peak', ele: 6144, lon: 83.9269, lat: 28.782 },
  { id: 'khatungkang', name: 'Khatung Kang', ele: 6484, lon: 83.9183, lat: 28.7778 },
  { id: 'yakawakang', name: 'Yakawa Kang', ele: 6482, lon: 83.9419, lat: 28.8089 },
  { id: 'kangguru', name: 'Kang Guru', ele: 6981, lon: 84.3009, lat: 28.6582 },
];

/**
 * How each day moves across the map. `path` lists stop ids in order; the route
 * builder joins consecutive stops along the OpenStreetMap trail for `trek`
 * legs and draws straight links for `drive` and `fly`.
 */
export const LEGS = [
  { day: 3, mode: 'drive', path: ['kathmandu', 'besisahar', 'bhulbhule', 'syange', 'jagat'] },
  { day: 4, mode: 'trek', path: ['jagat', 'chamje', 'tal', 'dharapani'] },
  { day: 5, mode: 'trek', path: ['dharapani', 'danaque', 'timang', 'koto', 'chame'] },
  { day: 6, mode: 'trek', path: ['chame', 'bhratang', 'dhukurpokhari', 'upperpisang'] },
  { day: 7, mode: 'trek', path: ['upperpisang', 'ghyaru', 'ngawal', 'braga', 'manang'] },
  { day: 9, mode: 'trek', path: ['manang', 'gunsang', 'yakkharka'] },
  { day: 10, mode: 'trek', path: ['yakkharka', 'ledar', 'thorongphedi'] },
  { day: 11, mode: 'trek', path: ['thorongphedi', 'highcamp', 'thorongla', 'muktinath'] },
  { day: 12, mode: 'trek', path: ['muktinath', 'jharkot', 'kagbeni', 'jomsom'] },
  { day: 13, mode: 'trek', path: ['jomsom', 'marpha'] },
  { day: 13, mode: 'drive', path: ['marpha', 'tukuche', 'kalopani', 'ghasa', 'tatopani'] },
  { day: 14, mode: 'trek', path: ['tatopani', 'shikha', 'ghorepani'] },
  { day: 15, mode: 'trek', path: ['ghorepani', 'poonhill', 'ghorepani', 'ulleri', 'birethanti', 'nayapul'] },
  { day: 15, mode: 'drive', path: ['nayapul', 'pokhara'] },
  { day: 17, mode: 'drive', path: ['pokhara', 'kathmandu'] },
];
