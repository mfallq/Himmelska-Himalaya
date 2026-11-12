// Day-by-day guidance, days 1–9. See details.js for the shape of an entry.

export const DETAILS_A = {
  1: {
    summary: 'Arrival day carries no programme on purpose. Tribhuvan airport is small and slow, the drive into town is short, and the best thing you can do for the trek is sleep at a sensible hour. The mountains are not visible from the city on most days: they start for real in two days’ time.',
    thread: [
      { label: 'Before you land', text: 'Fill in the online visa form within two weeks of arrival if you want to skip the kiosk queue, and keep the fee in clean US dollar notes.', points: ['Passport, a photo and the address of your first hotel in your hand luggage.', 'Wear or carry your boots: they are the one thing you cannot replace if a bag is late.'] },
      { label: 'At the airport', text: 'Visa kiosk or printed form, then the bank counter to pay, then immigration. Bags come out slowly.', points: ['Change a little money or use the ATM in arrivals for the taxi.', 'SIM kiosks sit just outside arrivals: you need your passport and a photo.'] },
      { label: 'In town', text: 'Thamel is the trekkers’ quarter, loud and convenient. Boudha is quieter and sits beside the great stupa.', points: ['Drink bottled or treated water from the first hour.', 'A short walk in daylight helps more against jet lag than a nap.'] },
      { label: 'Evening', text: 'Eat somewhere busy, lay out the papers for tomorrow’s permit, and go to bed.', points: ['Put passport, photos and insurance details in one pouch.', 'Message home that you have landed.'] },
    ],
    paces: [
      { label: 'Low energy', text: 'Hotel, shower, dal bhat, bed. Nothing else is needed today.' },
      { label: 'Normal pace', text: 'An hour’s walk through Thamel to find the gear shops you may want tomorrow.' },
      { label: 'With energy to spare', text: 'Taxi to Boudhanath and walk the circuit around the stupa with the evening crowd.' },
    ],
    stops: [
      { name: 'Thamel', text: 'A tangle of lanes full of gear shops, bakeries and bookshops. Almost everything on the kit list can be bought or rented here.', field: 'Note which shops rent sleeping bags and down jackets, and what they charge per day.', frame: 'Look up: the lanes are roofed with prayer flags and cables.' },
      { name: 'Boudhanath', text: 'One of the largest stupas in the world and the heart of Tibetan Buddhism in Nepal. Pilgrims walk it clockwise at dawn and dusk.', field: 'Walk clockwise with everyone else. Rooftop cafés give the view without the crowd.', frame: 'The painted eyes in low evening light, from the upper terrace.' },
    ],
    stories: [
      { title: 'A valley that was a lake', text: 'Geology and legend agree that the Kathmandu Valley once held a lake. In the Buddhist telling, the bodhisattva Manjushri cut the gorge at Chobhar with his sword and drained it so people could reach the lotus that became Swayambhunath.' },
      { title: 'Three kingdoms in one valley', text: 'Kathmandu, Patan and Bhaktapur were rival Malla kingdoms until 1768, each building a palace square to outdo the others. The 2015 earthquake damaged all three, and much has been rebuilt since.' },
    ],
    wear: ['Light clothes for the valley: Kathmandu is warm by day and mild at night in the trekking seasons.', 'Something that covers shoulders and knees if you visit a temple.'],
    pack: ['Passport, visa fee in US dollars, a photo.', 'Insurance details and your first hotel’s address on paper.'],
    ask: ['Where and when do we meet the guide tomorrow?', 'Which permits does the agency arrange, and which do I pay for myself?', 'Can the hotel store a bag while I am on the trek?'],
    notes: {
      permits: 'The visa is paid at the airport bank counter before the immigration desk. The fees usually quoted are USD 30, 50 and 125 for 15, 30 and 90 days: check the current list.',
      health: 'At 1,400 m there is nothing to acclimatise to yet. Protect your stomach: treated water, peeled fruit, busy kitchens.',
      money: 'ATMs in Thamel dispense limited amounts per withdrawal and charge a fee. Start collecting rupees for the trek over two days.',
      power: 'Save this site for offline use now, while the hotel Wi-Fi is good, and test it in flight mode.',
    },
  },

  2: {
    summary: 'The day in Kathmandu that makes the rest work. Papers first: the conservation area permit, a look at the insurance, the guide’s briefing. Then kit: whatever is missing gets rented or bought. What is left of the afternoon belongs to one of the valley’s great monuments.',
    thread: [
      { label: 'Morning', text: 'Meet your guide and go through the plan day by day, including what happens if someone is unwell before the pass.', points: ['Hand over passport copies and photos for the permit.', 'Agree a turnaround rule for the pass now, not at 5,000 m.'] },
      { label: 'Midday', text: 'Kit check. Lay everything out and let the guide look at boots, sleeping bag, shell and gloves.', points: ['Rent a warmer sleeping bag or down jacket if yours is marginal.', 'Buy water treatment, sunscreen and snacks here, not on the trail.'] },
      { label: 'Afternoon', text: 'Choose one sight and do it slowly. Swayambhunath for the view over the city, Patan for the square and its museum, or Pashupatinath on the river.', points: ['At Pashupatinath, do not photograph grieving families at the cremation ghats.'] },
      { label: 'Evening', text: 'Pack two bags: the duffel for the porter and the day pack you carry. Leave city clothes at the hotel.', points: ['Charge everything. Weigh the duffel.', 'Early night: tomorrow’s road is long.'] },
    ],
    paces: [
      { label: 'Low energy', text: 'Do the permit and the kit check, then rest. The sights will still be here on day 18.' },
      { label: 'Normal pace', text: 'Papers and kit by lunch, Swayambhunath in the late afternoon.' },
      { label: 'With energy to spare', text: 'Add Patan Durbar Square and its museum, one of the best in South Asia.' },
    ],
    stops: [
      { name: 'Swayambhunath', text: 'The stupa on the hill west of the city, reached by a long stone stairway and shared with a large troop of monkeys.', field: 'Keep food out of sight. Go an hour before sunset for the light over the valley.', frame: 'The stupa spire with the city spread out below.' },
      { name: 'Patan Durbar Square', text: 'The most complete of the three royal squares: stone and brick temples, carved struts, and a palace museum of bronze and wood.', field: 'The museum courtyard café is a quiet place to finish your packing list.', frame: 'Rows of temple roofs from the upper windows of the museum.' },
    ],
    stories: [
      { title: 'Five colours in the wind', text: 'Prayer flags come in a fixed order: blue for sky, white for air, red for fire, green for water, yellow for earth. They are not prayers to a god. The wind is meant to carry their goodwill to everyone.' },
      { title: 'A park that people live in', text: 'The Annapurna Conservation Area is Nepal’s largest protected area and, unusually, is managed with the villages inside it rather than around them. Your permit fee is meant to fund trails, schools and forest work there.' },
    ],
    wear: ['City clothes. Break in nothing new today.'],
    pack: ['Permit documents and photos.', 'A written kit list to tick off with the guide.'],
    ask: ['Is a TIMS card needed this season, and is it included?', 'Where do we stop if the road beyond Besisahar is blocked?', 'What is your turnaround time on the pass?'],
    notes: {
      permits: 'The ACAP permit costs NPR 3,000 for most foreigners and is issued by the National Trust for Nature Conservation, through the tourism board office or online. It is checked at Besisahar, Dharapani, Chame, Manang and again on the far side.',
      gear: 'Renting a sleeping bag and down jacket in Thamel is cheap and normal. Check zips and loft before you pay.',
      money: 'Withdraw the cash for the whole trek between today and tomorrow morning. Small notes are useful above Manang.',
      health: 'If you start the trek with a cold or an upset stomach, say so now. Both make altitude harder.',
    },
  },

  3: {
    summary: 'About 175 km on the highway to Besisahar, then a rough jeep road up the Marsyangdi. It is a tiring day without a single step of trekking, and the reward is waking tomorrow already inside the gorge. If you would rather walk more and ride less, stop at Bhulbhule; if you are short of days, ride on to Dharapani or Chame.',
    thread: [
      { label: 'Before you leave', text: 'An early start beats the traffic out of the valley. Keep the day pack with you and the duffel on the roof or in the back.', points: ['Motion-sickness tablets if you need them: the road bends for hours.', 'Water and snacks within reach.'] },
      { label: 'On the highway', text: 'The road follows the Trishuli river west, turns north at Dumre and reaches Besisahar by early afternoon.', points: ['Lunch stops are roadside dal bhat kitchens: choose a busy one.', 'The permit is checked at Besisahar.'] },
      { label: 'Up the Marsyangdi', text: 'Shared jeeps leave Besisahar when full. The track passes Bhulbhule, Bahundanda and Syange with its waterfall before Jagat.', points: ['Expect dust, bumps and waits for vehicles coming the other way.', 'In the monsoon and just after, landslides can close the road for hours.'] },
      { label: 'Evening', text: 'Jagat is a single street on a ledge above the river. Stretch, eat, repack for walking.', points: ['Sort the day pack for tomorrow: sun hat, water, rain shell.'] },
    ],
    paces: [
      { label: 'Low energy', text: 'Take a private vehicle to Besisahar and sleep there. Start the jeep road fresh tomorrow.' },
      { label: 'Normal pace', text: 'Bus or car to Besisahar and a shared jeep to Jagat, as planned.' },
      { label: 'Short of days', text: 'Continue by jeep to Dharapani or Chame and begin walking a day or two further up.' },
    ],
    stops: [
      { name: 'Besisahar', text: 'The last proper town: banks, pharmacies, the first checkpoint, and the jeep stand for everything further up.', field: 'Buy anything you forgot here. Above this, choice shrinks and prices rise.', frame: 'The jeep stand: loaded roofs, sacks of rice, and the first white summits behind.' },
      { name: 'Bahundanda', text: 'A village on a saddle, its name meaning “Brahmin hill”. The old trail climbs over it; the road stays below.', field: 'From the road you see only the ridge. The view is the terraced hillsides dropping to the river.', frame: 'Rice terraces stepping down to the Marsyangdi.' },
      { name: 'Jagat', text: 'Once a toll post on the salt road to Tibet. “Jagat” means customs station.', field: 'Walk to the end of the village at dusk for the view down the gorge.', frame: 'The single stone-paved street in evening light.' },
    ],
    stories: [
      { title: 'The river you will follow for a week', text: 'The Marsyangdi rises on the far side of the Annapurna range, near Tilicho and Thorong, and cuts south between Annapurna and Manaslu. You follow it almost to its source.' },
      { title: 'Salt for grain', text: 'For centuries caravans carried Tibetan salt south and lowland grain north along this valley. Jagat taxed them. The trade faded after the Tibetan border closed in 1959, and trekkers arrived in its place from 1977, when Manang opened to foreigners.' },
    ],
    wear: ['Loose clothes for a hot vehicle.', 'A buff or scarf for the dust on the jeep road.'],
    pack: ['Water, snacks, tablets for motion sickness.', 'Permit and passport where a checkpoint can see them.', 'A layer for the evening: Jagat is cooler than Kathmandu.'],
    ask: ['Is the road open all the way today?', 'Where do we change vehicles, and how long is the wait?', 'Which side of the river does tomorrow’s trail take?'],
    notes: {
      route: 'Dumre is the turn-off from the Kathmandu–Pokhara highway. Besisahar is 43 km north of it, Jagat roughly 30 km beyond by track.',
      weather: 'Landslides are the real hazard on this road, most often from June to September and after heavy rain.',
      lodging: 'Jagat has a dozen simple lodges. Rooms are basic and warm at this height.',
      permits: 'First ACAP check at Besisahar. Without a permit you pay double at the checkpoint.',
    },
  },

  4: {
    summary: 'A day in the narrowest part of the gorge. The trail and the jeep road swap banks, and wherever there is a choice the walking path takes the quieter side. It is warm, green and loud with water. Tal, the sandy flat where a lake once stood, marks the entrance to Manang district, and Dharapani is where the Manaslu circuit comes in from the east.',
    thread: [
      { label: 'Before you leave', text: 'Start by 7:00. The gorge is hot by late morning and the day has more ups and downs than its modest height gain suggests.', points: ['Two litres of treated water from the lodge.', 'Sun hat on, rain shell at the top of the pack.'] },
      { label: 'On the trail', text: 'Past Chamje and its waterfall, across a suspension bridge to the east bank, then a steep climb before the valley opens suddenly at Tal.', points: ['On bridges, let mules cross first and keep to one side.', 'Where the trail meets the road, look for the red-and-white marks that lead off it again.'] },
      { label: 'At Dharapani', text: 'A long village strung along the river. The checkpoint stamps your permit, and lodges at the upper end are quieter.', points: ['Have the permit ready at the police post.', 'Look east up the side valley: that is the way to Manaslu and the Larkya La.'] },
      { label: 'Evening', text: 'First trekking night. Wash socks, look at your feet, and treat any hot spot before it becomes a blister.', points: ['Order dinner when you arrive: kitchens cook in order.', 'Note today’s water and pace: it is your baseline for the days above.'] },
    ],
    paces: [
      { label: 'Low energy', text: 'Stop for the night at Tal, about four hours in, and make tomorrow longer.' },
      { label: 'Normal pace', text: 'Lunch at Tal, Dharapani by mid-afternoon.' },
      { label: 'Only with your guide', text: 'Side paths on the east bank avoid more of the road but are narrow and can be damaged after rain. Take them only if your guide knows their state.' },
    ],
    stops: [
      { name: 'Chamje waterfall', text: 'A long fall drops down the opposite wall just before the village. In the weeks after the monsoon it is at its fullest.', field: 'The lodge terraces in Chamje face it: a good first tea stop.', frame: 'The fall with the suspension bridge in the foreground for scale.' },
      { name: 'Tal', text: '“Tal” means lake. A landslide once dammed the river here and the silted lake bed is now the only flat ground for miles. The first village of Manang district.', field: 'Lunch here. The waterfall behind the village is a five-minute walk.', frame: 'The whole flat from the rise where the trail first sees it.' },
      { name: 'Dharapani', text: 'Meeting point of two great treks and the first village with a strong Tibetan feel: mani walls, prayer wheels, a chorten gate.', field: 'Pass mani walls with the wall on your right.', frame: 'The entrance chorten with the valley behind.' },
    ],
    stories: [
      { title: 'A trail cut into rock', text: 'Before the road, the only way through the gorge was a mule path blasted and stepped into the cliffs. Stretches of it survive on the bank opposite the road, and they are the best walking of the day.' },
      { title: 'Entering Manang', text: 'At Tal you cross from Lamjung into Manang, the least populated district in Nepal. From here houses turn from thatch to stone, and prayer flags replace Hindu shrines.' },
    ],
    wear: ['Shorts or light trousers and a light shirt: it is the warmest walking day until Tatopani.', 'Boots already broken in, liner socks if you blister easily.'],
    pack: ['Two litres of water and treatment for refills.', 'Rain shell, sun hat, sunscreen.', 'Permit and passport for Dharapani.'],
    ask: ['Which bank is the trail on today, and where do we join the road?', 'Is there safe water to refill at Tal?', 'How many hours do you expect, at our pace?'],
    notes: {
      permits: 'ACAP and police check at Dharapani. The Manaslu trail joining here needs its own restricted-area permit: you only pass the junction.',
      health: 'Still low. The risks today are heat, dehydration and blisters, not altitude.',
      water: 'Refill and treat at Tal. Streams look clean but there are villages and mule trains above every one of them.',
      route: 'Red-and-white paint marks the main walking route, blue-and-white the side trails. The road is on the west bank for most of the day.',
      weather: 'After heavy rain the gorge sheds rock. Do not linger under cut slopes.',
      photo: 'The gorge is in shade early and late. Waterfalls photograph best mid-morning.',
    },
  },

  5: {
    summary: 'The valley swings west, the forest turns to pine and fir, and the first high peaks appear. Take the footpath through Timang instead of the road: it climbs steeply through the trees and comes out on a shelf with Manaslu filling the view behind you. Chame is the district headquarters and the last place with a real bazaar.',
    thread: [
      { label: 'Before you leave', text: 'It is cooler now: start in a fleece and shed it on the first climb.', points: ['Fill bottles in Dharapani.', 'Keep a warm layer near the top of the pack for Timang.'] },
      { label: 'On the trail', text: 'Bagarchhap and Danaque first, then the steep forest climb to Timang. After that the path undulates through Thanchowk to Koto.', points: ['Timang is the lunch stop with the view.', 'At Koto a checkpoint guards the side valley to Nar and Phu: you walk straight on.'] },
      { label: 'At Chame', text: 'Stone houses, a long mani wall, shops and a bank. Lamjung Himal and Annapurna II stand over the town.', points: ['The hot springs are a few minutes across the river.', 'Last sensible place to buy forgotten kit before Manang.'] },
      { label: 'Evening', text: 'You sleep at 2,670 m, the last night below 3,000. From tomorrow the altitude rules apply.', points: ['Drink a full bottle before bed.', 'Read tomorrow’s altitude note.'] },
    ],
    paces: [
      { label: 'Low energy', text: 'Follow the road from Danaque: longer but gentler, with jeeps for company.' },
      { label: 'Normal pace', text: 'Forest path via Timang, lunch there, Chame by 3 pm.' },
      { label: 'With energy to spare', text: 'Soak in the hot springs at Chame before dinner.' },
    ],
    stops: [
      { name: 'Bagarchhap', text: 'A village with a sad landmark: in November 1995 a landslide after freak storms buried part of it, killing villagers and trekkers. A memorial stands by the trail.', field: 'A quiet place. Read the memorial and walk on.', frame: 'The white gompa against dark pines.' },
      { name: 'Timang', text: 'A hamlet on a sunny shelf at 2,750 m. Turn round: Manaslu, at 8,163 m the world’s eighth highest mountain, rises behind you with its neighbours.', field: 'Sit on a lodge terrace facing east. This is the best Manaslu view of the trek.', frame: 'Manaslu over the roofs, with buckwheat fields in front.' },
      { name: 'Chame', text: 'The capital of Manang district, though it is the size of a village. Its small hot springs sit on the river bank below the bridge.', field: 'Springs are free or nearly so. Go before dusk, when it gets cold fast.', frame: 'The long mani wall with Lamjung Himal above.' },
    ],
    stories: [
      { title: 'The hidden valleys of Nar and Phu', text: 'At Koto a gorge leads north to two villages that were closed to outsiders until 2002. They still need a special permit and a guide, and remain among the most traditional in the region.' },
      { title: 'Why the forest changes', text: 'Between Dharapani and Chame you leave the monsoon’s full force. Broadleaf forest gives way to blue pine, hemlock and fir, and by Pisang the slopes facing south are almost dry.' },
    ],
    wear: ['Trekking trousers, base layer, fleece for stops.', 'Sun hat: the shelf at Timang is exposed.'],
    pack: ['Warm layer and wind shell for lunch at Timang.', 'Swimwear or shorts and a towel for the hot springs.', 'Cash: last bank for several days.'],
    ask: ['Is the forest path to Timang in good condition?', 'Is the ATM in Chame working today?', 'Where do we check the permit?'],
    notes: {
      permits: 'Checkpoint at Chame. Koto’s checkpoint only concerns the Nar-Phu restricted area.',
      health: 'Tomorrow you sleep above 3,000 m for the first time. Tonight: water, a proper dinner, no alcohol.',
      water: 'Safe drinking water stations have operated at Bagarchhap and Chame. Ask if they are open.',
      money: 'Chame has a bank and an ATM that often does not work. Do not count on it.',
      photo: 'Manaslu is clearest in the morning. By afternoon cloud builds on the eastern peaks.',
    },
  },

  6: {
    summary: 'A day with one of the great sights of the circuit. Beyond the apple orchards of Bhratang the path rounds a corner cut into the cliff and you face Paungda Danda, a single smooth wall of rock that curves up for some 1,500 m. From Dhikur Pokhari the valley broadens and dries, and Upper Pisang looks across to the north face of Annapurna II. It is also the first night above 3,000 m, and a bigger jump in sleeping height than the guidelines like.',
    thread: [
      { label: 'Before you leave', text: 'Start slowly on purpose. Today you set the pace you will keep for the next five days.', points: ['Drink half a litre before you set off.', 'Gloves and a hat in the day pack: the valley floor is in shade until mid-morning.'] },
      { label: 'On the trail', text: 'Through forest to Bhratang, then the cliff section and the bridge, then a steady climb through pines to Dhikur Pokhari.', points: ['The Bhratang orchard café is the tea stop: apple juice and pastries.', 'On the cliff section keep to the inside when vehicles pass.'] },
      { label: 'At Upper Pisang', text: 'Cross the river at Dhikur Pokhari and climb to the upper village, about 100 m above Lower Pisang, for the view and the monastery.', points: ['Walk up to the gompa in the late afternoon.', 'Annapurna II turns gold at sunset from the lodge terraces.'] },
      { label: 'Evening', text: 'First check of how you are doing at altitude. Be honest with yourself and your guide.', points: ['A mild headache that fades with water and food is common. One that grows is a signal.', 'Sleep warm: it will freeze tonight.'] },
    ],
    paces: [
      { label: 'Low energy', text: 'Sleep in Lower Pisang, about 100 m lower and a shorter day. Rejoin the high route tomorrow by the bridge.' },
      { label: 'Normal pace', text: 'Lunch at Dhikur Pokhari, Upper Pisang by 2–3 pm, a rest, then the gompa.' },
      { label: 'If altitude worries you', text: 'Add a night in Chame or Bhratang first. It turns one 630 m jump into two small ones.' },
    ],
    stops: [
      { name: 'Bhratang', text: 'Once a base of Tibetan Khampa fighters, now the site of a very large apple farm with a café.', field: 'Fresh apple juice and a doughnut are the tradition here.', frame: 'Rows of apple trees with the valley wall behind.' },
      { name: 'Paungda Danda', text: 'The great rock face, also called Swarga Dwar, the gateway to heaven. Local belief says the spirits of the dead climb it on their way out of the world.', field: 'The best view is from the trail just after the bridge, looking back and up.', frame: 'A person on the trail at the bottom of the frame gives the wall its scale.' },
      { name: 'Upper Pisang gompa', text: 'A rebuilt monastery at the top of the village with a wide terrace facing Annapurna II.', field: 'Evening prayers are usually open to visitors. Shoes off, sit at the back.', frame: 'Prayer flags in the foreground, the north face of Annapurna II behind.' },
    ],
    stories: [
      { title: 'A wall polished by ice', text: 'Paungda Danda is a tilted slab of rock scraped smooth by a glacier that once filled this valley. It rises from about 3,000 m at the river to more than 4,500 m, with almost nothing growing on it.' },
      { title: 'The fighters of Bhratang', text: 'After 1959, Tibetan guerrillas from Kham ran a resistance against China from bases in Mustang and Manang, with foreign backing. Nepal disarmed them in 1974. Bhratang was one of their settlements.' },
    ],
    wear: ['Base layer and trousers, fleece ready for shade.', 'Down jacket for the evening and the gompa terrace.'],
    pack: ['Two litres of water: aim to finish them.', 'Hat, gloves, sunglasses.', 'Head torch for the walk back from the gompa.'],
    ask: ['Upper or Lower Pisang tonight, given how we feel?', 'What time are prayers at the gompa?', 'Which way do we take tomorrow: high route by Ghyaru or the valley?'],
    notes: {
      health: 'Sleeping height rises about 630 m, from 2,670 m to 3,300 m. That is above the 500 m guideline, softened by two nights at 3,540 m to come. Walk slowly, drink, and report symptoms.',
      water: 'Cold air hides thirst. Set a target: a litre by Bhratang, a litre by lunch.',
      route: 'The bridge to Upper Pisang is at Dhikur Pokhari. If you miss it you arrive in Lower Pisang and climb from there.',
      weather: 'Clear mornings, wind up the valley from early afternoon. Nights below freezing from here on.',
      lodging: 'Upper Pisang lodges are simpler than those below, with better views. Rooms are unheated.',
      photo: 'Paungda Danda is lit from the south-east in the morning. Annapurna II from Upper Pisang is a sunset subject.',
    },
  },

  7: {
    summary: 'The day that people remember from the Manang side. Instead of the valley road, the trail climbs to Ghyaru and stays high along the north wall for hours, facing the whole Annapurna chain across the valley. It is longer and harder than the low route and worth all of it. It also follows the best rule there is for altitude: climb high during the day, sleep lower at night.',
    thread: [
      { label: 'Before you leave', text: 'Leave by 7:00. The climb to Ghyaru is steep, in the sun, and best done cool.', points: ['A full two litres: there is little water between Ghyaru and Ngawal.', 'Sunscreen before you start. The high route has no shade.'] },
      { label: 'On the trail', text: 'Down to a bridge, then more than an hour of switchbacks to Ghyaru at 3,730 m. Rest there, then contour for two hours to Ngawal.', points: ['Count your breathing on the switchbacks and keep a pace you could talk at.', 'Lunch in Ngawal. From there it is downhill to the valley floor at Mungji.'] },
      { label: 'At Manang', text: 'Past Braga and its old monastery to Manang, the largest village above Chame, with bakeries, shops and the rescue association’s aid post.', points: ['If you have energy, visit Braga gompa on the way through.', 'Choose a lodge with a sunny dining room: you are here two nights.'] },
      { label: 'Evening', text: 'You climbed to 3,730 m and sleep at 3,540 m. Expect to sleep better than last night.', points: ['Plan tomorrow’s acclimatisation walk with your guide.', 'Check the time of the altitude talk.'] },
    ],
    paces: [
      { label: 'Low energy', text: 'Take the valley route through Humde: about 17 km, nearly flat, three hours shorter. You lose the views but arrive rested.' },
      { label: 'Normal pace', text: 'Ghyaru by 9:00, Ngawal for lunch, Manang by 4 pm.' },
      { label: 'Only with your guide', text: 'From Ngawal a higher path continues toward the caves above Braga. It is exposed in places and adds time.' },
    ],
    stops: [
      { name: 'Ghyaru', text: 'A cluster of stone houses stacked up the hillside, with a chorten and prayer wheels at the top of the climb. Annapurna II, IV and III stand directly opposite.', field: 'Stop for tea on a roof terrace and let your pulse settle before walking on.', frame: 'Flat stone roofs in the foreground, the ice of Annapurna II behind.' },
      { name: 'Ngawal', text: 'A larger village on the same shelf, with an old gompa above it and fields of buckwheat and potatoes.', field: 'Lunch stop. Fill bottles here.', frame: 'The line of chortens at the village entrance, with Gangapurna and Tilicho Peak down-valley.' },
      { name: 'Braga gompa', text: 'A monastery of some five centuries built against a cliff, the oldest in the district, with rows of clay statues inside.', field: 'Ask in the village for the key-holder. A small donation is expected.', frame: 'The white buildings stepped up the eroded cliff, best in afternoon light.' },
    ],
    stories: [
      { title: 'The traders of Manang', text: 'With too little land to live on, the people of upper Manang became long-distance traders. In the 1780s the king granted them freedom from customs duties, and Manangi merchants went on to do business from Hong Kong to Bangkok.' },
      { title: 'A valley in the rain shadow', text: 'The Annapurna chain stops the monsoon. Upper Manang receives a fraction of the rain that falls on the southern side, which is why the hills are bare and brown and the houses have flat roofs.' },
    ],
    wear: ['Base layer and sun shirt, wind shell handy.', 'Sun hat and sunglasses all day.', 'Down jacket in the pack for stops and for the evening.'],
    pack: ['Two litres of water and snacks: little is sold between the villages.', 'Sunscreen and lip balm.', 'Camera with a charged battery: this is the day you use it most.'],
    ask: ['How long is the climb to Ghyaru at our pace?', 'Is Braga gompa open this afternoon?', 'When is the altitude talk in Manang tomorrow?'],
    notes: {
      health: 'High point 3,730 m, sleeping at 3,540 m: a net gain of only 240 m on last night. This is acclimatisation working for you.',
      water: 'Carry all you need from Upper Pisang to Ngawal. Refill there.',
      route: 'The high route leaves Upper Pisang westward and does not go back to Lower Pisang. It rejoins the valley road at Mungji, below Braga.',
      weather: 'A strong wind blows up the valley after midday, colder than the sun suggests.',
      money: 'Manang has shops and a small bank, but treat any ATM here as out of order until proven otherwise.',
      photo: 'Morning light falls on the Annapurna faces across the valley. Ghyaru between 8 and 10 is the moment.',
    },
  },

  8: {
    summary: 'A second night at 3,540 m lets your body catch up before the trail goes higher. The day is for walking uphill without a load and coming back down: that is what makes the next three days easier. Manang itself is the most comfortable village above Chame, with bakeries, a small cinema and, in the trekking seasons, a daily talk on altitude from the volunteer doctors of the Himalayan Rescue Association.',
    thread: [
      { label: 'Morning', text: 'Pick a walk that matches how you feel. Even the shortest option gains a few hundred metres, which is the point.', points: ['Light day pack: water, shell, snacks, warm layer.', 'Start by 8:00 for the longer options.'] },
      { label: 'Midday', text: 'Come back down for lunch, or eat on the hill if you went to Ice Lake.', points: ['Drink steadily: three to four litres across the day.'] },
      { label: 'Afternoon', text: 'The altitude talk is usually in mid-afternoon at the aid post. It is free, short, and the best-informed half hour of the trek.', points: ['Ask the doctors anything about symptoms or medication.', 'Laundry dries in an hour in the sun and wind.'] },
      { label: 'Evening', text: 'Decide with your guide whether everyone is fit to go on. A third night here is always possible.', points: ['Buy snacks for the pass.', 'Charge everything: power gets scarce and costly above.'] },
    ],
    paces: [
      { label: 'Low energy', text: 'Gangapurna Lake and the viewpoint above it: about two hours there and back, up to around 3,800 m.' },
      { label: 'Normal pace', text: 'Praken Gompa, a hermitage on the cliff above the village at about 3,950 m. Three hours return.' },
      { label: 'Strong and feeling well', text: 'Ice Lake above Braga, 4,600 m. A climb of 1,100 m and five to seven hours. Only if you have no symptoms at all.' },
    ],
    stops: [
      { name: 'Gangapurna Lake', text: 'A grey-green lake below the snout of the Gangapurna glacier, ten minutes from the village, with a marked viewpoint on the moraine above.', field: 'Climb to the viewpoint flags for the icefall and the whole of Manang below.', frame: 'The icefall of Gangapurna reflected in the lake on a still morning.' },
      { name: 'Praken Gompa', text: 'A small cave hermitage where a lama has long given blessings for a safe crossing of the pass.', field: 'A steep path, with the best overview of the valley. Bring a small donation.', frame: 'Manang’s flat roofs far below, the glacier opposite.' },
      { name: 'Ice Lake (Kicho Tal)', text: 'Two small lakes on a high shelf north of Braga with a view of the entire Annapurna range, from Annapurna II to Tilicho Peak.', field: 'Turn back by 1 pm whatever happens. Frozen from late autumn.', frame: 'The range mirrored in the lake, early, before the wind.' },
      { name: 'HRA aid post', text: 'A clinic staffed in season by volunteer doctors, funded by consultations and donations.', field: 'Go to the talk even if you feel fine. It may be someone else you help later.', frame: 'None needed. Listen instead.' },
    ],
    stories: [
      { title: 'Doctors on the trail', text: 'The Himalayan Rescue Association was founded in 1973, after trekkers began dying of altitude illness that nobody recognised. Its posts at Manang and at Pheriche on the Everest trail have taught a simple rule to generations of walkers: if you feel unwell at altitude, it is altitude until proven otherwise.' },
      { title: 'A glacier in retreat', text: 'Gangapurna Lake did not exist a few generations ago. It filled as the glacier pulled back up the mountain, and the bare moraine you climb to the viewpoint was under ice within living memory.' },
    ],
    wear: ['Walking layers as on a trekking day, with the down jacket in the pack.', 'Warm hat and gloves if you go to Ice Lake.'],
    pack: ['Water, snacks, shell, sunscreen.', 'Head torch if you choose the long option.', 'Questions for the doctors.'],
    ask: ['Which walk suits each of us today?', 'What time is the altitude talk?', 'Is everyone fit to go higher tomorrow?'],
    notes: {
      health: 'No gain in sleeping height today. The walk is the treatment: go at least 300 m above the village and come back. Persistent headache, nausea or breathlessness at rest: see the aid post.',
      water: 'Manang has had a safe drinking water station. Otherwise treat lodge water.',
      power: 'Charge every device and the power bank tonight.',
      money: 'Last shops with real choice. Buy chocolate, nuts and anything else you want on the pass.',
      weather: 'Ask the lodge or the aid post for the forecast for the next three days. Snow on the pass changes the plan.',
      photo: 'Gangapurna’s icefall is in sun from mid-morning. From Praken, the best light on the village is in the afternoon.',
    },
  },

  9: {
    summary: 'Half a day of walking and half a day of rest, on purpose. The trail leaves the Marsyangdi, turns up the side valley of the Jarsang Khola and climbs gently past the last trees. Sleeping height goes up by about 500 m, the most the guidelines suggest, so the afternoon is for doing very little at the new altitude.',
    thread: [
      { label: 'Before you leave', text: 'No rush: this is a three to four hour day. Leave after the sun reaches the village.', points: ['Water for the whole walk: the tea houses at Gunsang are the only stop.', 'Full warm kit in the day pack from now on.'] },
      { label: 'On the trail', text: 'Up through Tenki, the last permanent houses of Manang, to Gunsang on its ledge, then a long gentle traverse to Yak Kharka.', points: ['Walk at a pace where you can breathe through your nose.', 'Look for blue sheep on the slopes across the stream.'] },
      { label: 'At Yak Kharka', text: 'A few lodges in open pasture. Arrive, drink, eat, rest.', points: ['Late afternoon: stroll 100–150 m up the ridge behind the lodges and come back down.', 'Dining rooms are heated with yak dung from about 5 pm.'] },
      { label: 'Evening', text: 'Sleep is lighter at this height and waking at night is normal. A headache that will not shift is not.', points: ['Hot water bottle in the sleeping bag.', 'Keep water where it will not freeze.'] },
    ],
    paces: [
      { label: 'Low energy', text: 'Stop at Gunsang for a long tea and take the second half very slowly. There is no reason to arrive before 2 pm.' },
      { label: 'Normal pace', text: 'Three and a half hours with one stop, lunch at Yak Kharka.' },
      { label: 'Feeling strong', text: 'Continue an hour to Ledar at 4,200 m only if nobody in the group has symptoms. It shortens tomorrow but raises tonight’s gain to 660 m.' },
    ],
    stops: [
      { name: 'Tenki', text: 'The last proper village in the valley, a few minutes above Manang, with old houses and a view straight back at the Annapurnas.', field: 'Turn round here: this is the widest view of Gangapurna and Annapurna III you will get.', frame: 'The chorten gate with the glacier behind.' },
      { name: 'Gunsang', text: 'Two or three tea houses on a flat shoulder at about 3,900 m.', field: 'The natural halfway stop. Seabuckthorn juice is the local drink: sharp, orange and full of vitamin C.', frame: 'The valley you have walked, from the terrace.' },
      { name: 'Yak Kharka', text: 'The name means yak pasture. Herds graze here in summer and you may meet stragglers.', field: 'Give yaks room and never stand downhill of them on a narrow path.', frame: 'Grazing animals against Chulu West in evening light.' },
    ],
    stories: [
      { title: 'Yak, nak and dzo', text: 'Strictly, a yak is the bull and a nak the cow, so “yak cheese” is a small joke. Lower down you meet dzo, a yak-cattle cross that copes better with warmth. True yaks sicken below about 3,000 m.' },
      { title: 'Blue sheep and what follows them', text: 'The grey animals on the far slopes are bharal, or blue sheep. They are the main prey of the snow leopard, which lives in these valleys and is almost never seen.' },
    ],
    wear: ['Base layer, fleece, wind shell.', 'Hat and gloves to hand.', 'Down jacket as soon as you stop.'],
    pack: ['Two litres of water.', 'Snacks: lunch may be late.', 'Sunglasses and sunscreen: the air is thin and very bright.'],
    ask: ['Yak Kharka or Ledar tonight?', 'What is the forecast for the pass in two days?', 'Where do we walk this afternoon for acclimatisation?'],
    notes: {
      health: 'Sleeping gain about 510 m, to 4,050 m. Arrive early, rest, drink. Do not go higher tomorrow if symptoms appear tonight and persist in the morning.',
      water: 'Lodges sell boiled water. Treat anything else. Thirst is a poor guide up here: watch the colour of your urine instead.',
      route: 'An obvious single trail. The turning for Tilicho Lake goes left at Manang, not this way.',
      weather: 'Sunny mornings, cold wind by 2 pm, hard frost at night.',
      power: 'Charging is paid for and slow from here to Muktinath. Use flight mode.',
      lodging: 'A handful of lodges with limited rooms. In October and November arrive by early afternoon.',
    },
  },
};
