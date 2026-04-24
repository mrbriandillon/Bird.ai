// The Bird.ai Ornithological Oracle — 16 species, each with a personality archetype.
// Images are fetched at runtime from the iNaturalist API using the scientific name.
// Taxon IDs are included as a fallback for more reliable lookups.

const BIRDS = [
  {
    id: "scarlet-macaw",
    commonName: "Scarlet Macaw",
    scientificName: "Ara macao",
    taxonId: 18938,
    archetype: "The Showstopper",
    habitat: "Humid lowland rainforests of Central & South America",
    diet: "Fruits, nuts, seeds, and the occasional clay lick",
    wingspan: "Up to 4 ft (120 cm)",
    funFact: "Their beak can crack a Brazil nut like it's a peanut.",
    personality:
      "You are pure technicolor energy. A room shifts when you enter it — not because you demand attention, but because your joy is so loud it rearranges the furniture. You love deeply, laugh louder, and have zero interest in muted palettes, emotional or otherwise. Your shadow: forgetting that softness is also a color.",
    vibe: "Main character on a Tuesday.",
    palette: ["#e63946", "#f4a261", "#ffd166", "#06aed5"],
  },
  {
    id: "great-horned-owl",
    commonName: "Great Horned Owl",
    scientificName: "Bubo virginianus",
    taxonId: 19350,
    archetype: "The Quiet Oracle",
    habitat: "Forests, deserts, and city parks across the Americas",
    diet: "Small mammals, snakes, and other raptors (yes, really)",
    wingspan: "Up to 5 ft (152 cm)",
    funFact: "Its feathers are edged in velvet, making its flight almost silent.",
    personality:
      "You are the friend everyone texts at 2 a.m. You see patterns others miss and speak only when it counts — which is why people lean in when you do. Your intuition is basically a superpower with a turtleneck. Your shadow: mistaking solitude for safety and forgetting to let people in.",
    vibe: "Knows. Doesn't say. Knows.",
    palette: ["#6b4226", "#c9a66b", "#2b2d42", "#f2e8cf"],
  },
  {
    id: "peregrine-falcon",
    commonName: "Peregrine Falcon",
    scientificName: "Falco peregrinus",
    taxonId: 4665,
    archetype: "The Sharpshooter",
    habitat: "Every continent except Antarctica — including skyscrapers",
    diet: "Other birds, caught mid-air in a 240 mph dive",
    wingspan: "Up to 3.6 ft (110 cm)",
    funFact: "It is the fastest animal on Earth. By a lot.",
    personality:
      "You don't do half-speed. When you commit, gravity gets out of the way. You see your target, you calculate the angle, you go. People call it ambition; you call it Tuesday. Your shadow: forgetting that stillness is also a skill, and not every goal needs a dive-bomb.",
    vibe: "Already three steps ahead.",
    palette: ["#1d3557", "#457b9d", "#e5e5e5", "#ffb703"],
  },
  {
    id: "american-flamingo",
    commonName: "American Flamingo",
    scientificName: "Phoenicopterus ruber",
    taxonId: 3956,
    archetype: "The Flamboyant",
    habitat: "Salty lagoons and mudflats of the Caribbean and Galápagos",
    diet: "Brine shrimp and algae — the source of the pink!",
    wingspan: "Up to 5 ft (150 cm)",
    funFact: "Flamingos are born grey. The pink is earned, one shrimp at a time.",
    personality:
      "You were not put on this Earth to be subtle. Everything you do has a little flourish — the way you sign emails, the way you plate toast, the way you break up with people. Style is a love language and you are fluent. Your shadow: confusing 'seen' with 'understood.'",
    vibe: "Coordinated, possibly iconic.",
    palette: ["#ff6b9d", "#ff8fab", "#fcbf49", "#f77f00"],
  },
  {
    id: "emperor-penguin",
    commonName: "Emperor Penguin",
    scientificName: "Aptenodytes forsteri",
    taxonId: 4372,
    archetype: "The Keeper",
    habitat: "The sea ice of Antarctica — the harshest nursery on Earth",
    diet: "Fish, krill, and squid, hunted on 20-minute dives",
    wingspan: "Flippers, technically — about 30 in (76 cm)",
    funFact: "Males huddle through −40°F winters balancing a single egg on their feet.",
    personality:
      "You are the one who shows up. Storms come, the group scatters, and somehow there you are — still holding the thing everyone forgot was fragile. Loyalty is not a performance for you, it's an operating system. Your shadow: carrying others so long you forget to molt.",
    vibe: "Soft heart, glacial patience.",
    palette: ["#03045e", "#0077b6", "#fdf0d5", "#f4a261"],
  },
  {
    id: "ruby-throated-hummingbird",
    commonName: "Ruby-throated Hummingbird",
    scientificName: "Archilochus colubris",
    taxonId: 6921,
    archetype: "The Spark",
    habitat: "Eastern North America to Central America (one flight, nonstop)",
    diet: "Nectar, tiny insects, and sheer caffeinated willpower",
    wingspan: "About 4 in (10 cm)",
    funFact: "Their wings beat ~53 times per second. They can fly backward.",
    personality:
      "Your brain has 47 tabs open and you love every one of them. You can write a grant application, text three people back, and learn to embroider all before lunch. Time is a suggestion. Your shadow: mistaking motion for progress and forgetting to eat actual meals.",
    vibe: "Five hobbies, zero hours of sleep.",
    palette: ["#2a9d8f", "#e63946", "#e9c46a", "#264653"],
  },
  {
    id: "common-raven",
    commonName: "Common Raven",
    scientificName: "Corvus corax",
    taxonId: 5212,
    archetype: "The Trickster",
    habitat: "Nearly every habitat in the Northern Hemisphere",
    diet: "Essentially anything. Ravens have opinions about snacks.",
    wingspan: "Up to 4.5 ft (135 cm)",
    funFact: "Ravens can solve multi-step puzzles and hold grudges for years.",
    personality:
      "You are smarter than you let on and funnier than is polite. You collect strange facts, stranger friends, and hand-made jokes you deploy with surgical timing. Authority confuses you because you've already spotted the loophole. Your shadow: using cleverness as armor.",
    vibe: "Reads the group chat. Says nothing. Screenshots everything.",
    palette: ["#0b090a", "#2d2d2a", "#6a4c93", "#f4a261"],
  },
  {
    id: "atlantic-puffin",
    commonName: "Atlantic Puffin",
    scientificName: "Fratercula arctica",
    taxonId: 4031,
    archetype: "The Homebody",
    habitat: "North Atlantic sea cliffs from Maine to Iceland",
    diet: "Sand eels, herring — up to 30 tiny fish in one beakful",
    wingspan: "About 25 in (63 cm)",
    funFact: "They mate for life and return to the exact same burrow every year.",
    personality:
      "You are cozy in a way that cannot be faked. Your home smells like something. Your group chat is three people and a dog. You would rather host than be hosted, and you secretly love doing the dishes. Your shadow: mistaking your burrow for the whole sky.",
    vibe: "Made soup about it.",
    palette: ["#ffb703", "#fb8500", "#023047", "#ffffff"],
  },
  {
    id: "bird-of-paradise",
    commonName: "Greater Bird-of-Paradise",
    scientificName: "Paradisaea apoda",
    taxonId: 12936,
    archetype: "The Performer",
    habitat: "Lowland rainforests of New Guinea and the Aru Islands",
    diet: "Fruits, seeds, and small arthropods",
    wingspan: "About 20 in (50 cm), plus absolutely absurd plumes",
    funFact: "Males perform elaborate dance routines on cleared forest stages.",
    personality:
      "You were born to make things — drawings, dinners, outfits, scenes. Your creativity isn't a side hobby, it's structural engineering for your whole personality. You light up in front of a beloved audience of any size, including one. Your shadow: needing applause to know you exist.",
    vibe: "Currently rehearsing something.",
    palette: ["#ffbe0b", "#fb5607", "#ff006e", "#8338ec"],
  },
  {
    id: "southern-cassowary",
    commonName: "Southern Cassowary",
    scientificName: "Casuarius casuarius",
    taxonId: 1306,
    archetype: "The Boundary",
    habitat: "Rainforests of northern Australia and New Guinea",
    diet: "Fallen fruit, fungi, and small animals",
    wingspan: "Flightless — but 6 ft tall and absolutely not a pushover",
    funFact: "Often called 'the world's most dangerous bird.' Respect the kick.",
    personality:
      "You have a look that ends conversations and a calm that scares certain people. You aren't mean — you're just done pretending. Your 'no' is a complete sentence and your presence reorganizes a room. Your shadow: armor so good even loved ones can't find the door.",
    vibe: "Politely terrifying.",
    palette: ["#0466c8", "#0353a4", "#d62828", "#ffba08"],
  },
  {
    id: "mallard-duck",
    commonName: "Mallard Duck",
    scientificName: "Anas platyrhynchos",
    taxonId: 6930,
    archetype: "The Diplomat",
    habitat: "Ponds, marshes, and suspiciously well-placed city fountains",
    diet: "Plants, insects, bread crumbs (please don't, though)",
    wingspan: "About 3 ft (91 cm)",
    funFact: "Nearly every domestic duck on Earth is a mallard descendant.",
    personality:
      "You are the glue. Friend groups stay friend groups because of you. You read the room like a novel and handle conflict by lowering the temperature one degree at a time. People underestimate how much emotional math you're doing. Your shadow: everyone else's peace becoming your whole job.",
    vibe: "Somehow friends with all the exes.",
    palette: ["#386641", "#6a994e", "#a7c957", "#f2e8cf"],
  },
  {
    id: "blue-jay",
    commonName: "Blue Jay",
    scientificName: "Cyanocitta cristata",
    taxonId: 7589,
    archetype: "The Defender",
    habitat: "Forests and backyards of eastern & central North America",
    diet: "Acorns, insects, and anything it can heist from a bird feeder",
    wingspan: "About 16 in (40 cm)",
    funFact: "They mimic hawk calls to clear a bird feeder. Evil genius behavior.",
    personality:
      "You are loud on purpose. You will walk into traffic for someone you love and you will absolutely tell them about it. Loyal, vivid, unbuyable. You don't believe in small feelings. Your shadow: confusing intensity with intimacy.",
    vibe: "Protective of the group chat.",
    palette: ["#1d3557", "#457b9d", "#a8dadc", "#f1faee"],
  },
  {
    id: "resplendent-quetzal",
    commonName: "Resplendent Quetzal",
    scientificName: "Pharomachrus mocinno",
    taxonId: 8021,
    archetype: "The Mystic",
    habitat: "Cloud forests of southern Mexico to Panama",
    diet: "Wild avocados, fruits, insects, small lizards",
    wingspan: "Body ~16 in, tail plumes up to 3 ft extra",
    funFact: "Sacred to the Aztecs and Maya; killing one was once punishable by death.",
    personality:
      "You live half in this world and half in a weirder, better one. You dream in full color, notice the moon, and quietly know things before they happen. People find you a little hard to pin down, which is correct. Your shadow: ghosting reality for the inner one.",
    vibe: "Sees signs in the laundry.",
    palette: ["#2d6a4f", "#40916c", "#e63946", "#ffb703"],
  },
  {
    id: "pileated-woodpecker",
    commonName: "Pileated Woodpecker",
    scientificName: "Dryocopus pileatus",
    taxonId: 9095,
    archetype: "The Builder",
    habitat: "Mature forests across much of North America",
    diet: "Carpenter ants, beetle larvae, fruits and nuts",
    wingspan: "Up to 30 in (76 cm)",
    funFact: "Pounds wood up to 20 times per second without a headache.",
    personality:
      "You build. Systems, friendships, furniture, futures — you chip away at things long after most people have quit. Your patience is a kind of violence against mediocrity. You finish what you start. Your shadow: working so hard you forget the rest is part of the project.",
    vibe: "On draft seven and counting.",
    palette: ["#d62828", "#003049", "#f77f00", "#fcbf49"],
  },
  {
    id: "snowy-egret",
    commonName: "Snowy Egret",
    scientificName: "Egretta thula",
    taxonId: 4669,
    archetype: "The Still One",
    habitat: "Coastal marshes and wetlands of the Americas",
    diet: "Small fish, crustaceans, insects",
    wingspan: "About 3.3 ft (100 cm)",
    funFact: "They wiggle one yellow foot to lure fish. Fashion AND function.",
    personality:
      "You move slowly on purpose. In a world sprinting in fourteen directions, you wait — and somehow the right things walk right up to you. Your elegance is a discipline, not an accident. Your shadow: mistaking waiting for worthiness.",
    vibe: "Unhurried, unbothered, un-catchable.",
    palette: ["#edf6f9", "#ffd60a", "#003566", "#8ecae6"],
  },
  {
    id: "kookaburra",
    commonName: "Laughing Kookaburra",
    scientificName: "Dacelo novaeguineae",
    taxonId: 19646,
    archetype: "The Comic",
    habitat: "Eucalyptus forests and suburbs of eastern Australia",
    diet: "Insects, lizards, snakes, mice",
    wingspan: "About 25 in (65 cm)",
    funFact: "Its cackling call is used in jungle sound effects worldwide — even for jungles it has never visited.",
    personality:
      "You are very funny and you know it. Your humor is the trapdoor through which you smuggle genuine feeling into the room. You make people laugh first, then think, then cry a little. It's a whole move. Your shadow: hiding the grief underneath the bit.",
    vibe: "Opened with a joke, ended in therapy.",
    palette: ["#8b5a2b", "#e9c46a", "#2a9d8f", "#f4f1de"],
  },
];

// Deterministic hash: same image → same bird.
async function hashToIndex(fileOrBlob, modulus) {
  const buffer = await fileOrBlob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const bytes = new Uint8Array(hashBuffer);
  let acc = 0n;
  for (let i = 0; i < 8; i++) acc = (acc << 8n) | BigInt(bytes[i]);
  return Number(acc % BigInt(modulus));
}

async function pickBirdForImage(fileOrBlob) {
  const idx = await hashToIndex(fileOrBlob, BIRDS.length);
  return BIRDS[idx];
}

window.BIRDS = BIRDS;
window.pickBirdForImage = pickBirdForImage;
