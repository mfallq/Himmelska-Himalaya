// Everything that is not tied to a single day: altitude guidance, practical
// notes, the checklist, the journey to the trailhead, sources and credits.
//
// Prices, permit rules and road conditions change from season to season. The
// text says so wherever it gives a figure, and SOURCES lists where to confirm.

export const CREDITS = [
  { what: 'Trail and places', who: '© OpenStreetMap contributors, Open Database Licence', url: 'https://www.openstreetmap.org/copyright', label: 'openstreetmap.org' },
  { what: 'Elevation', who: 'Mapzen Terrain Tiles on AWS Open Data, from SRTM and other public sources', url: 'https://registry.opendata.aws/terrain-tiles/', label: 'terrain tiles' },
  { what: 'Satellite drape (online only)', who: 'Sentinel-2 cloudless by EOX IT Services GmbH, contains modified Copernicus Sentinel data, CC BY-NC-SA 4.0', url: 'https://s2maps.eu', label: 's2maps.eu' },
  { what: 'Coastlines on the globe', who: 'Natural Earth, public domain', url: 'https://www.naturalearthdata.com', label: 'naturalearthdata.com' },
  { what: 'Typefaces', who: 'Instrument Serif and Instrument Sans, SIL Open Font Licence 1.1', url: 'https://github.com/Instrument', label: 'Instrument' },
  { what: 'Altitude guidance', who: 'summarised from the CDC Yellow Book and the Wilderness Medical Society guidelines', url: 'https://www.cdc.gov/yellow-book/hcp/environmental-hazards-risks/high-altitude-travel-and-altitude-illness.html', label: 'CDC Yellow Book' },
];

export const SOURCES = [
  { group: 'Rules and permits', label: 'Nepal Tourism Board', url: 'https://ntb.gov.np/', note: 'Trekking rules, the guide requirement, TIMS.' },
  { group: 'Rules and permits', label: 'National Trust for Nature Conservation (ACAP)', url: 'https://ntnc.org.np/', note: 'The Annapurna Conservation Area permit and its fee.' },
  { group: 'Rules and permits', label: 'Department of Immigration, Nepal', url: 'https://www.immigration.gov.np/', note: 'Visa on arrival, fees and the online form.' },
  { group: 'Health', label: 'CDC Yellow Book: high-altitude travel', url: 'https://www.cdc.gov/yellow-book/hcp/environmental-hazards-risks/high-altitude-travel-and-altitude-illness.html', note: 'Ascent rates, symptoms, medication to discuss with a doctor.' },
  { group: 'Health', label: 'Himalayan Rescue Association', url: 'https://himalayanrescue.org.np/', note: 'Runs the aid post and altitude talks in Manang.' },
  { group: 'Health', label: 'Wilderness Medical Society', url: 'https://wms.org/', note: 'Clinical practice guidelines on altitude illness.' },
  { group: 'Weather', label: 'Department of Hydrology and Meteorology, Nepal', url: 'https://www.dhm.gov.np/', note: 'Official forecasts and warnings.' },
  { group: 'Maps', label: 'OpenStreetMap', url: 'https://www.openstreetmap.org/#map=11/28.60/84.00', note: 'The map this site draws its trail from.' },
];

// ---------------- altitude ----------------
export const ALTITUDE_CARDS = [
  {
    title: 'Climb high, sleep low.',
    text: 'The day’s high point matters less than the height you sleep at. The itinerary uses that twice: over Ghyaru on the way to Manang, and on the acclimatisation day above Manang. Go up, look around, come back down to sleep.',
  },
  {
    title: 'Say so at the first sign.',
    text: 'Headache with nausea, no appetite, unusual tiredness, dizziness or a bad night: tell your guide and your companions. Do not go higher while symptoms last. Most cases settle with a day at the same height, fluids and rest.',
  },
  {
    title: 'Serious signs: go down.',
    warn: true,
    text: 'Confusion, stumbling as if drunk, breathlessness while resting, a wet cough or blue lips are emergencies. Descend at once, with help, at any hour, and get medical care. Do not wait for morning and never send someone down alone.',
  },
];

export const ALTITUDE_RULES = [
  'Above 3,000 m, try not to raise your sleeping height by more than about 500 m a night.',
  'Take a day without sleeping higher every three or four days, or for every 1,000 m gained.',
  'Never go up with symptoms of altitude sickness. If they get worse at the same height, go down.',
  'Drink normally, eat carbohydrates, skip alcohol and sleeping pills, and walk slower than feels necessary.',
  'Ask a travel doctor before the trip whether acetazolamide makes sense for you.',
];

// ---------------- practical ----------------
export const PRACTICAL_CARDS = [
  {
    id: 'pack',
    title: 'Small pack, long road.',
    lead: 'On the trail: a day pack of 5–8 kg',
    bar: [62, 38],
    barNote: 'About 10–12 kg in the duffel a porter carries, 5–8 kg on your own back.',
    points: [
      'Porter: most agencies ask for a duffel of 10–12 kg per trekker, because one porter usually carries two.',
      'Day pack: 25–35 litres for water, layers, rain shell, snacks, camera and documents.',
      'Small mountain aircraft (Jomsom, and some Pokhara flights) often allow about 10 kg checked plus 5 kg in the cabin. Check your ticket.',
    ],
  },
  {
    id: 'papers',
    title: 'Papers, within reach.',
    points: [
      'Passport valid for six months beyond arrival, with spare photos and paper copies.',
      'Visa on arrival at Kathmandu airport. The fees usually quoted are USD 30 for 15 days, 50 for 30 days and 125 for 90 days. Confirm with the Department of Immigration.',
      'Annapurna Conservation Area permit (ACAP): NPR 3,000 for most foreigners, NPR 1,000 for SAARC nationals. Buy it before the first checkpoint: it costs double there.',
      'TIMS card: listed at NPR 2,000, but sources disagree on whether it is still checked in the Annapurna region. Ask your agency or the tourism board.',
      'Since April 2023 Nepal’s rules require foreign trekkers to walk with a licensed guide. How strictly it is applied on this route has varied: check the current position.',
      'Insurance that names trekking up to 6,000 m and helicopter evacuation. Carry the policy number and the emergency phone number on paper.',
    ],
  },
  {
    id: 'cold',
    title: 'Cold and simple rooms.',
    points: [
      'Teahouses give you a twin room with two beds, a thin mattress and a blanket. Walls are plywood, toilets are shared, and only the dining room has a stove.',
      'The coldest nights are Yak Kharka, Thorong Phedi and Muktinath. In October and November expect well below freezing in the room at Phedi.',
      'A sleeping bag comfortable to about −10 °C, a liner, a hat and dry socks kept only for sleeping make the difference.',
    ],
  },
  {
    id: 'power',
    title: 'Sockets, money and signal.',
    points: [
      'Sockets: types C, D and M, 230 V at 50 Hz. A universal adapter covers them. Above Manang, charging is usually paid for per device.',
      'Money: carry enough rupees for the whole trek. There are ATMs in Besisahar, Chame and Jomsom, but they run dry or fail. Budget roughly USD 30–45 a day for food and bed, more above Manang.',
      'Signal: NTC reaches more of Manang and Mustang than Ncell. Most lodges sell Wi-Fi. Expect nothing reliable between Yak Kharka and Muktinath.',
    ],
  },
];

export const TOWNS = [
  { name: 'Kathmandu, unhurried', note: 'Ideas for the days before and after. None needs booking.', places: ['Boudhanath', 'Swayambhunath', 'Pashupatinath', 'Patan Durbar Square', 'Bhaktapur'] },
  { name: 'Pokhara, by the lake', note: 'For the rest day after the trek.', places: ['Phewa Lake', 'World Peace Pagoda', 'International Mountain Museum', 'Sarangkot at sunrise'] },
];

export const SEASONS = [
  { months: 'Oct – Nov', name: 'Autumn', level: 3, text: 'The classic window: washed-clean air after the monsoon, stable weather, cold nights. Also the busiest lodges.' },
  { months: 'Mar – May', name: 'Spring', level: 2, text: 'Warmer and hazier, with rhododendrons in flower on the Ghorepani side. Snow can still close the pass in March.' },
  { months: 'Dec – Feb', name: 'Winter', level: 1, text: 'Clear but very cold. Thorong La is often blocked by snow and many lodges above Manang close.' },
  { months: 'Jun – Sep', name: 'Monsoon', level: 1, text: 'Rain, leeches and landslides on the approach roads. Manang and Mustang lie in the rain shadow and stay drier.' },
];

export const ALERTS = [
  { title: 'Permits and rules change.', text: 'Fees, the TIMS card and the guide rule have all changed since 2023, and agency websites contradict each other. Treat every figure here as a starting point and confirm it in Kathmandu.' },
  { title: 'Altitudes and distances are estimates.', text: 'Published heights for the same village differ by tens of metres, and distances depend on whether you take the trail or the road. Stage figures here are typical values, cross-checked against the mapped trail.' },
  { title: 'Altitude symptoms call for action.', text: 'If symptoms appear, do not sleep higher. If they worsen at the same height, descend. Severe signs need urgent help and an assisted descent. Agree any medication plan with a doctor before you leave.' },
  { title: 'Water and roads need a daily check.', text: 'Ask each morning where the next safe water is and whether the road or trail ahead is open. Jeep roads now reach Manang on one side and Muktinath on the other, and landslides close them without notice.' },
];

export const CULTURE = [
  { title: 'Walking past sacred things', text: 'Keep mani walls, chortens and prayer wheels on your right, so you pass them clockwise. Take shoes off in a gompa, ask before photographing people or altars, and dress modestly at Muktinath, which is holy to both Hindus and Buddhists.' },
  { title: 'Four peoples, one valley system', text: 'Gurung villages line the lower Marsyangdi. Upper Manang is home to the Nyeshang, long-distance traders with Tibetan Buddhist culture. Over the pass, Mustang is Tibetan in language and building, and the Thakali of the Kali Gandaki are famous for their kitchens.' },
  { title: 'From bananas to bare rock', text: 'In ten days you walk from subtropical forest and rice terraces through pine and fir, then juniper and birch, into high desert. North of the main range the monsoon barely arrives, which is why Manang and Mustang look like Tibet.' },
  { title: 'Who has right of way', text: 'Mule trains and yaks do. Step to the uphill side of the trail and wait. Around Yak Kharka and Ledar look for blue sheep on the slopes, and for lammergeiers and griffon vultures overhead.' },
  { title: 'Leave less behind', text: 'Refill at the safe drinking water stations in the villages when they are open, and treat your own water otherwise, rather than buying plastic bottles. Carry used batteries back to Kathmandu.' },
  { title: 'A few words', text: 'Namaste is hello and goodbye. Dhanyabad is thank you. Bistari, bistari means slowly, slowly, and is the best altitude advice you will hear. In Manang and Mustang, tashi delek is the greeting.' },
];

export const PHONE = [
  { title: 'Maps that work offline', text: 'This site keeps its relief and route on your device. Add a proper offline map as well: download the Annapurna region in an offline map app before you leave Kathmandu, and export the route from this site as a GPX file.' },
  { title: 'Power', text: 'A 20,000 mAh power bank covers three to four days of careful phone use. Cold drains batteries: keep the phone and the bank in your sleeping bag at night, and inside a jacket on the pass.' },
  { title: 'Staying reachable', text: 'Buy an NTC SIM in Kathmandu with your passport and a photo. Send a short daily message from the lodge Wi-Fi, and tell people at home that two or three silent days around the pass are normal.' },
  { title: 'In an emergency', text: 'Your guide and the lodge owner are the fastest help. Keep your insurer’s 24-hour number, your policy number and your embassy’s number on paper. In Nepal the police answer on 100 and the tourist police on 1144.' },
];

// ---------------- checklist ----------------
export const CHECKLIST = [
  {
    group: 'Documents and permits',
    items: [
      ['passport', 'Passport valid six months past arrival', 'Plus two paper copies kept apart from it.'],
      ['photos', 'Four passport photos', 'For the visa, permits and a SIM card.'],
      ['visa', 'Visa plan decided', 'On arrival with the online form, or from an embassy.'],
      ['acap', 'ACAP permit bought before the first checkpoint', 'Through your agency or at the tourism board office.'],
      ['tims', 'TIMS and guide rule checked with a current source', 'The answer has changed more than once since 2023.'],
      ['insurance', 'Insurance covers trekking to 6,000 m and helicopter evacuation', 'Read the altitude limit in the policy wording.'],
      ['insurance-paper', 'Policy number and emergency line written on paper', ''],
      ['itinerary-home', 'Itinerary and contact numbers left with someone at home', ''],
      ['flights', 'International and domestic flights reconfirmed', 'Keep a spare day before the flight home.'],
      ['embassy', 'Embassy contact noted', ''],
    ],
  },
  {
    group: 'Health and altitude',
    items: [
      ['doctor', 'Travel clinic visit done', 'Vaccinations, personal medication, altitude questions.'],
      ['diamox', 'Altitude medication discussed with a doctor', 'Whether to carry acetazolamide, and how to use it.'],
      ['meds', 'Personal medication for the whole trip, plus spare', 'In the day pack, not the porter’s bag.'],
      ['firstaid', 'Small first-aid kit packed', 'Blister plasters, tape, painkillers, rehydration salts, antiseptic.'],
      ['stomach', 'Stomach kit packed', 'Loperamide and whatever your doctor advises for travellers’ diarrhoea.'],
      ['symptoms', 'Symptoms of altitude sickness read and understood', 'See the Altitude tab.'],
      ['fitness', 'Trained with a loaded pack on hills', 'Back-to-back days of five to seven hours.'],
      ['dentist', 'Dental check before leaving', 'Toothache at 4,000 m is a long way from a dentist.'],
      ['sun', 'Sunscreen SPF 50 and lip balm with SPF', 'The sun at 5,000 m burns fast, also under cloud.'],
      ['sanitizer', 'Hand sanitiser', 'Before every meal.'],
    ],
  },
  {
    group: 'Clothing',
    items: [
      ['base', 'Two base-layer tops and one pair of long johns', 'Wool or synthetic, never cotton.'],
      ['fleece', 'Fleece or light insulated mid-layer', ''],
      ['down', 'Down or synthetic jacket', 'For evenings from Manang on, and for the pass.'],
      ['shell', 'Waterproof shell jacket and trousers', ''],
      ['trousers', 'Two pairs of trekking trousers', ''],
      ['shirts', 'Two or three trekking shirts', ''],
      ['underwear', 'Underwear and four pairs of trekking socks', 'One pair kept dry for sleeping.'],
      ['hat-warm', 'Warm hat and a buff', ''],
      ['hat-sun', 'Sun hat or cap', ''],
      ['gloves', 'Liner gloves and warm outer gloves or mitts', 'Hands suffer most at 4 am on the pass.'],
      ['sunglasses', 'Sunglasses, category 3 or 4', 'Essential on snow.'],
      ['town', 'One set of clean clothes left in Kathmandu', ''],
    ],
  },
  {
    group: 'Footwear and carrying',
    items: [
      ['boots', 'Broken-in trekking boots', 'Never new boots on this trek.'],
      ['sandals', 'Sandals or light shoes for the lodge', ''],
      ['spikes', 'Microspikes in winter or early spring', 'Ask in Manang whether the pass is icy.'],
      ['poles', 'Trekking poles', 'They earn their place on the descent to Muktinath and the steps to Tikhedhunga.'],
      ['daypack', 'Day pack of 25–35 litres with a rain cover', ''],
      ['duffel', 'Duffel or pack for the porter, with a padlock', 'Often supplied by the agency.'],
      ['drybags', 'Dry bags or bin liners inside both packs', ''],
    ],
  },
  {
    group: 'Sleep, water and food',
    items: [
      ['bag', 'Sleeping bag comfortable to about −10 °C', 'Can be rented in Kathmandu or Pokhara.'],
      ['liner', 'Sleeping bag liner', ''],
      ['bottles', 'Two one-litre bottles, or a bottle and a bladder', 'A metal bottle doubles as a hot-water bottle.'],
      ['treatment', 'Water treatment: filter, UV pen or chlorine dioxide', 'Never rely on finding bottled water.'],
      ['snacks', 'Snacks for the pass day', 'Things you can eat with gloves on and no appetite.'],
      ['electrolytes', 'Electrolyte tablets', ''],
    ],
  },
  {
    group: 'Electronics and navigation',
    items: [
      ['headtorch', 'Head torch with spare batteries', 'The pass and Poon Hill both start in the dark.'],
      ['powerbank', 'Power bank, about 20,000 mAh', ''],
      ['adapter', 'Universal adapter and cables', 'Types C, D and M are in use.'],
      ['offline', 'This site opened once online, so it is saved on the phone', 'Then test it in flight mode.'],
      ['offlinemap', 'Offline map of the region downloaded', ''],
      ['gpx', 'Route exported as GPX and loaded in your map app', 'From the Relief 3D tab.'],
      ['sim', 'Local SIM or eSIM arranged', ''],
      ['camera', 'Camera, cards and a spare battery', ''],
    ],
  },
  {
    group: 'Toiletries and small things',
    items: [
      ['toilet', 'Toilet paper', 'Lodges rarely supply it. Bin it, do not flush it.'],
      ['towel', 'Quick-dry towel', ''],
      ['wipes', 'Biodegradable wipes', 'Showers get rare and cold above Manang.'],
      ['toothbrush', 'Toothbrush, paste, soap', ''],
      ['earplugs', 'Earplugs', 'Plywood walls.'],
      ['repair', 'Repair kit: tape, cord, needle and thread', ''],
      ['book', 'A book or cards for the afternoons', ''],
    ],
  },
  {
    group: 'Money and logistics',
    items: [
      ['cash', 'Rupees for the whole trek, in small notes', 'Withdraw in Kathmandu or Pokhara.'],
      ['usd', 'Some US dollars for the visa and emergencies', ''],
      ['cards', 'Two bank cards kept in different places', ''],
      ['tips', 'Tip for guide and porter set aside', 'Ask your agency what is customary.'],
      ['storage', 'Luggage storage arranged at the Kathmandu hotel', ''],
      ['bufferday', 'One spare day kept in the plan', 'Weather on the pass decides, not the calendar.'],
    ],
  },
];

// ---------------- the journey to and from the trail ----------------
export const HUBS = [
  { id: 'del', name: 'Delhi', lon: 77.1, lat: 28.56 },
  { id: 'doh', name: 'Doha', lon: 51.61, lat: 25.27 },
  { id: 'dxb', name: 'Dubai', lon: 55.36, lat: 25.25 },
  { id: 'ist', name: 'Istanbul', lon: 28.75, lat: 41.27 },
  { id: 'bkk', name: 'Bangkok', lon: 100.75, lat: 13.69 },
  { id: 'kul', name: 'Kuala Lumpur', lon: 101.71, lat: 2.75 },
  { id: 'sin', name: 'Singapore', lon: 103.99, lat: 1.36 },
];

export const HOMES = [
  { id: 'arn', name: 'Stockholm', lon: 17.92, lat: 59.65 },
  { id: 'cph', name: 'Copenhagen', lon: 12.65, lat: 55.62 },
  { id: 'osl', name: 'Oslo', lon: 11.1, lat: 60.19 },
  { id: 'hel', name: 'Helsinki', lon: 24.96, lat: 60.32 },
  { id: 'lhr', name: 'London', lon: -0.45, lat: 51.47 },
  { id: 'ams', name: 'Amsterdam', lon: 4.76, lat: 52.31 },
  { id: 'fra', name: 'Frankfurt', lon: 8.57, lat: 50.03 },
  { id: 'cdg', name: 'Paris', lon: 2.55, lat: 49.01 },
  { id: 'mad', name: 'Madrid', lon: -3.57, lat: 40.47 },
  { id: 'fco', name: 'Rome', lon: 12.25, lat: 41.8 },
  { id: 'otp', name: 'Bucharest', lon: 26.1, lat: 44.57 },
  { id: 'jfk', name: 'New York', lon: -73.78, lat: 40.64 },
  { id: 'yyz', name: 'Toronto', lon: -79.63, lat: 43.68 },
  { id: 'lax', name: 'Los Angeles', lon: -118.41, lat: 33.94 },
  { id: 'gru', name: 'São Paulo', lon: -46.47, lat: -23.43 },
  { id: 'jnb', name: 'Johannesburg', lon: 28.24, lat: -26.13 },
  { id: 'syd', name: 'Sydney', lon: 151.18, lat: -33.94 },
  { id: 'nrt', name: 'Tokyo', lon: 140.39, lat: 35.77 },
];

export const DOOR_TO_DOOR = [
  { when: 'Before day 1', what: 'Home → Kathmandu', text: 'Tribhuvan International is Nepal’s main gateway. Most long-haul routes connect through Delhi, the Gulf, Istanbul or south-east Asia. Land with a day in hand: bags sometimes arrive a flight later.' },
  { when: 'Day 3', what: 'Kathmandu → Besisahar → Jagat', text: 'About 175 km to Besisahar by bus or car (6–7 hours), then a shared jeep up the Marsyangdi road. You can ride further, to Dharapani or Chame, and save a day or two of walking.', day: 3 },
  { when: 'Days 4–12', what: 'On foot over Thorong La', text: 'Jagat to Jomsom on the trail, with an acclimatisation day in Manang. About 115 km, with the pass at 5,416 m on day 11.', day: 4 },
  { when: 'Day 13', what: 'Jomsom → Tatopani', text: 'A short walk to Marpha, then bus or jeep down the Kali Gandaki. The alternative is a 20-minute morning flight from Jomsom to Pokhara, which ends the trek here when the weather allows it.', day: 13 },
  { when: 'Days 14–15', what: 'Ghorepani, Poon Hill and out', text: 'Two more walking days through the rhododendron forest, a sunrise from Poon Hill, and a taxi or bus from Nayapul to Pokhara (about 1.5 hours).', day: 14 },
  { when: 'Day 17', what: 'Pokhara → Kathmandu', text: 'A 25-minute flight or a 7–9 hour tourist bus. Flights are frequently delayed, so do not connect to an international departure the same day.', day: 17 },
  { when: 'After day 18', what: 'Kathmandu → home', text: 'A full buffer day before the flight home protects you from a late domestic flight, a blocked road or a slow pass crossing.' },
];

export const VARIANTS = [
  { title: 'Shorter: ride further, fly out', text: 'Take the jeep to Chame on day 3 and fly Jomsom → Pokhara after the pass. That is about 12 days Kathmandu to Kathmandu, with the same acclimatisation.' },
  { title: 'Longer: Tilicho Lake', text: 'From Manang, a three-day detour by Khangsar and Tilicho Base Camp to the lake at 4,919 m. It adds height slowly and rejoins the main trail at Yak Kharka.' },
  { title: 'Gentler on the body', text: 'Sleep in Lower Pisang instead of Upper Pisang, and add a second night in Chame or at Yak Kharka. Both keep the nightly gain under 500 m.' },
];
