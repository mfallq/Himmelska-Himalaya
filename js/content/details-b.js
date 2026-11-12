// Day-by-day guidance, days 10–18. See details.js for the shape of an entry.

export const DETAILS_B = {
  10: {
    summary: 'A short, serious day. The trail climbs past Ledar, drops to cross the stream and then traverses a slope of loose rock to the lodges at Thorong Phedi, the “foot of the hill”. The afternoon decides tomorrow: a walk partway toward High Camp and back, an early dinner, bags packed, and an honest conversation about how everyone feels.',
    thread: [
      { label: 'Before you leave', text: 'Leave by 8:00 so you arrive for lunch and have the whole afternoon at the new height.', points: ['Wear everything warm from the start: the valley is in shade.', 'Check the forecast with the lodge before you go.'] },
      { label: 'On the trail', text: 'An hour to Ledar, then a climbing traverse, a descent to a wooden bridge and tea house, and the final path across the scree.', points: ['On the scree section do not stop: small rocks come down, especially after frost thaws.', 'Keep a steady, slow rhythm. Arriving early matters more than arriving fast.'] },
      { label: 'At Thorong Phedi', text: 'A large lodge complex in a rocky bowl at 4,450 m. Eat a hot lunch, drink, lie down for an hour.', points: ['Mid-afternoon: walk 150–200 m up the High Camp path and come back down.', 'Fill bottles with boiled water for the morning.'] },
      { label: 'Evening', text: 'Dinner by 6:00, bed by 7:30. Lay out every layer, the head torch and the snacks so that 4 am needs no thinking.', points: ['Tell your guide about any headache, nausea or breathlessness at rest.', 'Sleep with batteries, phone and one water bottle inside the bag.'] },
    ],
    paces: [
      { label: 'Low energy or any symptoms', text: 'Stay in Phedi tomorrow, or go back down to Yak Kharka or Manang. Nobody crosses the pass with altitude sickness.' },
      { label: 'Normal pace', text: 'Sleep at Thorong Phedi and start at 4–5 am.' },
      { label: 'Only if well acclimatised', text: 'Continue an hour to High Camp at 4,880 m. It shortens the pass day, but you sleep 830 m higher than last night and most people sleep badly there.' },
    ],
    stops: [
      { name: 'Ledar', text: 'The last cluster of lodges with a view back down the valley, at about 4,200 m.', field: 'A tea stop. Check each other: appetite, mood, balance.', frame: 'The valley closing in ahead, with the trail a thin line on the slope.' },
      { name: 'The bridge and tea house', text: 'The stream is crossed on a small bridge at the low point of the day, with a tea house on the far side.', field: 'Last comfortable rest before the scree traverse.', frame: 'The bridge from above, with walkers on it.' },
      { name: 'Thorong Phedi', text: 'Lodges, a bakery of sorts, and a dining room where everybody on the circuit meets the night before the pass.', field: 'Look up the zigzags to High Camp so the start in the dark holds no surprise.', frame: 'The switchbacks at dusk, when head torches start to move on them.' },
    ],
    stories: [
      { title: 'October 2014', text: 'In mid-October 2014 the remains of a cyclone brought a sudden blizzard to this region. At least 43 people died around Thorong La and on nearby trails, many of them because groups set out or pressed on in the storm. Marker poles and shelters have been added since, and the lesson stands: the forecast and the sky decide, not the schedule.' },
      { title: 'Why everyone walks this way round', text: 'From Manang the trail gains height over several days before the pass. Coming the other way, from Muktinath, the same crossing means climbing more than 1,600 m in a single day with no acclimatisation stop. That is why the circuit is walked anticlockwise.' },
    ],
    wear: ['Thermal top and bottom, fleece, down jacket, shell.', 'Warm hat, buff and both pairs of gloves.'],
    pack: ['Everything for the pass, checked once: torch, spare batteries, sunglasses, sunscreen, snacks.', 'Two litres of water, with one bottle in an insulating sock.', 'Poles.'],
    ask: ['What time do we leave, and what is the turnaround time?', 'What does the forecast say about wind and snow?', 'What is the plan if one of us has to go down?'],
    notes: {
      health: 'Sleeping gain about 400 m, to 4,450 m. Worsening headache, vomiting, breathlessness at rest or unsteady walking tonight means no pass tomorrow. Descend if it does not improve.',
      weather: 'Ask about wind as well as snow. Fresh snow hides the trail above High Camp and the marker poles become your guide.',
      water: 'Boiled water from the lodge the evening before. Hydration bladders freeze in the tube: use bottles.',
      gear: 'Microspikes are worth carrying from November to April, or whenever the lodge reports ice above High Camp.',
      power: 'Keep the phone warm and in flight mode. Cold can halve a battery.',
      lodging: 'Phedi fills up in peak season. The earlier you arrive, the better the room.',
      photo: 'Tomorrow starts in the dark. Decide tonight where the camera rides so you can reach it with gloves on.',
    },
  },

  11: {
    summary: 'The crossing. From Thorong Phedi the trail climbs an hour of zigzags to High Camp, then winds over moraine and a series of false summits to the prayer flags at 5,416 m. With half the oxygen of sea level, it takes most people four to five hours to reach the top. The far side drops 1,600 m to Muktinath, on loose ground and tired legs, into a completely different landscape.',
    thread: [
      { label: 'Before you leave', text: 'Up at 3:30, something warm to eat and drink, walking by 4:30. The start is the coldest part of the trek.', points: ['Wear almost everything. You can shed a layer once the sun arrives.', 'Water bottle inside your jacket, snacks in a pocket you can reach.'] },
      { label: 'The climb', text: 'Zigzags to High Camp, a tea house an hour above it, then the long stretch of moraine where each rise looks like the top and is not.', points: ['Breathe out hard, step, breathe. Rest standing, for seconds, not sitting for minutes.', 'Eat and drink a little every half hour even without appetite.'] },
      { label: 'At the pass', text: 'A wide saddle with a wall of prayer flags and a small tea hut in season. Photos, a hot drink, and then down: do not linger in the cold.', points: ['Aim to be here by 9–10 am, before the wind builds.', 'Ahead and far below lie the brown hills of Mustang and the white pyramid of Dhaulagiri.'] },
      { label: 'The descent', text: 'Steep and loose for two hours to the tea houses at Charabu, then gentler paths to Muktinath.', points: ['Poles long, steps short, knees soft.', 'Symptoms ease with every hundred metres you lose.'] },
    ],
    paces: [
      { label: 'Any doubt before starting', text: 'Stay. Waiting a day at Phedi, or descending to recover, costs a day. Going up ill can cost far more.' },
      { label: 'Normal pace', text: 'Four to five hours to the pass, three to four down. Muktinath by early afternoon.' },
      { label: 'Only with your guide', text: 'Turn back if cloud closes in and the poles disappear, if the wind makes standing hard, or if anyone becomes confused or unsteady. The guide’s call is final.' },
    ],
    stops: [
      { name: 'High Camp', text: 'Lodges on a rocky shelf at about 4,880 m. In the dark you reach it by head torch in an hour.', field: 'A short stop for a hot drink. Adjust layers now, before the wind above.', frame: 'The line of torches below you on the zigzags.' },
      { name: 'Thorong La', text: 'At 5,416 m, the highest point of the circuit and one of the highest trekking passes in the world.', field: 'Hang a prayer flag if you carried one. Check everyone’s fingers, lips and mood before starting down.', frame: 'The flag wall with the summit sign, and the view west into Mustang.' },
      { name: 'Charabu', text: 'Tea houses at about 4,200 m, also called Muktinath Phedi, where the steepest part of the descent ends.', field: 'A proper rest and a real lunch. Knees will thank you.', frame: 'Looking back up at the slope you came down.' },
    ],
    stories: [
      { title: 'A pass between two worlds', text: '“La” is Tibetan for pass. Thorong La links Manang with Mustang and was used by traders and herders long before trekkers. In an hour at the top you go from the watershed of the Marsyangdi to that of the Kali Gandaki.' },
      { title: 'Half the air', text: 'Air pressure at 5,416 m is about half that at sea level. Each breath holds half the oxygen, which is why a slope you would run up at home takes all morning here.' },
    ],
    wear: ['Thermal layers, fleece, down jacket and shell from the start.', 'Warm hat under the hood, buff over the face, liner gloves inside mitts.', 'Sunglasses the moment the sun reaches the snow.'],
    pack: ['Head torch with fresh batteries.', 'Two litres of warm water in bottles, kept from freezing.', 'High-energy snacks, sunscreen, lip balm.', 'Poles, and microspikes if there is ice.'],
    ask: ['Is the weather good enough to start?', 'How is each of us doing, honestly?', 'What time must we be at the pass to continue?'],
    notes: {
      health: 'Highest point 5,416 m, then a sleep 690 m lower than last night. Confusion, stumbling, or breathlessness at rest are emergencies: go down at once, toward whichever side is quicker.',
      weather: 'The wind usually strengthens from late morning. Cloud, fresh snow or a forecast of storms are reasons to wait.',
      water: 'Start hydrated. Bottles upside down in the pack freeze from the bottom, leaving the lid free.',
      route: 'Marker poles show the line above High Camp. In snow, stay on the trodden path and follow the poles.',
      gear: 'Cold hands end more attempts than tired legs. Chemical hand warmers weigh nothing.',
      lodging: 'Muktinath, properly Ranipauwa, has many lodges with hot showers and real beds. Celebrate with a meal, not with much alcohol, on the first night.',
      photo: 'Sunrise lights the peaks behind you on the climb. At the pass, keep the camera inside your jacket until you use it.',
    },
  },

  12: {
    summary: 'You wake in Mustang, in the rain shadow, where almost nothing grows without irrigation. The morning is for Muktinath’s temple, sacred to Hindus and Buddhists alike. Then the trail drops through Jharkot to Kagbeni, a medieval village of mud-brick lanes on the border of Upper Mustang, and follows the wide bed of the Kali Gandaki to Jomsom.',
    thread: [
      { label: 'Before you leave', text: 'Visit the temple first, twenty minutes above the village. Go early, before the pilgrims arriving by jeep.', points: ['Leather is not allowed inside the temple precinct: leave belts in your bag.', 'Legs will be stiff. Start gently.'] },
      { label: 'On the trail', text: 'Down through Jharkot and Khingar to Kagbeni for lunch, then along the river bed to Jomsom.', points: ['Footpaths cut the bends of the jeep road above Kagbeni.', 'Be past the open river bed by early afternoon: the wind is fierce and full of grit.'] },
      { label: 'At Jomsom', text: 'A long, windy town with an airstrip, banks and the district offices. The old quarter lies across the river.', points: ['Permits are checked here.', 'First reliable ATM since Chame.'] },
      { label: 'Evening', text: 'Thakali kitchens start here: dal bhat is at its best in this valley.', points: ['Try the local apple brandy if you like, now that the pass is behind you.', 'Sort out tomorrow’s bus or jeep.'] },
    ],
    paces: [
      { label: 'Low energy', text: 'Take a jeep from Muktinath to Jomsom after visiting the temple. The road covers it in about an hour and a half.' },
      { label: 'Normal pace', text: 'Walk to Kagbeni for lunch, then decide: on foot along the river, or a jeep for the windy last stretch.' },
      { label: 'Only with your guide', text: 'The Lubra valley route avoids the road and passes a village of the old Bon religion. It is longer, with a stream to cross that can run high.' },
    ],
    stops: [
      { name: 'Muktinath temple', text: 'A small pagoda to Vishnu at about 3,710 m, ringed by 108 water spouts under which pilgrims run in icy water. Nearby a natural gas flame burns beside a spring.', field: 'Walk the circuit of spouts clockwise. Watch rather than photograph worshippers at prayer.', frame: 'The poplar grove and white wall of the precinct against bare brown hills.' },
      { name: 'Jharkot', text: 'A village on a spur with the ruin of a fort, an old monastery and a centre for traditional Tibetan medicine.', field: 'Ten minutes off the road, and far quieter than Muktinath.', frame: 'The red monastery on its ridge with Dhaulagiri behind.' },
      { name: 'Kagbeni', text: 'A fortified village at the meeting of two rivers, with covered alleys, a red monastery founded in the fifteenth century, and a checkpoint for restricted Upper Mustang.', field: 'Get lost in the lanes on purpose. Look for the clay guardian figures at either end of the old town.', frame: 'The view north up the Kali Gandaki into Upper Mustang from the edge of the village.' },
    ],
    stories: [
      { title: 'Stones that are gods', text: 'The black stones in the bed of the Kali Gandaki often split to show a coiled fossil. They are ammonites, sea creatures from the ocean that lay here before the Himalaya rose. Hindus revere them as shaligram, a form of Vishnu, which is one reason Muktinath is holy.' },
      { title: 'A river older than the mountains', text: 'The Kali Gandaki was flowing south before the Himalaya rose and kept cutting down as the range lifted around it. That is how a river comes to pass between two 8,000 m peaks.' },
      { title: 'The kingdom to the north', text: 'Beyond Kagbeni lies Upper Mustang, the former kingdom of Lo, culturally Tibetan and open to foreigners only since 1992, on a costly special permit.' },
    ],
    wear: ['Light trekking layers and a windproof shell.', 'Buff or scarf over nose and mouth for the river bed.', 'Sunglasses that wrap: grit gets everywhere.'],
    pack: ['Water for a dry valley: two litres.', 'Sunscreen and lip balm.', 'Permit and passport for the checkpoints.'],
    ask: ['Trail or road between the villages today?', 'Is the Lubra route passable?', 'Bus, jeep or flight tomorrow, and when do we book it?'],
    notes: {
      permits: 'Checks at Kagbeni and Jomsom. Do not walk north of the Kagbeni checkpoint: Upper Mustang needs a separate restricted-area permit.',
      health: 'You are down at 2,720 m tonight. Any altitude symptoms should be gone. Knees and toes take over as the complaint.',
      weather: 'A strong southerly wind blows up the Kali Gandaki from late morning nearly every day. Walk the open sections early.',
      water: 'Safe drinking water stations have operated at Muktinath, Kagbeni and Jomsom.',
      money: 'Jomsom has banks and ATMs. Withdraw here for the rest of the trek.',
      photo: 'Mustang’s colours are best early and late. Midday light is flat and the air hazy with dust.',
    },
  },

  13: {
    summary: 'A short morning on foot and a long afternoon on wheels. The walk to Marpha is easy and the village is the prettiest in the valley. From there a bus or jeep takes the road down the Kali Gandaki, through what is often called the deepest gorge in the world, to the hot springs of Tatopani. If you would rather end the trek here, the morning flight from Jomsom to Pokhara does that in twenty minutes.',
    thread: [
      { label: 'Before you leave', text: 'Leave Jomsom by 8:00, before the wind. Take the path on the east bank, away from the road, if it is open.', points: ['Confirm where the bus or jeep picks you up in Marpha.', 'Keep a warm layer out: the valley is still cold in the morning.'] },
      { label: 'On the way', text: 'An hour and a half to Marpha. Then by road through Tukuche, Kalopani and Ghasa, dropping from dry Mustang into green forest.', points: ['At Kalopani look left for Annapurna I and right for the icefall of Dhaulagiri.', 'The road is rough and slow. Landslides are common below Ghasa.'] },
      { label: 'At Tatopani', text: 'A village among orange trees at 1,190 m, with riverside pools fed by hot springs.', points: ['Carry a towel and sandals down to the pools.', 'It is properly warm again: wash everything.'] },
      { label: 'Evening', text: 'Tomorrow is the longest climb of the trek. Eat well and sleep early.', points: ['Refill and treat three litres for the morning.', 'Check feet and tape anything that rubs.'] },
    ],
    paces: [
      { label: 'Ending here', text: 'Fly Jomsom to Pokhara in the morning. Flights run only in the first hours of the day and are cancelled in wind or cloud.' },
      { label: 'Normal pace', text: 'Walk to Marpha, ride to Tatopani, soak before dinner.' },
      { label: 'With an extra day', text: 'Walk on from Marpha through Tukuche to Kalopani and sleep there, then ride or walk to Tatopani next day.' },
    ],
    stops: [
      { name: 'Marpha', text: 'Whitewashed houses along a flagged lane with water running beneath it, firewood stacked on flat roofs, a monastery above and apple orchards all round.', field: 'Dried apple rings, apple pie and apple brandy are all made here. The distillery can be visited.', frame: 'The main lane seen from the monastery steps.' },
      { name: 'Tukuche', text: 'Once the richest town on the salt route, where Thakali merchants stored Tibetan salt in great courtyard houses.', field: 'From the bus you pass it in a minute. On foot, the carved wooden balconies deserve half an hour.', frame: 'An old merchant house with Dhaulagiri over the roof.' },
      { name: 'Tatopani hot springs', text: 'Two stone pools beside the Kali Gandaki. “Tato pani” simply means hot water.', field: 'A small entry fee. Rinse first, and keep swimwear modest.', frame: 'Steam over the pool with the river behind, at dusk.' },
    ],
    stories: [
      { title: 'The deepest gorge', text: 'Between Tukuche and Kalopani the river runs at about 2,500 m, with Dhaulagiri at 8,167 m on one side and Annapurna I at 8,091 m on the other, some 35 km apart. Measured from summit to river, no valley on Earth is deeper.' },
      { title: 'Annapurna, 1950', text: 'In 1950 a French expedition led by Maurice Herzog based itself at Tukuche, gave up on Dhaulagiri, and turned to Annapurna I. On 3 June they reached the top: the first ascent of any 8,000 m peak, three years before Everest.' },
      { title: 'The Thakali', text: 'The people of this valley controlled the salt trade for generations and turned to inns when it ended. Their cooking, above all the Thakali dal bhat set, is known across Nepal.' },
    ],
    wear: ['Layers you can peel: it is cold in Jomsom and warm in Tatopani.', 'Sandals and swimwear at the top of the bag.'],
    pack: ['Water and snacks for the ride.', 'Motion-sickness tablets if you need them.', 'Towel for the springs.'],
    ask: ['Which bank is the trail to Marpha on, and is it open?', 'Is the road to Tatopani clear today?', 'What time do we start tomorrow’s climb?'],
    notes: {
      route: 'The walking trail on the east bank between Jomsom and Marpha avoids the jeep road. Below Marpha the road is the main way down the valley, with walking alternatives on the opposite bank in places.',
      weather: 'Below Ghasa you are back in the monsoon’s reach. Rain brings landslides and long waits on the road.',
      permits: 'Checkpoint at Ghasa, where you leave Mustang district.',
      lodging: 'Tatopani lodges have gardens, hot showers and fresh fruit. It is the most comfortable night since Kathmandu.',
      money: 'Jomsom is the last dependable ATM before Pokhara.',
      photo: 'Sit on the left of the vehicle going down for Annapurna and Nilgiri, on the right for Dhaulagiri.',
    },
  },

  14: {
    summary: 'One long climb: about 1,670 m from the river to the ridge at Ghorepani. After Thorong La the altitude is no trouble, but the heat at the bottom and the sheer length of the stairs are. The trail leaves the road within an hour and rises through Magar villages, terraces and, higher up, forest of oak and rhododendron.',
    thread: [
      { label: 'Before you leave', text: 'Be walking by 6:30. The first two hours are low, steep and sunny.', points: ['Three litres of water: you will drink them.', 'Sun hat, light shirt, sunscreen.'] },
      { label: 'On the trail', text: 'Across the river and up through Ghara to Shikha for lunch, then Chitre, then the forest to Ghorepani.', points: ['Stone staircases all day: short steps, steady pace, poles for rhythm.', 'Turn round at Shikha: Dhaulagiri fills the valley behind you.'] },
      { label: 'At Ghorepani', text: 'A village of blue-roofed lodges on a pass at 2,860 m, busy with walkers on the short Poon Hill trek.', points: ['Permit check at the entrance.', 'Choose a lodge at the upper end for the view and a shorter start tomorrow.'] },
      { label: 'Evening', text: 'It is cold again up here. Set the alarm for 4:30 and put the torch by the bed.', points: ['Ask the lodge whether the sky is expected to be clear at dawn.'] },
    ],
    paces: [
      { label: 'Low energy', text: 'Break the climb at Shikha or Chitre and reach Ghorepani tomorrow morning, saving Poon Hill for the day after.' },
      { label: 'Normal pace', text: 'Shikha by 11:00, Ghorepani by 3–4 pm.' },
      { label: 'Short of time', text: 'Jeeps run from Tatopani to Beni and on to Pokhara, skipping Ghorepani altogether.' },
    ],
    stops: [
      { name: 'Ghara', text: 'The first village above the river, among terraces of millet and maize.', field: 'A tea stop in the shade after the first hard hour.', frame: 'Terraces falling away to the river you left.' },
      { name: 'Shikha', text: 'A large Magar village spread along the ridge at about 1,935 m, halfway in height and time.', field: 'Lunch here, facing back toward Dhaulagiri.', frame: 'Slate roofs and marigolds with the white wall of Dhaulagiri beyond.' },
      { name: 'The rhododendron forest', text: 'Above Chitre the trail enters forest of oak and tree rhododendron hung with moss.', field: 'In March and April the trees are covered in red flowers. In autumn it is the cool, quiet reward for the climb.', frame: 'The stone path disappearing between twisted trunks.' },
    ],
    stories: [
      { title: 'Horse water', text: '“Ghore pani” means horse water: a watering place for the pack-horse caravans that crossed this pass between Pokhara and the Kali Gandaki. The lodges came later.' },
      { title: 'The national flower', text: 'The red tree rhododendron, lali gurans, is Nepal’s national flower. The forests around Ghorepani are among the largest stands of it in the country.' },
      { title: 'Magar country', text: 'The villages on this slope are Magar, many of them of the Pun clan. For generations men from here have served in the Gurkha regiments, and pensions from that service built many of the houses you pass.' },
    ],
    wear: ['Shorts or light trousers and a thin shirt for the morning.', 'Fleece and down jacket in the pack for Ghorepani.'],
    pack: ['Three litres of water and electrolytes.', 'Snacks for a long day.', 'Rain shell: afternoon cloud is common on this ridge.'],
    ask: ['Where do we refill water on the way up?', 'Is tomorrow’s dawn forecast clear?', 'Which lodge gets us closest to the Poon Hill path?'],
    notes: {
      health: 'No altitude concern. Heat and dehydration are today’s risks, then a cold evening: change out of wet clothes on arrival.',
      water: 'Villages every hour or so sell tea and water. Treat tap water.',
      route: 'The trail leaves the road soon after the bridges below Tatopani. Stone steps and village paths, well marked.',
      permits: 'ACAP check at Ghorepani.',
      weather: 'Cloud often rises onto the ridge by early afternoon. Mornings are the clear time.',
      lodging: 'Many lodges, some large. Rooms are cold and dining rooms are warm.',
    },
  },

  15: {
    summary: 'The last walking day starts in the dark. Forty-five minutes of stone steps lead to Poon Hill at 3,210 m, where the sun comes up on Dhaulagiri, the whole south side of the Annapurna range and the fishtail of Machhapuchhre. After breakfast the trail drops nearly 1,800 m through forest and villages, including the long stone staircase below Ulleri, to the road at Nayapul and a ride to Pokhara.',
    thread: [
      { label: 'Before dawn', text: 'Leave by 5:00 with a head torch. A small entry fee is collected at a booth on the way up.', points: ['Wear the down jacket: you stand still for an hour at the top.', 'Carry only water, camera and a few rupees.'] },
      { label: 'At Poon Hill', text: 'A grassy summit with a viewing tower and a tea stall. First light touches Dhaulagiri, then moves east along the range.', points: ['The tower is crowded. The slope just below it gives the same view with room to breathe.', 'Stay ten minutes after the crowd leaves: the light keeps improving.'] },
      { label: 'The descent', text: 'Back for breakfast, then down through Nangethanti and Banthanti to Ulleri and the great staircase to Tikhedhunga.', points: ['More than 3,000 steps. Poles, short strides, and a rest every half hour.', 'Jeeps now reach Ulleri: an honest option if knees complain.'] },
      { label: 'Out to Pokhara', text: 'An easy valley path through Birethanti, where the permit is checked for the last time, to Nayapul and the road.', points: ['Taxis and buses wait at Nayapul. Pokhara is about an hour and a half away.', 'Tonight: a hot shower, a lake, and no alarm.'] },
    ],
    paces: [
      { label: 'Low energy', text: 'Skip the sunrise climb, or walk only as far as the first viewpoint. The view from Ghorepani’s upper lodges is already wide.' },
      { label: 'Normal pace', text: 'Poon Hill, breakfast at 7:30, Ulleri for lunch, Nayapul by mid-afternoon.' },
      { label: 'Protecting your knees', text: 'Take a jeep from Ulleri or Hille to Pokhara and save yourself the staircase.' },
    ],
    stops: [
      { name: 'Poon Hill', text: 'The best-known viewpoint in the Annapurna region. From west to east: Dhaulagiri, Tukuche Peak, Nilgiri, Annapurna I, Annapurna South, Hiunchuli and Machhapuchhre.', field: 'The peak finder on the tower names each summit. Tea costs double up here and is worth it.', frame: 'A wide shot for the range, then a long lens on Dhaulagiri as the first light hits it.' },
      { name: 'Ulleri', text: 'A Magar village at the top of a staircase of more than 3,000 stone steps.', field: 'Lunch on a terrace before the steps. Annapurna South and Hiunchuli are in view.', frame: 'The staircase dropping away between houses.' },
      { name: 'Birethanti', text: 'A riverside village with a checkpoint, cafés and a waterfall pool, twenty minutes from the road.', field: 'Hand in your permit for its last stamp and take off your boots by the river.', frame: 'The suspension bridge and the two rivers meeting.' },
    ],
    stories: [
      { title: 'The mountain nobody stands on', text: 'Machhapuchhre, the “fishtail”, is sacred to Shiva. A British party stopped a short way below the top in 1957 out of respect, and the mountain has been closed to climbers ever since.' },
      { title: 'A hill with a family name', text: 'Poon Hill takes its name from the Pun, the Magar clan of the villages around it. The viewpoint is theirs in the most practical sense: the entry fee goes to the community.' },
    ],
    wear: ['Down jacket, hat and gloves for the summit.', 'Light layers for the descent: it is warm by Ulleri.'],
    pack: ['Head torch, water, camera.', 'Poles for the steps.', 'Permit for Birethanti.'],
    ask: ['What time do we leave for Poon Hill?', 'Walk all the way to Nayapul or take a jeep from Ulleri?', 'Is transport to Pokhara booked?'],
    notes: {
      route: 'About 350 m up to Poon Hill and back, then a descent of some 1,800 m. The steps are slippery when wet.',
      permits: 'Final ACAP check at Birethanti. Keep the stamped permit: it makes a good souvenir.',
      health: 'The descent is the hardest day for knees and toenails. Cut nails short, lace boots firmly over the instep.',
      weather: 'If dawn is cloudy, the range sometimes clears from the lodge terrace an hour later.',
      lodging: 'Pokhara Lakeside has hotels at every level. Book one with a garden: you will want to sit.',
      photo: 'Sunrise comes from the right as you face the range, so Dhaulagiri on the left lights first and brightest.',
    },
  },

  16: {
    summary: 'A free day by the lake that is also the plan’s safety margin. Snow on the pass, a blocked road or a slow day earlier would have used it up. If it is still yours, spend it gently: Pokhara is the one place on the route built for doing nothing with a mountain view.',
    thread: [
      { label: 'Morning', text: 'Sleep in, then breakfast by the lake. On a clear morning the Annapurnas and Machhapuchhre stand right over the town.', points: ['Laundry in early: it is back by evening.'] },
      { label: 'Midday', text: 'A boat across Phewa Lake to the island temple, or on to the path up to the World Peace Pagoda.', points: ['Rowing boats can be hired with or without a boatman.'] },
      { label: 'Afternoon', text: 'The International Mountain Museum tells the story of the peaks you walked beneath and the people who live under them.', points: ['A massage for trekkers’ legs is easy to find on Lakeside.'] },
      { label: 'Evening', text: 'A last dinner with your guide and porter. This is the usual moment to thank them and hand over tips.', points: ['Confirm tomorrow’s flight or bus.'] },
    ],
    paces: [
      { label: 'Low energy', text: 'A lakeside café, a book and your photographs.' },
      { label: 'Normal pace', text: 'Boat to the pagoda trail in the morning, museum in the afternoon.' },
      { label: 'With energy to spare', text: 'Sarangkot at sunrise for the range seen from the south, by taxi or on foot.' },
    ],
    stops: [
      { name: 'Phewa Lake', text: 'Nepal’s second-largest lake, with a small temple on an island and the Annapurnas reflected in it on calm mornings.', field: 'Go out early, before the breeze breaks the reflection.', frame: 'Painted boats in the foreground, Machhapuchhre above the far shore.' },
      { name: 'World Peace Pagoda', text: 'A white stupa on the ridge south of the lake, built by Japanese Buddhist monks, with the whole town and range in view.', field: 'Boat across, then 45 minutes uphill through forest.', frame: 'The lake, the town and the mountains in one frame from the terrace.' },
      { name: 'International Mountain Museum', text: 'Halls on the Himalayan peoples, the geology of the range and the history of climbing it.', field: 'Allow two hours. It makes sense of what you have just walked through.', frame: 'Not really a place for photographs.' },
    ],
    stories: [
      { title: 'A town at the foot of the wall', text: 'Pokhara lies at about 820 m. Annapurna I is 8,091 m and barely 40 km away. Few places on Earth rise so much in so short a distance, which is why the mountains seem to hang over the streets.' },
      { title: 'The old road north', text: 'Before the highway, Pokhara was a market where mule trains from Mustang met traders from the plains. The route you walked down the Kali Gandaki was its lifeline.' },
    ],
    wear: ['Whatever is clean.'],
    pack: ['Nothing.'],
    ask: ['What do guides and porters usually receive as a tip?', 'When do we leave for Kathmandu tomorrow?'],
    notes: {
      money: 'Tipping is customary and matters to trekking staff. Ask your agency for a guideline and give it in person, in an envelope.',
      health: 'Stomachs often relax their guard at the end of a trek. Keep to the same water and food rules.',
      lodging: 'If this day has already been spent on the trail, nothing is lost: it did its job.',
    },
  },

  17: {
    summary: 'Back to the capital, by air in twenty-five minutes or by road in most of a day. Either way the plan keeps the evening and the whole of tomorrow free, because both the flights and the highway run late more often than not.',
    thread: [
      { label: 'Before you leave', text: 'Flights go from mid-morning when the haze allows. Tourist buses leave Lakeside early, around 7:00.', points: ['Keep passport and ticket to hand for the domestic terminal.'] },
      { label: 'On the way', text: 'By air, the whole range from Dhaulagiri to Manaslu passes the window. By road, the highway follows the Marsyangdi and Trishuli rivers back east.', points: ['Sit on the left for the mountains, in the plane and on the bus.', 'Roadworks make the bus journey slow and dusty.'] },
      { label: 'In Kathmandu', text: 'Collect your stored bag, return rented kit, and have the shower that waits at the end of every trek.', points: ['Return the sleeping bag and jacket to the rental shop today.'] },
      { label: 'Evening', text: 'A last dinner in the city.', points: ['Reconfirm the international flight.'] },
    ],
    paces: [
      { label: 'Low energy', text: 'Fly. It costs more and saves a day of road.' },
      { label: 'Normal pace', text: 'Tourist bus with a lunch stop by the river.' },
      { label: 'With time in hand', text: 'Break the road journey at Bandipur, a hill town of old Newar houses above the highway.' },
    ],
    stops: [
      { name: 'The flight', text: 'A short hop along the front of the Himalaya in a turboprop.', field: 'Ask for a seat on the left when you check in.', frame: 'Through the window: Machhapuchhre, then the Annapurnas, then Manaslu.' },
      { name: 'The Prithvi Highway', text: 'The road that ties Kathmandu to Pokhara, named after the king who unified Nepal.', field: 'Bus stops for tea and lunch are fixed. Carry water and your own snacks.', frame: 'The river from the left-hand windows.' },
    ],
    stories: [
      { title: 'The circle closes', text: 'The road passes Dumre, where you turned north on day 3. The loop you walked around the Annapurnas lies entirely to your left as you drive east.' },
    ],
    wear: ['Travel clothes.'],
    pack: ['Passport, ticket, water, snacks.'],
    ask: ['Flight or bus, and what is the back-up if the flight is cancelled?', 'Where do we return the rented gear?'],
    notes: {
      weather: 'Morning haze and afternoon cloud both delay flights. A cancelled flight usually means a seat on the next day’s bus.',
      lodging: 'Book the same Kathmandu hotel that stores your bag.',
      money: 'Keep enough rupees for the airport taxi and the last meals. Rupees cannot be changed back easily outside Nepal.',
    },
  },

  18: {
    summary: 'The spare day before the flight home. If everything ran on time it is a free day in Kathmandu. If something slipped, this is where it is absorbed. The only fixed task is to be at the airport three hours before departure.',
    thread: [
      { label: 'Morning', text: 'One last walk: Boudhanath at dawn, or Bhaktapur if your flight is late in the day.', points: ['Buy tea, spices or prayer flags to take home.'] },
      { label: 'Midday', text: 'Pack properly. Liquids and knives into the hold bag, batteries and power bank in the cabin.', points: ['Old objects need an export clearance. If a seller calls something an antique, leave it.'] },
      { label: 'To the airport', text: 'Allow an hour through the traffic and three hours at the terminal.', points: ['Keep the boarding pass and passport out: there are several checks.'] },
      { label: 'On the plane', text: 'Before the details fade, write down the three moments you want to keep.', points: ['Export your journal from this site once you are home and online.'] },
    ],
    paces: [
      { label: 'Low energy', text: 'Breakfast, pack, airport.' },
      { label: 'Normal pace', text: 'A morning at Boudhanath, then the airport.' },
      { label: 'With a late flight', text: 'Half a day in Bhaktapur, the best preserved of the valley’s three old cities.' },
    ],
    stops: [
      { name: 'Boudhanath at dawn', text: 'The stupa before the day-trippers arrive, when monks and old Tibetans walk their rounds and butter lamps are lit.', field: 'Join the circuit for three rounds. It is a good way to end a walk.', frame: 'Butter lamps in the foreground, the white dome behind.' },
      { name: 'Bhaktapur', text: 'A city of brick squares, a five-tiered pagoda and potters working in the open.', field: 'An entry fee is charged to foreigners. Go on foot from the gate and wander.', frame: 'Nyatapola temple from the corner of the square.' },
    ],
    stories: [
      { title: 'What you carried round', text: 'About 160 km on foot, from 760 m to 5,416 m and down again, through four climates and four cultures. The Annapurna Circuit has been called the best long walk in the world for exactly that range.' },
    ],
    wear: ['Travel clothes, with a layer for the plane.'],
    pack: ['Passport, tickets, the stamped permit, and whatever dust came down with you.'],
    ask: ['What time does the taxi leave for the airport?'],
    notes: {
      permits: 'Nothing is needed to leave except a valid visa. If you overstayed it, the fine is paid at the airport.',
      money: 'Spend or exchange your last rupees before security.',
      photo: 'Back up your photographs before you fly: two copies in two bags.',
    },
  },
};
