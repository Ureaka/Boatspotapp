// ships.js — Real ship database + ImageNet label mapping
// All specs sourced from public maritime records, IMO data, and vessel registries.
// length/width/height in metres, tonnage = gross tonnage (GT), value = millions USD

'use strict';

/* ── ImageNet label → ship type ──────────────────────────────────────────── */
const LABEL_TO_TYPE = {
    'container ship':  'container', 'containership': 'container', 'container vessel': 'container',
    'liner':           'cruise',    'ocean liner':   'cruise',    'cruise ship': 'cruise',
    'aircraft carrier':'military',  'warship':       'military',  'war vessel':  'military',
    'submarine':       'military',  'battleship':    'military',  'destroyer':   'military',
    'frigate':         'military',  'corvette':      'military',  'minesweeper': 'military',
    'fireboat':        'coastguard','patrol boat':   'coastguard','coast guard': 'coastguard',
    'lifeboat':        'coastguard',
    'speedboat':       'megayacht', 'sailboat':      'megayacht', 'catamaran':   'megayacht',
    'yawl':            'megayacht', 'schooner':      'megayacht', 'trimaran':    'megayacht',
    'motor yacht':     'megayacht', 'yacht':         'megayacht',
    'tanker':          'tanker',    'supertanker':   'tanker',    'oil tanker':  'tanker',
    'bulk carrier':    'bulk',      'bulker':        'bulk',
    'car carrier':     'car-carrier','ro-ro':        'car-carrier','vehicle carrier':'car-carrier',
};

/* ── Ship database ───────────────────────────────────────────────────────── */
// Fields: name, line, length, width, height, tonnage, yearBuilt, maxPassengers,
//         estimatedValue (M USD), isRare, funFact, description
const SHIP_DB = {

    /* ── CRUISE ── */
    cruise: [
        {
            name:'Wonder of the Seas', line:'Royal Caribbean',
            length:362, width:65, height:72, tonnage:236857, yearBuilt:2022, maxPassengers:6988, estimatedValue:1350, isRare:false,
            description:'Wonder of the Seas is the world\'s largest cruise ship by gross tonnage, featuring eight distinct neighborhoods across 18 decks.',
            funFact:'She carries enough food for a small city — over 30,000 meals are served on a typical sea day.'
        },
        {
            name:'Symphony of the Seas', line:'Royal Caribbean',
            length:362, width:65, height:72, tonnage:228081, yearBuilt:2018, maxPassengers:6680, estimatedValue:1350, isRare:false,
            description:'Symphony of the Seas held the title of world\'s largest cruise ship for four years before being surpassed by her sister ship Wonder of the Seas.',
            funFact:'Her FlowRider surf simulator has hosted over 2 million surfers since launch.'
        },
        {
            name:'MSC World Europa', line:'MSC Cruises',
            length:333, width:47, height:66, tonnage:215863, yearBuilt:2022, maxPassengers:6762, estimatedValue:1100, isRare:false,
            description:'MSC World Europa is MSC\'s flagship and one of the most environmentally advanced cruise ships ever built, running on LNG fuel.',
            funFact:'She carries 3,000 tonnes of LNG per voyage, reducing CO₂ emissions by up to 20% vs conventional fuel.'
        },
        {
            name:'Queen Mary 2', line:'Cunard',
            length:345, width:45, height:72, tonnage:149215, yearBuilt:2003, maxPassengers:2691, estimatedValue:800, isRare:true,
            description:'Queen Mary 2 is the last true ocean liner ever built, designed for regular transatlantic crossings rather than leisure cruising.',
            funFact:'She is the only passenger ship in the world with a planetarium — the Illuminations theatre doubles as one at sea.'
        },
        {
            name:'Oasis of the Seas', line:'Royal Caribbean',
            length:362, width:60, height:65, tonnage:225282, yearBuilt:2009, maxPassengers:5400, estimatedValue:1400, isRare:true,
            description:'Oasis of the Seas revolutionized cruise travel in 2009 as the first ship over 200,000 GT, setting a template copied by an entire generation of ships.',
            funFact:'When she launched, she was so large that the port of Port Everglades had to be dredged to accommodate her.'
        },
        {
            name:'Disney Wish', line:'Disney Cruise Line',
            length:341, width:46, height:68, tonnage:144000, yearBuilt:2022, maxPassengers:4000, estimatedValue:900, isRare:true,
            description:'Disney Wish is Disney Cruise Line\'s most technologically advanced ship, featuring the first ever attraction at sea to use a rollercoaster-style ride system.',
            funFact:'She has the first-ever Disney attraction at sea — the AquaMouse, a water ride mounted on the outside of the ship.'
        },
        {
            name:'Norwegian Bliss', line:'Norwegian Cruise Line',
            length:333, width:42, height:69, tonnage:168028, yearBuilt:2018, maxPassengers:4004, estimatedValue:900, isRare:false,
            description:'Norwegian Bliss features the longest racetrack at sea — a two-level electric car racing track that wraps around the top deck.',
            funFact:'The ship\'s top-deck laser tag arena is the only one in the world on a working cruise ship.'
        },
        {
            name:'Harmony of the Seas', line:'Royal Caribbean',
            length:362, width:66, height:70, tonnage:226963, yearBuilt:2016, maxPassengers:6410, estimatedValue:1350, isRare:false,
            description:'Harmony of the Seas was the world\'s largest cruise ship upon delivery in 2016, boasting seven distinct neighborhoods across 16 passenger decks.',
            funFact:'She has 20 restaurants, 23 swimming pools, and a 10-storey slide called The Ultimate Abyss.'
        },
        {
            name:'Costa Toscana', line:'Costa Cruises',
            length:337, width:42, height:68, tonnage:215518, yearBuilt:2021, maxPassengers:5224, estimatedValue:950, isRare:false,
            description:'Costa Toscana is one of the most eco-friendly cruise ships ever built, powered by LNG and featuring a "green wall" of 3,000 living plants.',
            funFact:'Her design was inspired by Tuscany — every public space is named after an Italian city or region.'
        },
        {
            name:'SS United States', line:'United States Lines (laid up)',
            length:302, width:31, height:51, tonnage:53330, yearBuilt:1952, maxPassengers:1928, estimatedValue:100, isRare:true,
            description:'SS United States holds the transatlantic speed record set in 1952 — a record that still stands today and can never be beaten under modern maritime rules.',
            funFact:'She crossed the Atlantic in 3 days, 10 hours and 40 minutes — a record that has stood for over 70 years and is unlikely to ever be broken.'
        },
    ],

    /* ── CONTAINER ── */
    container: [
        {
            name:'Ever Ace', line:'Evergreen Marine',
            length:400, width:62, height:73, tonnage:239760, yearBuilt:2021, maxPassengers:0, estimatedValue:180, isRare:true,
            description:'Ever Ace is one of the world\'s largest container ships by TEU capacity, capable of carrying 23,992 standard shipping containers.',
            funFact:'If you stacked all her containers end-to-end they would stretch 145 kilometres — the length of the English Channel.'
        },
        {
            name:'MSC Gülsün', line:'MSC',
            length:400, width:62, height:73, tonnage:232507, yearBuilt:2019, maxPassengers:0, estimatedValue:160, isRare:true,
            description:'MSC Gülsün was the world\'s largest container ship upon delivery in 2019, setting a new benchmark for the industry at 23,756 TEU capacity.',
            funFact:'She was named after the wife of MSC Chairman Gianluigi Aponte and was a personal gift from the company.'
        },
        {
            name:'HMM Algeciras', line:'HMM (Hyundai Merchant Marine)',
            length:400, width:61, height:73, tonnage:228283, yearBuilt:2020, maxPassengers:0, estimatedValue:165, isRare:true,
            description:'HMM Algeciras is South Korea\'s largest-ever commercial vessel and briefly held the world container ship capacity record at 23,964 TEU.',
            funFact:'On her maiden voyage she carried the most containers ever moved in a single ship — a record at the time.'
        },
        {
            name:'CMA CGM Jacques Saadé', line:'CMA CGM',
            length:400, width:61, height:74, tonnage:236583, yearBuilt:2020, maxPassengers:0, estimatedValue:175, isRare:true,
            description:'Named after CMA CGM\'s founder, Jacques Saadé is one of the first ultra-large container ships to run on liquefied natural gas.',
            funFact:'She is one of only a handful of mega container ships that runs on LNG, making her significantly cleaner than her contemporaries.'
        },
        {
            name:'Ever Given', line:'Evergreen Marine',
            length:400, width:59, height:73, tonnage:220940, yearBuilt:2018, maxPassengers:0, estimatedValue:200, isRare:true,
            description:'Ever Given became globally famous in March 2021 when she ran aground in the Suez Canal, blocking one of the world\'s most important trade routes for 6 days.',
            funFact:'During the 6-day blockage, an estimated $9.6 billion worth of trade was held up every day — around $400 million per hour.'
        },
        {
            name:'OOCL Hong Kong', line:'OOCL',
            length:400, width:59, height:68, tonnage:210000, yearBuilt:2017, maxPassengers:0, estimatedValue:140, isRare:false,
            description:'OOCL Hong Kong was briefly the world\'s largest container ship in 2017, and was the first container ship to exceed 21,000 TEU.',
            funFact:'She can carry more than 21,000 containers — that\'s enough boxes to fill more than 11,000 semi-trucks.'
        },
        {
            name:'Madrid Maersk', line:'Maersk Line',
            length:399, width:59, height:73, tonnage:214121, yearBuilt:2017, maxPassengers:0, estimatedValue:145, isRare:false,
            description:'Madrid Maersk is one of the Triple-E class ships, the most fuel-efficient large container ships ever built, using less fuel per container than any predecessor.',
            funFact:'Maersk\'s Triple-E class ships were so large that only a handful of ports in the world could initially handle them.'
        },
        {
            name:'MSC Oscar', line:'MSC',
            length:395, width:59, height:71, tonnage:197362, yearBuilt:2015, maxPassengers:0, estimatedValue:130, isRare:false,
            description:'MSC Oscar was the world\'s largest container ship when delivered in 2015 and remained so for over a year.',
            funFact:'She has 11 cargo holds and can carry 19,224 TEU — enough containers to fill a freight train stretching 116 kilometres.'
        },
        {
            name:'Emma Maersk', line:'Maersk Line',
            length:397, width:56, height:63, tonnage:170974, yearBuilt:2006, maxPassengers:0, estimatedValue:145, isRare:true,
            description:'Emma Maersk was a revolution in container shipping when launched in 2006, the largest container ship in the world by a huge margin.',
            funFact:'Her diesel engine is the largest internal combustion engine ever built — it weighs 2,300 tonnes and produces 109,000 horsepower.'
        },
        {
            name:'Cosco Shipping Universe', line:'COSCO Shipping',
            length:400, width:59, height:73, tonnage:210000, yearBuilt:2018, maxPassengers:0, estimatedValue:145, isRare:false,
            description:'One of COSCO\'s fleet of ultra-large container ships, Cosco Shipping Universe operates major Asia-Europe trade lanes.',
            funFact:'COSCO\'s ultra-large fleet collectively moves more goods than the entire GDP of many small countries each year.'
        },
    ],

    /* ── BULK CARRIERS ── */
    bulk: [
        {
            name:'Valemax Ore Brasil', line:'Vale',
            length:362, width:65, height:30, tonnage:402347, yearBuilt:2011, maxPassengers:0, estimatedValue:85, isRare:true,
            description:'Ore Brasil is a Valemax-class bulk carrier, one of the largest ships ever built, designed specifically to carry iron ore from Brazil to Asia.',
            funFact:'She can carry 400,000 tonnes of iron ore — enough to make about 340,000 cars in a single voyage.'
        },
        {
            name:'Berge Stahl', line:'Berge Bulk',
            length:343, width:63, height:27, tonnage:364767, yearBuilt:1986, maxPassengers:0, estimatedValue:75, isRare:true,
            description:'Berge Stahl is one of the largest bulk carriers ever built and was so large that only one port in the world — Terminal Marítimo de Ponta da Madeira in Brazil — could load her.',
            funFact:'For decades she could only call at one port in the world that was deep enough to load her fully — a single purpose-built terminal in Brazil.'
        },
        {
            name:'Mineral Beijing', line:'COSCO Shipping',
            length:360, width:65, height:29, tonnage:400000, yearBuilt:2015, maxPassengers:0, estimatedValue:82, isRare:true,
            description:'Mineral Beijing is among the largest bulk carriers in COSCO\'s Valemax fleet, optimised for the Brazil-to-China iron ore trade.',
            funFact:'The sheer size of Valemax ships forced China to invest billions in deepening ports just to accept them.'
        },
        {
            name:'Star Polaris', line:'Star Bulk Carriers',
            length:229, width:32, height:20, tonnage:82000, yearBuilt:2016, maxPassengers:0, estimatedValue:35, isRare:false,
            description:'A Capesize bulk carrier named in the Star Bulk fleet, Star Polaris operates on the major iron ore and coal trade routes.',
            funFact:'Capesize ships are too wide for the Panama and Suez Canals and must sail around Cape Horn or the Cape of Good Hope — hence the name.'
        },
        {
            name:'Pacific Basin Dolphin', line:'Pacific Basin',
            length:190, width:32, height:18, tonnage:58000, yearBuilt:2017, maxPassengers:0, estimatedValue:28, isRare:false,
            description:'A Supramax bulk carrier, Pacific Basin Dolphin operates on shorter routes carrying grain, coal, and fertilisers.',
            funFact:'Supramax bulkers have their own cranes on deck, allowing them to load and unload at ports without shore-side equipment.'
        },
        {
            name:'Golden Future', line:'Golden Ocean Group',
            length:300, width:50, height:25, tonnage:180000, yearBuilt:2014, maxPassengers:0, estimatedValue:55, isRare:false,
            description:'A Newcastlemax bulk carrier, Golden Future is one of the largest ships that can transit the Port of Newcastle in Australia.',
            funFact:'The Newcastlemax class was specifically designed to maximise the coal load from Newcastle, Australia — the world\'s largest coal export terminal.'
        },
        {
            name:'Aquafreedom', line:'Aquabella Shipping',
            length:225, width:32, height:19, tonnage:76000, yearBuilt:2018, maxPassengers:0, estimatedValue:32, isRare:false,
            description:'A modern Kamsarmax bulk carrier, Aquafreedom is optimised to pass through the port of Kamsar in Guinea — the world\'s largest bauxite export terminal.',
            funFact:'The Kamsarmax size limit is dictated by a single port in Guinea — the maximum dimensions that the Kamsar terminal can handle.'
        },
        {
            name:'Vale Rio de Janeiro', line:'Vale',
            length:362, width:65, height:30, tonnage:400000, yearBuilt:2012, maxPassengers:0, estimatedValue:83, isRare:true,
            description:'Another giant in Vale\'s Valemax fleet, Vale Rio de Janeiro was part of the controversial fleet that several Asian nations initially refused entry due to size concerns.',
            funFact:'China initially banned Valemax ships from their ports in 2012 to protect domestic shipping companies — the ban lasted two years.'
        },
    ],

    /* ── OIL TANKERS ── */
    tanker: [
        {
            name:'Seawise Giant', line:'Various owners (scrapped 2010)',
            length:458, width:69, height:35, tonnage:564763, yearBuilt:1979, maxPassengers:0, estimatedValue:30, isRare:true,
            description:'Seawise Giant was the longest ship ever built and the largest vessel of any kind in history. She survived a bombing during the Iran-Iraq War before being salvaged and returning to service.',
            funFact:'She was so long that she could not fit through the English Channel — at 458 metres she exceeded the safe clearance. She also had a turning radius of over 3 km.'
        },
        {
            name:'TI Oceania', line:'Euronav',
            length:380, width:68, height:34, tonnage:234006, yearBuilt:2003, maxPassengers:0, estimatedValue:95, isRare:true,
            description:'TI Oceania is one of the four TI-class supertankers, the largest active tankers in the world and some of the largest ships ever built.',
            funFact:'TI Oceania\'s twin sister TI Africa was converted into a floating storage unit and moored permanently off Qatar — she never moves.'
        },
        {
            name:'TI Africa', line:'Euronav',
            length:380, width:68, height:34, tonnage:234006, yearBuilt:2002, maxPassengers:0, estimatedValue:90, isRare:true,
            description:'TI Africa is a Ultra Large Crude Carrier that was converted into a permanently moored floating storage and offloading vessel off Qatar.',
            funFact:'She was effectively "parked" permanently — converted to a floating oil storage platform anchored off the coast of Qatar.'
        },
        {
            name:'Front Altair', line:'Frontline',
            length:330, width:60, height:30, tonnage:162000, yearBuilt:2018, maxPassengers:0, estimatedValue:75, isRare:true,
            description:'Front Altair became internationally known in June 2019 when she was attacked and set on fire in the Gulf of Oman, intensifying tensions in the region.',
            funFact:'Front Altair was attacked and set ablaze in the Gulf of Oman in 2019 — her crew of 23 was rescued by a nearby vessel before she was eventually salvaged.'
        },
        {
            name:'Nordic Hawk', line:'Nordic Tankers',
            length:183, width:32, height:18, tonnage:49990, yearBuilt:2012, maxPassengers:0, estimatedValue:40, isRare:false,
            description:'A modern MR (Medium Range) tanker, Nordic Hawk is a workhorse of the refined products trade, carrying petrol, diesel, and aviation fuel.',
            funFact:'MR tankers are the most common type of product tanker — there are over 1,800 in the global fleet.'
        },
        {
            name:'Overseas Houston', line:'OSG (Overseas Shipholding Group)',
            length:274, width:48, height:27, tonnage:105000, yearBuilt:2010, maxPassengers:0, estimatedValue:65, isRare:false,
            description:'An Aframax-class crude tanker, Overseas Houston operates in the US Gulf Coast and Caribbean crude oil trade.',
            funFact:'Aframax tankers are named after the AFRA (Average Freight Rate Assessment) scale — they were designed to optimise freight economics on medium-haul routes.'
        },
        {
            name:'Knock Nevis (Jahre Viking)', line:'Various (scrapped 2009)',
            length:458, width:69, height:35, tonnage:564763, yearBuilt:1979, maxPassengers:0, estimatedValue:15, isRare:true,
            description:'Knock Nevis — also known as Jahre Viking and Seawise Giant — was the same vessel under different names. As a floating storage unit, she finally served off Qatar before being scrapped in India in 2009.',
            funFact:'This ship holds the all-time record for the longest and heaviest ship ever built. Her hull still technically exists — it was sold for scrap in 2009 for approximately $16 million.'
        },
        {
            name:'Alexia', line:'Trafigura',
            length:250, width:44, height:26, tonnage:90000, yearBuilt:2016, maxPassengers:0, estimatedValue:55, isRare:false,
            description:'An Aframax crude tanker in Trafigura\'s fleet, Alexia operates on medium-haul crude oil routes connecting refineries across the globe.',
            funFact:'Aframax tankers are too large for some US Gulf ports at full load — they often partially unload at sea in a process called lightering.'
        },
    ],

    /* ── COAST GUARD ── */
    coastguard: [
        {
            name:'USCGC Bertholf', line:'US Coast Guard',
            length:127, width:16, height:32, tonnage:4500, yearBuilt:2008, maxPassengers:148, estimatedValue:680, isRare:true,
            description:'USCGC Bertholf is the lead ship of the Legend class, the US Coast Guard\'s most capable class of cutter, designed for operations in the most extreme conditions.',
            funFact:'Bertholf can deploy a helicopter, two small boats, and an unmanned aerial system simultaneously — making her one of the most capable patrol ships in the world.'
        },
        {
            name:'USCGC Stratton', line:'US Coast Guard',
            length:127, width:16, height:32, tonnage:4500, yearBuilt:2012, maxPassengers:148, estimatedValue:680, isRare:false,
            description:'USCGC Stratton is a National Security Cutter and has participated in major drug interdiction operations, once seizing over 26 tonnes of cocaine in a single patrol.',
            funFact:'In 2019, video of Stratton\'s crew surfing on a seized narco submarine went viral — it was part of a $569 million cocaine seizure.'
        },
        {
            name:'CGS Louis S. St-Laurent', line:'Canadian Coast Guard',
            length:120, width:24, height:28, tonnage:11300, yearBuilt:1969, maxPassengers:86, estimatedValue:300, isRare:true,
            description:'CGS Louis S. St-Laurent is Canada\'s largest and most powerful icebreaker, capable of breaking through ice more than 2 metres thick.',
            funFact:'She has been operating in Arctic waters for over 50 years and has participated in joint expeditions with nuclear-powered Soviet/Russian icebreakers.'
        },
        {
            name:'NoCGV Svalbard', line:'Norwegian Coast Guard',
            length:103, width:19, height:29, tonnage:6375, yearBuilt:2001, maxPassengers:68, estimatedValue:100, isRare:false,
            description:'NoCGV Svalbard is Norway\'s most capable coast guard vessel, an icebreaker designed for patrol and rescue operations in the High Arctic.',
            funFact:'Svalbard can break through 1-metre-thick ice at 3 knots continuously — she was the first Norwegian coast guard vessel designed specifically for Arctic operations.'
        },
        {
            name:'MV Ocean Viking', line:'SOS Méditerranée',
            length:69, width:14, height:20, tonnage:2000, yearBuilt:1986, maxPassengers:200, estimatedValue:8, isRare:true,
            description:'Ocean Viking is a humanitarian search-and-rescue vessel operating in the central Mediterranean Sea, run by the NGO SOS Méditerranée.',
            funFact:'Ocean Viking and her predecessor Aquarius have rescued over 38,000 people from the Mediterranean Sea since 2016.'
        },
        {
            name:'USCGC Healy', line:'US Coast Guard',
            length:128, width:25, height:30, tonnage:16000, yearBuilt:1999, maxPassengers:140, estimatedValue:500, isRare:true,
            description:'USCGC Healy is the US Coast Guard\'s largest ship and primary Arctic icebreaker, supporting scientific research missions in the Arctic Ocean.',
            funFact:'Healy has supported over 40 major scientific expeditions in the Arctic and is one of only two US polar icebreakers — the US has far fewer than Russia\'s 40+.'
        },
        {
            name:'JCG Akitsushima', line:'Japan Coast Guard',
            length:150, width:17, height:32, tonnage:6500, yearBuilt:2013, maxPassengers:200, estimatedValue:260, isRare:true,
            description:'Akitsushima is Japan Coast Guard\'s largest patrol vessel, designed to operate in the far-offshore waters around Japan\'s many outlying islands.',
            funFact:'She can operate two helicopters simultaneously and is Japan\'s most capable maritime law enforcement vessel — equivalent in size to a small frigate.'
        },
    ],

    /* ── MILITARY ── */
    military: [
        {
            name:'USS Gerald R. Ford (CVN-78)', line:'US Navy',
            length:337, width:78, height:76, tonnage:100000, yearBuilt:2017, maxPassengers:4539, estimatedValue:13300, isRare:true,
            description:'USS Gerald R. Ford is the most advanced aircraft carrier ever built and the lead ship of a new class, featuring an electromagnetic launch system replacing steam catapults for the first time in 60 years.',
            funFact:'Her electromagnetic catapult system (EMALS) can launch a 45-tonne aircraft from 0 to 240 km/h in 2 seconds — and can do it every 45 seconds.'
        },
        {
            name:'USS Nimitz (CVN-68)', line:'US Navy',
            length:333, width:77, height:74, tonnage:104000, yearBuilt:1975, maxPassengers:6012, estimatedValue:4700, isRare:true,
            description:'USS Nimitz is the lead ship of the Nimitz class — the backbone of US naval power for five decades. Her nuclear reactors have enough fuel for 20+ years of operation without refuelling.',
            funFact:'Nimitz\'s two nuclear reactors can power the entire ship for over 20 years without refuelling — the uranium fuel rods were loaded when she was built in the 1970s.'
        },
        {
            name:'HMS Queen Elizabeth (R08)', line:'Royal Navy',
            length:284, width:73, height:56, tonnage:65000, yearBuilt:2017, maxPassengers:1600, estimatedValue:3500, isRare:true,
            description:'HMS Queen Elizabeth is the largest warship ever built for the Royal Navy and the centrepiece of the UK\'s carrier strike group, designed to project power globally.',
            funFact:'She has a ski-jump ramp instead of catapults — this lets her launch F-35B jets in STOVL mode, which takes off in a short distance and lands vertically.'
        },
        {
            name:'USS Zumwalt (DDG-1000)', line:'US Navy',
            length:183, width:25, height:45, tonnage:14500, yearBuilt:2016, maxPassengers:148, estimatedValue:4400, isRare:true,
            description:'USS Zumwalt is the most advanced destroyer ever built, featuring a wave-piercing tumblehome hull that makes a ship the size of a cruiser appear on radar as a small fishing boat.',
            funFact:'Despite being 183 metres long, Zumwalt\'s radar cross-section is that of a small fishing boat — she is extraordinarily stealthy for a ship her size.'
        },
        {
            name:'INS Vikrant (R11)', line:'Indian Navy',
            length:262, width:62, height:59, tonnage:45000, yearBuilt:2022, maxPassengers:1700, estimatedValue:3200, isRare:true,
            description:'INS Vikrant is India\'s first domestically designed and built aircraft carrier — a massive achievement representing decades of indigenous shipbuilding development.',
            funFact:'Vikrant is 76% indigenous by content — from her steel to her weapons systems — making India only the 5th country to design and build its own carrier.'
        },
        {
            name:'USS Arleigh Burke (DDG-51)', line:'US Navy',
            length:154, width:20, height:31, tonnage:9200, yearBuilt:1991, maxPassengers:330, estimatedValue:1800, isRare:false,
            description:'USS Arleigh Burke is the lead ship of the most numerous class of large surface combat ships ever built — over 70 have been commissioned with more building.',
            funFact:'The Arleigh Burke class is the most successful destroyer design in history — the US Navy has built more of them than any other large warship since WWII.'
        },
        {
            name:'HMAS Canberra (L02)', line:'Royal Australian Navy',
            length:230, width:32, height:52, tonnage:27500, yearBuilt:2014, maxPassengers:1046, estimatedValue:1500, isRare:true,
            description:'HMAS Canberra is Australia\'s largest warship and a Landing Helicopter Dock — essentially a small aircraft carrier that also carries a battalion of troops and their vehicles.',
            funFact:'HMAS Canberra was built in Spain and towed 17,000 km to Australia to be fitted out — the longest vessel tow in Australian history.'
        },
        {
            name:'HMS Daring (D32)', line:'Royal Navy',
            length:152, width:21, height:35, tonnage:8500, yearBuilt:2009, maxPassengers:285, estimatedValue:1200, isRare:false,
            description:'HMS Daring is the lead ship of the Royal Navy\'s Type 45 destroyer class, equipped with the Sea Viper air defence system capable of tracking over 1,000 targets simultaneously.',
            funFact:'Type 45 destroyers can track and destroy targets moving at three times the speed of sound — they are considered among the most capable air defence ships ever built.'
        },
        {
            name:'USS Iowa (BB-61)', line:'US Navy (museum ship)',
            length:270, width:33, height:45, tonnage:58000, yearBuilt:1942, maxPassengers:2700, estimatedValue:200, isRare:true,
            description:'USS Iowa is a World War II Iowa-class battleship now preserved as a museum in Los Angeles — the last of her kind and a symbol of 20th century naval power.',
            funFact:'Iowa\'s 16-inch guns could fire shells weighing over a tonne to a distance of 38 km — and hit a target the size of a tennis court at that range.'
        },
        {
            name:'INS Kolkata (D63)', line:'Indian Navy',
            length:163, width:17, height:31, tonnage:6800, yearBuilt:2014, maxPassengers:250, estimatedValue:800, isRare:false,
            description:'INS Kolkata is the lead ship of India\'s most advanced destroyer class, featuring a sophisticated stealth design and the BrahMos supersonic cruise missile.',
            funFact:'The BrahMos missile carried by Kolkata is the world\'s fastest operational anti-ship cruise missile, flying at Mach 2.8.'
        },
    ],

    /* ── CAR CARRIERS ── */
    'car-carrier': [
        {
            name:'Tonsberg', line:'Wallenius Wilhelmsen',
            length:265, width:40, height:44, tonnage:97000, yearBuilt:2023, maxPassengers:0, estimatedValue:110, isRare:true,
            description:'Tonsberg is one of the largest pure car and truck carriers (PCTCs) ever built, capable of carrying over 9,000 vehicles across 13 decks.',
            funFact:'Her 13 vehicle decks include a special deck for high & heavy cargo like bulldozers and agricultural equipment — and the decks can even be repositioned for taller vehicles.'
        },
        {
            name:'Höegh Target', line:'Höegh Autoliners',
            length:228, width:38, height:41, tonnage:76000, yearBuilt:2022, maxPassengers:0, estimatedValue:85, isRare:false,
            description:'A modern PCTC from Höegh Autoliners, Höegh Target is capable of carrying around 8,500 cars and is designed to also handle high & heavy equipment.',
            funFact:'Modern car carriers are designed so efficiently that each voyage typically moves enough cars to fill a city car dealership — over 200 times over.'
        },
        {
            name:'Grande Europa', line:'Grimaldi Lines',
            length:234, width:36, height:40, tonnage:75000, yearBuilt:2013, maxPassengers:12, estimatedValue:75, isRare:false,
            description:'Grande Europa is a PCTC in the Grimaldi fleet that also carries passengers — one of a rare breed of combined vehicle/passenger ferries operating on longer routes.',
            funFact:'Grande Europa is one of the very few car carriers in the world that also accepts passengers — travellers can book a cabin and watch their car being loaded below them.'
        },
        {
            name:'Cougar Ace', line:'Mitsui OSK Lines',
            length:190, width:32, height:36, tonnage:55000, yearBuilt:2006, maxPassengers:0, estimatedValue:40, isRare:true,
            description:'Cougar Ace became famous in 2006 when she capsized in the North Pacific, rolling to a 60-degree list while carrying 4,703 brand-new Mazda vehicles.',
            funFact:'After her dramatic capsize in 2006, all 4,703 Mazdas on board were eventually destroyed — Mazda refused to sell them due to potential safety issues despite the cars being undriven.'
        },
        {
            name:'Neptune Ace', line:'NYK Line (Nippon Yusen)',
            length:199, width:32, height:38, tonnage:60213, yearBuilt:2008, maxPassengers:0, estimatedValue:50, isRare:false,
            description:'Neptune Ace is a vehicle carrier in NYK Line\'s fleet, one of Japan\'s largest shipping companies and a dominant force in global vehicle logistics.',
            funFact:'NYK Line moves approximately 2 million vehicles per year — that\'s a new car every 15 seconds, 24 hours a day, 365 days a year.'
        },
        {
            name:'Don Juan', line:'Grimaldi Lines',
            length:215, width:35, height:38, tonnage:64000, yearBuilt:2021, maxPassengers:0, estimatedValue:80, isRare:false,
            description:'A modern PCTC optimised for the European short-sea trade, Don Juan moves vehicles between the major automobile manufacturing hubs of Europe and North Africa.',
            funFact:'European car carriers like Don Juan often shuttle vehicles between factories and ports multiple times before a car reaches its final customer.'
        },
        {
            name:'Siem Confucius', line:'Siem Car Carriers',
            length:200, width:32, height:37, tonnage:60000, yearBuilt:2015, maxPassengers:0, estimatedValue:55, isRare:false,
            description:'Siem Confucius is part of a fleet operating the key trade lane from China and Japan to Europe, carrying millions of Asian-made vehicles to European markets each year.',
            funFact:'The China-to-Europe car carrier route takes approximately 30 days — by which time the voyage cost has added around $1,000 to the price of each car.'
        },
    ],

    /* ── MEGA YACHTS ── */
    megayacht: [
        {
            name:'Azzam', line:'Sheikh Khalifa bin Zayed Al Nahyan',
            length:180, width:21, height:35, tonnage:13136, yearBuilt:2013, maxPassengers:36, estimatedValue:600, isRare:true,
            description:'Azzam is the longest motor yacht ever built, measuring 180 metres. She is so large she has her own submarine, anti-missile system, and can outrun most naval vessels.',
            funFact:'Azzam has a top speed of 30+ knots — faster than most naval frigates — achieved through a CODAG propulsion system using both gas turbines and diesel engines simultaneously.'
        },
        {
            name:'Eclipse', line:'Roman Abramovich',
            length:162, width:27, height:49, tonnage:13564, yearBuilt:2010, maxPassengers:36, estimatedValue:500, isRare:true,
            description:'Eclipse is one of the world\'s largest and most controversial superyachts, reportedly featuring missile detection systems, armour plating, and its own submarine.',
            funFact:'Eclipse reportedly has a missile defence system and a laser shield designed to prevent paparazzi from photographing her decks — at a reported cost of $1.5 billion with fit-out.'
        },
        {
            name:'Sailing Yacht A', line:'Andrey Melnichenko',
            length:143, width:25, height:100, tonnage:12700, yearBuilt:2017, maxPassengers:20, estimatedValue:500, isRare:true,
            description:'Sailing Yacht A is the world\'s largest sailing yacht, with three carbon-fibre masts reaching 100 metres above the waterline — taller than the Statue of Liberty.',
            funFact:'Her three masts are taller than the Statue of Liberty. She uses a revolutionary hybrid sail system with computer-controlled sails that can generate both lift and thrust.'
        },
        {
            name:'Octopus', line:'Estate of Paul Allen',
            length:126, width:23, height:40, tonnage:7600, yearBuilt:2003, maxPassengers:26, estimatedValue:300, isRare:true,
            description:'Octopus was Microsoft co-founder Paul Allen\'s legendary yacht, a self-sufficient explorer vessel with two helicopters, a submarine, and a full recording studio.',
            funFact:'In 2015, Octopus discovered the wreck of HIJMS Musashi — Japan\'s largest WWII battleship, lost since 1944. Her sonar found it in the Philippines\' Sibuyan Sea.'
        },
        {
            name:'Lady Moura', line:'Nasser Al-Rashid',
            length:105, width:18, height:30, tonnage:4000, yearBuilt:1990, maxPassengers:30, estimatedValue:200, isRare:false,
            description:'Lady Moura is a classic superyacht built for Saudi businessman Nasser Ibrahim Al-Rashid, famous for having parts of her hull plated in 24-karat gold.',
            funFact:'Lady Moura\'s name is written on her hull in 24-karat gold letters — she was one of the most expensive yachts ever built when delivered in 1990.'
        },
        {
            name:'Serene', line:'Mohammed bin Salman (Saudi Crown Prince)',
            length:134, width:22, height:36, tonnage:8000, yearBuilt:2011, maxPassengers:24, estimatedValue:500, isRare:true,
            description:'Serene is a superyacht originally built for Yuri Shefler (of Stolichnaya vodka fame) and later purchased by Saudi Crown Prince Mohammed bin Salman for a reported $500 million.',
            funFact:'Saudi Crown Prince Mohammed bin Salman reportedly bought Serene impulsively in one afternoon in 2015 for $500 million, after seeing her anchored off the French Riviera.'
        },
        {
            name:'REV Ocean', line:'Kjell Inge Røkke (research vessel)',
            length:183, width:22, height:38, tonnage:13000, yearBuilt:2024, maxPassengers:60, estimatedValue:350, isRare:true,
            description:'REV Ocean is the world\'s largest research and explorer vessel, built by Norwegian billionaire Kjell Inge Røkke specifically to advance marine science and combat ocean plastic pollution.',
            funFact:'REV Ocean will be donated to a non-profit foundation after 2033, where she will operate as a pure scientific vessel — the most expensive donation to ocean research ever made.'
        },
        {
            name:'Kaos', line:'Fulk Group / Private Owner',
            length:105, width:16, height:27, tonnage:3400, yearBuilt:2020, maxPassengers:22, estimatedValue:250, isRare:false,
            description:'Kaos is a modern Lürssen-built superyacht with an explorer-style design, capable of extended ocean passages without refuelling.',
            funFact:'Lürssen, the German shipyard that built Kaos, also built Azzam — the world\'s largest yacht. They are considered the finest superyacht builder in the world.'
        },
        {
            name:'Motor Yacht A', line:'Andrey Melnichenko',
            length:119, width:24, height:39, tonnage:6800, yearBuilt:2008, maxPassengers:14, estimatedValue:300, isRare:true,
            description:'Motor Yacht A was designed by Philippe Starck and is widely considered the most unconventional-looking superyacht ever built, with a submarine-like exterior and transparent floors.',
            funFact:'The central cabin of Motor Yacht A has a fully transparent glass floor so guests can see directly down to the hull — and the ocean beneath. The bedroom dome is also transparent.'
        },
    ],
};
