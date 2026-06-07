// Seed content mirrored from the MyHolidayBro Next.js front end.
// This is the initial dataset the admin loads into localStorage on first run.
// Every field here maps to something the front end renders.

const wix = (slug) =>
  `https://static.wixstatic.com/media/${slug}/v1/fill/w_1200,h_800,al_c,q_85,enc_avif,quality_auto/${slug}`;

export const ADVENTURE_THEMES = [
  "Mountains", "Beaches", "Heritage", "Desert", "Backpacking", "Spiritual", "City Lights", "Tropical",
];

const SLUG = {
  bali: "nsplsh_657846644f576b59425177~mv2.jpg",
  thailand: "nsplsh_6a574b6b2d305a42557967~mv2_d_4439_3072_s_4_2.jpg",
  singapore: "nsplsh_df573ee0f6154a9a80b452293e2c0475~mv2.jpg",
  malaysia: "nsplsh_05291b47a88e40e986ad33b6de021909~mv2.jpg",
  vietnam: "11062b_a0faae69bec6475c834fa172822d6ba9~mv2.jpeg",
  dubai: "e7beb6_45e14c300a1f4d98a7b96422aaac6f10~mv2.jpg",
  maldives: "nsplsh_4d314f6278767357566859~mv2.jpg",
  himachal: "nsplsh_c9a8db6c852e41de80d01c2d166a13ee~mv2.jpg",
  northeast: "nsplsh_ce21f1ca7cb74b3397fee018e612680b~mv2.jpg",
};
const img = (key) => wix(SLUG[key] || SLUG.bali);

// Helper to keep destination seed compact while complete.
const dest = (o) => ({
  overview: [],
  highlights: [],
  packages: [],
  itinerary: [],
  galleryKeys: [],
  visa: null,
  ...o,
});

export const SEED_DESTINATIONS = [
  dest({
    slug: "bali", name: "Bali", country: "Indonesia", region: "International", imageKey: "bali",
    image: img("bali"), fromPrice: "₹13,999", rating: 4.8, reviews: 412,
    tagline: "Temples, volcanoes, and beach-club sunsets.", bestTime: "Apr – Oct",
    idealFor: "Couples · Honeymoon · Friends", visa: "Free visa on arrival",
    themes: ["Beaches", "Tropical", "Spiritual"],
    overview: [
      "Bali is the island that does it all — emerald rice terraces in Ubud, surf beaches in Seminyak, clifftop temples at Uluwatu, and a volcano sunrise at Mount Batur. It's equal parts adventure, romance, and pure relaxation.",
      "Our Bali trips balance the icons with the hidden corners — a private waterfall most travellers miss, a Balinese cooking session, and sunset at Tanah Lot — all on private transfers with an English-speaking driver.",
    ],
    highlights: ["Mount Batur volcano sunrise", "Ubud rice terraces & monkey forest", "Water sports at Tanjung Benoa", "Tanah Lot sunset temple", "Uluwatu clifftop temple", "Seminyak beach clubs"],
    packages: [
      { name: "Bali Super Saver", days: 5, nights: 4, price: "₹13,999", original: "₹20,000", route: "Kuta · Ubud", tag: "Couple" },
      { name: "Bali Honeymoon Special", days: 6, nights: 5, price: "₹24,999", original: "₹34,000", route: "Ubud · Uluwatu", tag: "Honeymoon" },
      { name: "Bali Adventure Week", days: 7, nights: 6, price: "₹32,999", original: "₹44,000", route: "Ubud · Nusa Penida", tag: "Friends" },
    ],
    itinerary: [
      { day: 1, title: "Arrival in Bali", desc: "Welcome at Ngurah Rai Airport and private transfer to your hotel. Evening at leisure." },
      { day: 2, title: "Kintamani & Ubud Village", desc: "Explore Ubud village, then head to Kintamani for sweeping Mount Batur volcano views." },
      { day: 3, title: "Water Sports & Tanah Lot", desc: "Parasailing, banana boat and jet ski at Tanjung Benoa, then a sunset at the sacred Tanah Lot temple." },
      { day: 4, title: "Uluwatu Tour", desc: "Free morning. Afternoon visit to the clifftop Uluwatu temple with a dramatic sunset backdrop." },
      { day: 5, title: "Departure", desc: "Breakfast, checkout and airport transfer as per your flight." },
    ],
  }),
  dest({
    slug: "thailand", name: "Thailand", country: "Thailand", region: "International", imageKey: "thailand",
    image: img("thailand"), fromPrice: "₹13,999", rating: 4.7, reviews: 526,
    tagline: "Island-hopping, street food, and city buzz.", bestTime: "Nov – Mar",
    idealFor: "Friends · Couples · Groups", visa: "Visa on arrival",
    themes: ["Beaches", "Backpacking", "Tropical"],
    overview: [
      "From the turquoise bays of Phi Phi to the neon energy of Bangkok, Thailand packs beaches, temples, markets and nightlife into one unforgettable trip.",
      "Our Thailand itineraries mix Phuket island days with Bangkok city nights, with speedboat tours, a floating market, and the Grand Palace all sorted for you.",
    ],
    highlights: ["Phi Phi & James Bond island tour", "Bangkok Grand Palace", "Phuket beaches & nightlife", "Floating & night markets", "Thai cooking experience", "Rooftop sky bars"],
    packages: [
      { name: "Thailand Super Saver", days: 4, nights: 3, price: "₹13,999", original: "₹20,000", route: "Phuket", tag: "Friends" },
      { name: "Phuket + Krabi Escape", days: 6, nights: 5, price: "₹27,999", original: "₹38,000", route: "Phuket · Krabi", tag: "Couple" },
      { name: "Bangkok + Pattaya Combo", days: 5, nights: 4, price: "₹22,999", original: "₹31,000", route: "Bangkok · Pattaya", tag: "Group" },
    ],
    itinerary: [
      { day: 1, title: "Arrival in Phuket", desc: "Airport pickup and transfer to your resort. Evening free for Patong beach." },
      { day: 2, title: "Phi Phi Island Tour", desc: "Speedboat tour to Phi Phi, Maya Bay and Khai Island with snorkeling and lunch." },
      { day: 3, title: "Phuket City & Big Buddha", desc: "Old town, Big Buddha and Karon viewpoint, evening at leisure." },
      { day: 4, title: "Departure", desc: "Breakfast and airport transfer for your flight home." },
    ],
  }),
  dest({ slug: "malaysia", name: "Malaysia", country: "Malaysia", region: "International", imageKey: "malaysia", image: img("malaysia"), fromPrice: "₹13,999", rating: 4.6, reviews: 318, tagline: "Skyline towers, rainforests, and island calm.", bestTime: "Dec – Feb", idealFor: "Family · Couples · Friends", visa: "Visa required (eNTRI/eVISA)", themes: ["City Lights", "Tropical"],
    highlights: ["Petronas Twin Towers", "Genting Highlands", "Batu Caves", "Langkawi cable car", "KL city tour", "Island day trip"],
    packages: [{ name: "Malaysia Super Saver", days: 5, nights: 4, price: "₹13,999", original: "₹19,000", route: "Kuala Lumpur", tag: "Couple" }, { name: "KL + Langkawi", days: 6, nights: 5, price: "₹29,999", original: "₹39,000", route: "KL · Langkawi", tag: "Family" }] }),
  dest({ slug: "vietnam", name: "Vietnam", country: "Vietnam", region: "International", imageKey: "vietnam", image: img("vietnam"), fromPrice: "₹27,000", rating: 4.7, reviews: 244, tagline: "Limestone bays, lantern towns, and great coffee.", bestTime: "Feb – Apr", idealFor: "Couples · Backpackers · Friends", visa: "e-Visa required", themes: ["Heritage", "Backpacking"] }),
  dest({ slug: "singapore", name: "Singapore", country: "Singapore", region: "International", imageKey: "singapore", image: img("singapore"), fromPrice: "₹21,999", rating: 4.8, reviews: 389, tagline: "Gardens, light shows, and a foodie skyline.", bestTime: "Year-round", idealFor: "Family · Couples", visa: "Visa required", themes: ["City Lights"] }),
  dest({ slug: "dubai", name: "Dubai", country: "UAE", region: "International", imageKey: "dubai", image: img("dubai"), fromPrice: "₹21,999", rating: 4.7, reviews: 471, tagline: "Desert dunes, gold souks, and record-breaking skylines.", bestTime: "Nov – Mar", idealFor: "Family · Couples · Friends", visa: "Visa on arrival (e-Visa)", themes: ["Desert", "City Lights"] }),
  dest({ slug: "maldives", name: "Maldives", country: "Maldives", region: "International", imageKey: "maldives", image: img("maldives"), fromPrice: "₹33,999", rating: 4.9, reviews: 286, tagline: "Overwater villas and impossibly blue lagoons.", bestTime: "Nov – Apr", idealFor: "Honeymoon · Couples", visa: "Free visa on arrival", themes: ["Beaches", "Tropical"] }),
  dest({ slug: "egypt", name: "Egypt", country: "Egypt", region: "International", imageKey: "northeast", image: img("northeast"), fromPrice: "₹62,999", rating: 4.6, reviews: 132, tagline: "Pyramids, Nile cruises, and ancient temples.", bestTime: "Oct – Apr", idealFor: "Heritage · Families", visa: "e-Visa required", themes: ["Desert", "Heritage"] }),
  dest({ slug: "turkey", name: "Turkey", country: "Turkey", region: "International", imageKey: "northeast", image: img("northeast"), fromPrice: "₹63,999", rating: 4.7, reviews: 158, tagline: "Hot-air balloons, bazaars, and two continents.", bestTime: "Apr – Jun · Sep – Nov", idealFor: "Couples · Friends", visa: "e-Visa required", themes: ["Heritage", "City Lights"] }),
  dest({ slug: "france-switzerland", name: "France + Switzerland", country: "France & Switzerland", region: "International", imageKey: "northeast", image: img("northeast"), fromPrice: "₹99,999", rating: 4.8, reviews: 96, tagline: "Paris romance meets Alpine snow peaks.", bestTime: "May – Sep", idealFor: "Honeymoon · Family", visa: "Schengen visa required", themes: ["Mountains", "City Lights"] }),
  dest({ slug: "greece", name: "Greece", country: "Greece", region: "International", imageKey: "singapore", image: img("singapore"), fromPrice: "₹99,999", rating: 4.8, reviews: 104, tagline: "Whitewashed islands and ancient ruins.", bestTime: "Apr – Oct", idealFor: "Honeymoon · Couples", visa: "Schengen visa required", themes: ["Beaches", "Heritage"] }),
  dest({ slug: "norway", name: "Norway", country: "Norway", region: "International", imageKey: "himachal", image: img("himachal"), fromPrice: "₹1,49,999", rating: 4.9, reviews: 72, tagline: "Fjords, northern lights, and midnight sun.", bestTime: "Jun – Aug · Nov – Mar", idealFor: "Couples · Adventure", visa: "Schengen visa required", themes: ["Mountains"] }),
  dest({ slug: "himachal", name: "Himachal", country: "India", region: "India", imageKey: "himachal", image: img("himachal"), fromPrice: "₹7,999", rating: 4.6, reviews: 532, tagline: "Snow roads, cafes, and mountain air.", bestTime: "Mar – Jun · Oct – Feb", idealFor: "Friends · Couples · Backpackers", themes: ["Mountains", "Backpacking", "Spiritual"] }),
  dest({ slug: "goa", name: "Goa", country: "India", region: "India", imageKey: "bali", image: img("bali"), fromPrice: "₹7,999", rating: 4.5, reviews: 612, tagline: "Beaches, shacks, and Portuguese lanes.", bestTime: "Nov – Feb", idealFor: "Friends · Couples", themes: ["Beaches", "Backpacking"] }),
  dest({ slug: "karnataka", name: "Karnataka", country: "India", region: "India", imageKey: "northeast", image: img("northeast"), fromPrice: "₹9,999", rating: 4.6, reviews: 214, tagline: "Coffee hills, ruins, and waterfalls.", bestTime: "Oct – Mar", idealFor: "Family · Friends", themes: ["Mountains", "Heritage"] }),
  dest({ slug: "kerala", name: "Kerala", country: "India", region: "India", imageKey: "vietnam", image: img("vietnam"), fromPrice: "₹11,999", rating: 4.7, reviews: 458, tagline: "Backwaters, tea estates, and Ayurveda.", bestTime: "Sep – Mar", idealFor: "Honeymoon · Family", themes: ["Beaches", "Mountains", "Spiritual"] }),
  dest({ slug: "rajasthan", name: "Rajasthan", country: "India", region: "India", imageKey: "dubai", image: img("dubai"), fromPrice: "₹19,999", rating: 4.7, reviews: 327, tagline: "Forts, palaces, and desert nights.", bestTime: "Oct – Mar", idealFor: "Family · Heritage", themes: ["Heritage", "Desert"] }),
  dest({ slug: "andaman", name: "Andaman", country: "India", region: "India", imageKey: "maldives", image: img("maldives"), fromPrice: "₹24,999", rating: 4.7, reviews: 198, tagline: "White-sand islands and coral reefs.", bestTime: "Oct – May", idealFor: "Honeymoon · Family", themes: ["Beaches", "Tropical"] }),
  dest({ slug: "kashmir", name: "Kashmir", country: "India", region: "India", imageKey: "himachal", image: img("himachal"), fromPrice: "₹24,999", rating: 4.8, reviews: 276, tagline: "Shikara rides, meadows, and snow.", bestTime: "Mar – Oct", idealFor: "Honeymoon · Family", themes: ["Mountains", "Spiritual"] }),
  dest({ slug: "sikkim", name: "Sikkim", country: "India", region: "India", imageKey: "northeast", image: img("northeast"), fromPrice: "₹19,999", rating: 4.7, reviews: 164, tagline: "Monasteries, lakes, and Himalayan views.", bestTime: "Mar – May · Oct – Dec", idealFor: "Couples · Friends", themes: ["Mountains", "Spiritual"] }),
  dest({ slug: "ladakh", name: "Ladakh", country: "India", region: "India", imageKey: "himachal", image: img("himachal"), fromPrice: "₹38,999", rating: 4.8, reviews: 211, tagline: "High passes, blue lakes, and stark beauty.", bestTime: "Jun – Sep", idealFor: "Adventure · Backpackers", themes: ["Mountains", "Backpacking", "Spiritual"] }),
];

export const SEED_WEEKENDS = [
  { id: "coorg-chikmagalur", name: "Coorg & Chikmagalur", subtitle: "Coffee country escape", from: "Bengaluru", to: "Coorg · Chikmagalur", region: "South", days: 3, nights: 2, salePrice: "₹9,999", originalPrice: "₹14,999", savings: "₹5,000", rating: 4.7, reviews: 412, bestTime: "Oct – Mar", tag: "Best Seller", status: "FILLING FAST", statusTone: "hot", image: wix("e7beb6_a4c7c25be4b046bbab4e0000027d35d3~mv2.png"), highlights: ["Abbey Falls", "Coffee estate walk", "Mullayanagiri peak"], description: "Two cool hill towns, a private coffee-estate stay and waterfalls galore — your ideal long weekend off the screen." },
  { id: "ooty-coonoor", name: "Ooty, Coonoor & Isha", subtitle: "Hills, gardens & calm", from: "Bengaluru", to: "Ooty · Coonoor", region: "South", days: 3, nights: 2, salePrice: "₹6,999", originalPrice: "₹9,999", savings: "₹3,000", rating: 4.6, reviews: 318, bestTime: "Sep – May", tag: "Weekend Saver", status: "BOOK NOW", statusTone: "ok", image: wix("e7beb6_791d93ea90f6469abfb1a0d7153a21dd~mv2.jpg"), highlights: ["Toy train ride", "Botanical Gardens", "Isha Yoga Center"], description: "Tea-garden mornings, the famous toy train, and a quiet evening at the Isha temple — three days, no rush." },
  { id: "dudhsagar-trek", name: "Dudhsagar Waterfalls Trek", subtitle: "Adventure & jungle trails", from: "Bengaluru", to: "Goa · Dudhsagar", region: "South", days: 3, nights: 2, salePrice: "₹8,999", originalPrice: "₹12,999", savings: "₹4,000", rating: 4.8, reviews: 261, bestTime: "Jun – Sep", tag: "Adventure", status: "FEW LEFT", statusTone: "low", image: wix("e7beb6_b674dab6cfb44f669182cd846d17a146~mv2.webp"), highlights: ["Dudhsagar falls", "Spice plantation", "Jungle jeep ride"], description: "Monsoon-fed cascades, jeep rides through Goan jungles and a sunset shack on the beach. Pure adrenaline." },
  { id: "lonavala-matheran", name: "Lonavala & Matheran", subtitle: "Lake camping + BBQ", from: "Mumbai", to: "Lonavala · Matheran", region: "West", days: 3, nights: 2, salePrice: "₹7,499", originalPrice: "₹9,999", savings: "₹2,500", rating: 4.5, reviews: 287, bestTime: "Jun – Feb", tag: "Weekend Trip", status: "BOOK NOW", statusTone: "ok", image: wix("e7beb6_008d2f6038454f38ada37c53dc9992ba~mv2.jpg"), highlights: ["Lakeside camp", "BBQ dinner", "Toy train Matheran"], description: "Camp under the stars in Lonavala, then take the morning train to car-free Matheran. Sahyadri weekend bliss." },
  { id: "hampi-badami", name: "Hampi & Badami", subtitle: "Boulders & ancient ruins", from: "Bengaluru", to: "Hampi · Badami", region: "South", days: 3, nights: 2, salePrice: "₹8,499", originalPrice: "₹12,499", savings: "₹4,000", rating: 4.7, reviews: 196, bestTime: "Oct – Mar", tag: "Heritage", status: "FILLING FAST", statusTone: "hot", image: wix("nsplsh_c9a8db6c852e41de80d01c2d166a13ee~mv2.jpg"), highlights: ["Virupaksha temple", "Coracle ride", "Badami cave temples"], description: "Wander a vanished kingdom — sunrise over boulders, river coracles, and the cave temples carved out of red rock." },
  { id: "pondicherry-auroville", name: "Pondicherry & Auroville", subtitle: "French quarter & beach", from: "Bengaluru", to: "Pondicherry", region: "South", days: 3, nights: 2, salePrice: "₹7,999", originalPrice: "₹11,999", savings: "₹4,000", rating: 4.8, reviews: 342, bestTime: "Oct – Mar", tag: "Couples", status: "BOOK NOW", statusTone: "ok", image: wix("nsplsh_4d314f6278767357566859~mv2.jpg"), highlights: ["White Town walk", "Auroville visit", "Promenade sunset"], description: "Cobbled French lanes, biking through Auroville, and a beach sunset that'll be on your wall for years." },
  { id: "vizag-araku", name: "Vizag & Araku Valley", subtitle: "Beach + coffee hills", from: "Hyderabad", to: "Vizag · Araku", region: "South", days: 3, nights: 2, salePrice: "₹9,499", originalPrice: "₹13,999", savings: "₹4,500", rating: 4.6, reviews: 218, bestTime: "Sep – Mar", tag: "Hills & Beach", status: "BOOK NOW", statusTone: "ok", image: wix("nsplsh_df573ee0f6154a9a80b452293e2c0475~mv2.jpg"), highlights: ["RK Beach", "Borra caves", "Coffee plantation"], description: "Train through the Eastern Ghats, sip tribal coffee in Araku, and unwind by the Bay of Bengal at sunset." },
  { id: "wayanad-forest", name: "Wayanad Spice Country", subtitle: "Ghats, coffee & elephants", from: "Bengaluru", to: "Wayanad", region: "South", days: 3, nights: 2, salePrice: "₹8,999", originalPrice: "₹12,999", savings: "₹4,000", rating: 4.7, reviews: 254, bestTime: "Sep – May", tag: "Nature", status: "FEW LEFT", statusTone: "low", image: wix("11062b_a0faae69bec6475c834fa172822d6ba9~mv2.jpeg"), highlights: ["Edakkal caves", "Banasura dam", "Spice farm stay"], description: "Ride through Bandipur into Kerala's green heart — spice farms, dam reservoirs and ancient rock-art caves." },
  { id: "bandipur-wildlife", name: "Bandipur & Mudumalai", subtitle: "Wildlife safari weekend", from: "Bengaluru", to: "Bandipur · Mudumalai", region: "South", days: 3, nights: 2, salePrice: "₹10,499", originalPrice: "₹14,999", savings: "₹4,500", rating: 4.8, reviews: 173, bestTime: "Oct – May", tag: "Wildlife", status: "FILLING FAST", statusTone: "hot", image: wix("nsplsh_ce21f1ca7cb74b3397fee018e612680b~mv2.jpg"), highlights: ["Dawn jeep safari", "Tiger reserve trek", "River resort stay"], description: "Two of India's best tiger reserves on one weekend — dawn safaris, riverside lodges, and zero phone signal." },
  { id: "yercaud-yelagiri", name: "Yercaud & Yelagiri", subtitle: "Twin hill stations", from: "Bengaluru", to: "Yercaud · Yelagiri", region: "South", days: 3, nights: 2, salePrice: "₹6,499", originalPrice: "₹9,499", savings: "₹3,000", rating: 4.5, reviews: 142, bestTime: "Sep – Mar", tag: "Quick Escape", status: "BOOK NOW", statusTone: "ok", image: wix("nsplsh_6c543972716647376c6351~mv2_d_5464_3070_s_4_2.jpg"), highlights: ["Pagoda Point", "Boat lake ride", "Punganur Lake"], description: "Two hill stations in one budget weekend — coffee estate viewpoints, paragliding skies and quiet lake mornings." },
];

export const SEED_HOME = {
  hero: {
    headline: "Plan your next Holiday",
    accentWord: "Holiday",
    subheading: "Handpicked trips, ready when you are.",
    searchPlaceholder: "Where do you want to go?",
    videoUrl: "https://res.cloudinary.com/dyxxkrq8r/video/upload/v1779188622/Hero_MHB_Video_aicsk2.mp4",
  },
  travelers: {
    title: "How do you travel?",
    subtitle: "Trips made for every kind of crew.",
    items: [
      { name: "Couple", image: img("maldives") },
      { name: "Solo", image: img("bali") },
      { name: "Family", image: img("dubai") },
      { name: "Friends", image: img("thailand") },
    ],
  },
  bookings: {
    title: "Just booked this week",
    priceRanges: ["Under ₹50K", "₹50K – ₹1.5L", "₹1.5L – ₹2.5L", "Luxury"],
    items: [
      { id: 1, initial: "A", name: "Aarav", city: "Mumbai", timeAgo: "2 hrs ago", title: "Bali Honeymoon Special", location: "Ubud · Uluwatu", tag: "COUPLE", nights: 5, priceText: "₹24,999", priceNum: 24999, image: img("bali"), dests: ["bali"] },
      { id: 2, initial: "S", name: "Sneha", city: "Delhi", timeAgo: "5 hrs ago", title: "Thailand Super Saver", location: "Phuket", tag: "FRIENDS", nights: 3, priceText: "₹13,999", priceNum: 13999, image: img("thailand"), dests: ["thailand"] },
      { id: 3, initial: "R", name: "Rohan", city: "Bengaluru", timeAgo: "1 day ago", title: "Maldives Water Villa", location: "Malé Atoll", tag: "COUPLE", nights: 4, priceText: "₹89,999", priceNum: 89999, image: img("maldives"), dests: ["maldives"] },
    ],
  },
  packages: {
    title: "Packages by duration",
    tabs: [
      { label: "3-5 Days", items: [
        { name: "Bali", price: "₹13,999", image: img("bali") },
        { name: "Thailand", price: "₹13,999", image: img("thailand") },
        { name: "Goa", price: "₹7,999", image: img("bali") },
      ]},
      { label: "6-9 Days", items: [
        { name: "Vietnam", price: "₹27,000", image: img("vietnam") },
        { name: "Dubai", price: "₹21,999", image: img("dubai") },
      ]},
      { label: "10+ Days", items: [
        { name: "France + Switzerland", price: "₹99,999", image: img("northeast") },
        { name: "Norway", price: "₹1,49,999", image: img("himachal") },
      ]},
    ],
  },
  stories: {
    title: "Straight from our travellers ❤️",
    ratingText: "4.6/5 with 1,000 reviews",
    items: [
      { id: 1, name: "Priya", dest: "Bali", video: "https://res.cloudinary.com/dyxxkrq8r/video/upload/sample.mp4" },
      { id: 2, name: "Karan", dest: "Thailand", video: "https://res.cloudinary.com/dyxxkrq8r/video/upload/sample.mp4" },
    ],
  },
  moments: {
    title: "Read the stories, then go for it",
    items: [
      { id: 1, initial: "A", name: "Aanya Mehta", city: "Mumbai", caption: "Best honeymoon ever", destination: "Bali", duration: "6 Days · 5 Nights", rating: 5, title: "Better than I imagined", review: "Everything from the airport pickup to the very last meal was planned beautifully.", date: "2 months ago", image: img("bali") },
      { id: 2, initial: "R", name: "Rohan Iyer", city: "Bengaluru", caption: "Smooth and fun", destination: "Thailand", duration: "5 Days · 4 Nights", rating: 5, title: "Smooth from start to finish", review: "We booked late and they still pulled off a great itinerary.", date: "5 weeks ago", image: img("thailand") },
    ],
  },
  partners: {
    title: "Tourism Board Partners",
    items: [
      { id: 1, name: "Dubai Tourism", logo: "", image: img("dubai") },
      { id: 2, name: "Amazing Thailand", logo: "", image: img("thailand") },
      { id: 3, name: "Singapore Tourism", logo: "", image: img("singapore") },
      { id: 4, name: "Incredible India", logo: "", image: img("himachal") },
    ],
  },
  whyUs: {
    heading: "Why MyHolidayBro",
    quote: "Bro, lose yourself. Discover yourself.",
    body: "Every trip is handpicked, every stay vetted, and every traveller looked after by a dedicated advisor from planning to landing.",
    stats: [
      { value: "1,000+", label: "Happy travellers" },
      { value: "60+", label: "Destinations covered" },
      { value: "300+", label: "Tours delivered" },
      { value: "24/7", label: "Trip support" },
      { value: "100%", label: "Satisfaction" },
      { value: "Handpicked", label: "Itineraries" },
    ],
    collage: [img("bali"), img("maldives"), img("dubai"), img("thailand")],
  },
  featuredOn: {
    eyebrow: "Featured On",
    heading: "Recognised by leading press",
    items: [
      { name: "SiliconIndia", caption: "Founder Story · 2023", logo: "" },
      { name: "YourStory", caption: "Founder Story · 2024", logo: "" },
    ],
  },
  blogs: {
    eyebrow: "Blogs",
    heading: "Stories & guides",
    featured: { date: "Published on 8 Apr", read: "12 minutes read", title: "25 Best Places to Visit in May in India (2026 Travel Guide)", excerpt: "From snow-tipped Ladakh roads to Kerala's monsoon-green hills…", image: img("himachal"), href: "#" },
    posts: [
      { date: "Published on 2 Apr", read: "8 minutes read", title: "A first-timer's guide to Bali", image: img("bali"), href: "#" },
      { date: "Published on 28 Mar", read: "6 minutes read", title: "Thailand on a budget", image: img("thailand"), href: "#" },
      { date: "Published on 20 Mar", read: "10 minutes read", title: "Best weekend trips from Bengaluru", image: img("northeast"), href: "#" },
    ],
  },
  newsletter: {
    eyebrow: "Join the crew",
    heading: "Trip ideas, in your inbox",
    subheading: "The best deals, hidden gems, and travel hacks — twice a month, hand-picked by our team. Never spammy.",
    buttonLabel: "Subscribe",
    successMessage: "You're in. Keep an eye on your inbox 📬",
    footnote: "No spam. Unsubscribe anytime.",
    backgroundImage: img("maldives"),
  },
};

export const SEED_NAV = {
  logoBlack: "https://res.cloudinary.com/dyxxkrq8r/image/upload/v1779211833/MHB_Logo_Black_bdpszg.avif",
  logoWhite: "https://res.cloudinary.com/dyxxkrq8r/image/upload/v1779211833/MHB_Logo_Black_bdpszg.avif",
  items: [
    { label: "Destinations", href: "/destinations", highlight: false },
    { label: "Weekend Trips", href: "/weekends", highlight: true },
    { label: "Adventure Styles", href: "/adventure-styles", highlight: false },
    { label: "Moments", href: "/moments", highlight: false },
    { label: "Contact", href: "/contact", highlight: false },
  ],
};

export const SEED_FOOTER = {
  columns: [
    { title: "About MyHolidayBro", links: [
      { label: "About us", href: "/#why-us" }, { label: "Contact us", href: "/contact" },
      { label: "Careers", href: "/careers" }, { label: "Press", href: "/#featured-on" },
      { label: "Travel Stories", href: "/moments" },
    ]},
    { title: "Explore", links: [
      { label: "Destinations", href: "/destinations" }, { label: "Weekend Trips", href: "/weekends" },
      { label: "Adventure Styles", href: "/adventure-styles" }, { label: "Moments", href: "/moments" },
      { label: "Newsletter", href: "/newsletter" },
    ]},
    { title: "Help & Policies", links: [
      { label: "Help Centre · FAQ", href: "/faq" }, { label: "Terms of Use", href: "/terms" },
      { label: "Privacy Policy", href: "/terms#privacy" }, { label: "Cookie Policy", href: "/terms#privacy" },
      { label: "Refund Policy", href: "/terms#refunds" },
    ]},
    { title: "Account", links: [
      { label: "Log in", href: "/login" }, { label: "Create account", href: "/signup" },
      { label: "My wishlist", href: "/wishlist" }, { label: "My account", href: "/account" },
    ]},
  ],
  offices: [
    { city: "Hyderabad", address: "Level 6, N Heights, Hitech City, Hyderabad — 500081" },
    { city: "New Delhi", address: "Level 31, 1st Floor, Block L, Connaught Place, New Delhi — 110001" },
    { city: "London", address: "Kemp House, 160 City Road, London EC1V 2NX, UK" },
  ],
  contact: {
    phone: "+91 96666 98990",
    email: "contact@myholidaybro.com",
    whatsapp: "https://wa.me/message/BFYRF5O6RLEEB1",
  },
  social: [
    { network: "Instagram", url: "https://instagram.com/myholidaybro" },
    { network: "Facebook", url: "https://facebook.com/myholidaybro" },
    { network: "YouTube", url: "https://youtube.com/channel/UCMxPOv3BX5OCRNS-bZ_gH1g" },
    { network: "WhatsApp", url: "https://wa.me/message/BFYRF5O6RLEEB1" },
  ],
  copyright: "© 2026 MyHolidayBro. All rights reserved.",
};

export const SEED_CONTENT = {
  // Hero copy for the /faq page
  faqIntro: {
    eyebrow: "Help centre",
    title: "Frequently asked questions.",
    subtitle: "Booking, payments, visas, on-trip support. If you don't find what you need below, we're a WhatsApp message away.",
  },
  // FAQs grouped by category (mirrors the front-end /faq page)
  faqCategories: [
    { id: "bookings", title: "Bookings & Quotes", items: [
      { q: "How do I get a trip quote from MyHolidayBro?", a: "Drop us a message via the Contact page, WhatsApp us at +91 96666 98990, or email contact@myholidaybro.com with your dates, group size and rough destination. A trip captain replies in under 30 minutes during IST working hours with a draft itinerary." },
      { q: "How early should I plan my trip?", a: "For international and peak-season trips (Dec–Jan, May–Jun) we recommend 6–8 weeks ahead. For weekend getaways and most domestic destinations, 1–2 weeks works comfortably. We've also turned around last-minute trips in 48 hours — just ask." },
      { q: "Can I customise a package you've already published?", a: "Absolutely. Every itinerary on the site is a starting point — add nights, swap hotels, change activities, drop a city. Your trip captain rebuilds the plan and re-quotes within hours." },
    ]},
    { id: "payments", title: "Payments & Refunds", items: [
      { q: "What payment methods do you accept?", a: "UPI, all major credit and debit cards, net banking, and bank transfer. International cards are accepted for travellers outside India. We never store your card details on our servers — payments are processed via PCI-compliant gateways." },
      { q: "What's the payment schedule?", a: "Typically 25–40% to confirm the booking and the balance 21 days before departure. The exact split depends on the suppliers we're booking with (some hotels and airlines need full payment earlier)." },
      { q: "How fast do refunds reach me?", a: "Refunds for cancellations are processed within 7–10 working days from the date of approval, back to the original payment method. International card refunds may take an additional 3–5 days depending on your issuing bank." },
    ]},
    { id: "visas", title: "Visas & Documents", items: [
      { q: "Do you help with visas?", a: "Yes — for all the destinations we sell. We share the document checklist, review your application before submission, and book the appointment where the embassy requires it. Visa fees are pass-through; the assistance is included for booked trips." },
      { q: "What documents should I carry on the trip?", a: "Passport (valid for 6+ months from your return date), printed and digital copies of your e-tickets, hotel vouchers, insurance certificate, and visa pages. Your trip captain shares a single PDF bundle 48 hours before departure." },
    ]},
    { id: "on-trip", title: "On the trip", items: [
      { q: "Is there a number I can call mid-trip?", a: "Yes — every booking comes with 24×7 on-trip support. You get a dedicated WhatsApp group with your trip captain and the local ops team for the duration of your trip. We've handled missed flights, weather reroutes, and sudden requests at 2 AM." },
      { q: "What if my flight gets cancelled or delayed?", a: "Message us the moment you know. We'll rebook flights, adjust hotel check-ins, and reshuffle activities to keep your trip on track. If it's a force-majeure cancellation, we work with airlines and hotels to recover what's recoverable." },
      { q: "Are the local guides included?", a: "All the guided activities listed in your itinerary include the local guide. Most of our partner guides are mother-tongue speakers of the region and have worked with us for 3+ years." },
    ]},
    { id: "insurance", title: "Insurance & Safety", items: [
      { q: "Is travel insurance included?", a: "Basic travel insurance covering medical emergencies, trip cancellation and lost baggage is included on all international packages. You can also opt for an upgraded plan with adventure-sport coverage, COVID add-on, or higher claim limits at quote stage." },
      { q: "How do you vet hotels and partners?", a: "Every hotel on our list is either visited in person by a trip captain or vetted via a long-running partnership. Activities and adventure operators are checked annually for licensing, safety equipment and customer feedback." },
    ]},
  ],
  faqs: [
    { q: "How do I book this trip?", a: "Pick a package, send an enquiry, and a dedicated MyHolidayBro advisor will get in touch to lock dates, customise the itinerary, and confirm your booking." },
    { q: "Can the itinerary be customised?", a: "Yes — every itinerary is a starting point. Add nights, swap hotels, upgrade rooms or add experiences." },
    { q: "What's the cancellation policy?", a: "Cancellation charges are a percentage of the total holiday cost and depend on how many days before departure we receive your written notice." },
    { q: "How long do refunds take?", a: "Refunds usually arrive within 3 – 4 working days once initiated, but can take up to 21 working days to reflect." },
    { q: "Do I need travel insurance?", a: "Yes — we consider adequate travel insurance essential. It's your responsibility to ensure your cover is suitable." },
  ],
  inclusions: [
    "Accommodation in hand-picked hotels", "Daily breakfast at the hotel",
    "All tours & transfers in a private vehicle", "Airport pickup and drop-off",
    "Dedicated MyHolidayBro trip advisor", "All applicable hotel taxes & service charges",
  ],
  exclusions: [
    "Airfare (unless a flight-inclusive package is chosen)", "GST and TCS as applicable",
    "Optional activities & water sports", "Travel insurance",
    "Personal expenses — tips, laundry, calls, alcohol", "Anything not mentioned under inclusions",
  ],
  cancellation: [
    { window: "30+ days before departure", refund: "Up to 90% refund (booking fee retained)" },
    { window: "15 – 29 days before", refund: "Up to 50% refund" },
    { window: "7 – 14 days before", refund: "Up to 25% refund" },
    { window: "Under 7 days / no-show", refund: "No refund" },
  ],
  payment: [
    "Partial booking amount confirms your slot — exact sum is set per tour operator.",
    "Balance is due within 3 days of paying the booking amount.",
    "Bookings within 30 days of departure require full payment immediately.",
    "Accepted methods: credit card, debit card, internet banking and bank transfers.",
  ],
  usps: [
    { title: "24×7 Assistance", desc: "Reach us any hour, on-trip or off." },
    { title: "Best Price Guaranteed", desc: "Direct local partners, no middlemen." },
    { title: "Dedicated Trip Advisor", desc: "One expert from planning to landing." },
    { title: "100% Satisfaction", desc: "Public reviews, honest service." },
  ],
  ageLimit: "5 – 65 yrs (younger/older travellers welcome on request)",
  reviews: [
    { name: "Aanya Mehta", initials: "AM", city: "Mumbai", rating: 5, title: "Better than I imagined", body: "Everything from the airport pickup to the very last meal was planned beautifully.", when: "Booked Honeymoon · 2 months ago" },
    { name: "Rohan Iyer", initials: "RI", city: "Bengaluru", rating: 5, title: "Smooth from start to finish", body: "We booked late and they still pulled off a great itinerary.", when: "Booked Friends Trip · 5 weeks ago" },
    { name: "Priya Sharma", initials: "PS", city: "Delhi NCR", rating: 4, title: "Worth every rupee", body: "Trip ran exactly on schedule, hotels were genuinely 4-star.", when: "Booked Family Trip · 3 months ago" },
  ],
};

export const SEED_ADVENTURE_STYLES = {
  kicker: "Adventure styles",
  heading: "How do you like to travel?",
  subheading: "Pick a style — we'll show trips that fit how you want to go.",
  styles: ADVENTURE_THEMES.map((name) => ({ name, tagline: "", image: "" })),
};

export const SEED_USERS = [
  { id: "u_demo", name: "Test User", email: "test@gmail.com", role: "Customer", createdAt: "2026-01-12" },
  { id: "u_aisha", name: "Aisha Khan", email: "aisha@example.com", role: "Customer", createdAt: "2026-05-20" },
  { id: "u_rohit", name: "Rohit Verma", email: "rohit@example.com", role: "Customer", createdAt: "2026-05-22" },
  { id: "u_neha", name: "Neha Reddy", email: "neha@example.com", role: "Customer", createdAt: "2026-05-25" },
];

// ---- Travelers (people on a trip). source: "manual" | "user" (linked to a signup) ----
export const SEED_TRAVELERS = [
  { id: "t1", name: "Aisha Khan", email: "aisha@example.com", phone: "+91 98765 11111", age: 29, group: "Adult", source: "user", userId: "u_aisha" },
  { id: "t2", name: "Rohit Verma", email: "rohit@example.com", phone: "+91 98765 22222", age: 34, group: "Adult", source: "user", userId: "u_rohit" },
  { id: "t3", name: "Ira Verma", email: "", phone: "", age: 7, group: "Child", source: "manual", userId: null },
];

// ---- Traveler groups: named groups of people (families, friend circles) ----
export const SEED_TRAVELER_GROUPS = [
  { id: "g1", name: "Verma Family", memberIds: ["t2", "t3"] },
];

// ---- Package assignments: a package + chosen travelers + pricing ----
export const SEED_ASSIGNMENTS = [];

// Enquiries come from 3 front-end forms — each has its own `type` + fields:
//  quote   → destination "Get a free quote" (package, pax, total)
//  weekend → weekend-trip "Request a callback / WhatsApp"
//  contact → "Tell us about your dream holiday" custom form
export const SEED_ENQUIRIES = [
  { id: "q1", type: "quote", name: "Ishaan Gupta", email: "ishaan@example.com", phone: "+91 98765 43210", destination: "Bali", package: "Bali Honeymoon Special — 6D · ₹24,999", adults: 2, children: 0, total: "₹52,498", status: "New", createdAt: "2026-06-02" },
  { id: "q2", type: "quote", name: "Rhea Sharma", email: "rhea@example.com", phone: "+91 99887 66554", destination: "Goa", package: "Goa Super Saver — 4D · ₹7,999", adults: 2, children: 1, total: "₹16,798", status: "In progress", createdAt: "2026-06-01" },
  { id: "w1", type: "weekend", name: "Meera Nair", email: "meera@example.com", phone: "+91 90000 11111", trip: "Ooty, Coonoor & Isha", price: "₹6,999", channel: "Callback", status: "New", createdAt: "2026-06-03" },
  { id: "w2", type: "weekend", name: "Arjun Rao", email: "arjun@example.com", phone: "+91 98111 22233", trip: "Coorg & Chikmagalur", price: "₹9,999", channel: "WhatsApp", status: "Closed", createdAt: "2026-05-28" },
  { id: "c1", type: "contact", firstName: "Priya", lastName: "Menon", email: "priya@example.com", phone: "+91 98765 00000", category: "Honeymoon", destination: "Maldives", message: "Planning our honeymoon in November, 5 nights, overwater villa preferred.", marketing: true, status: "New", createdAt: "2026-06-04" },
  { id: "c2", type: "contact", firstName: "Karan", lastName: "Singh", email: "karan@example.com", phone: "+91 90909 80808", category: "Family", destination: "Singapore", message: "Family of 4 (2 kids) for the December break. Need flight-inclusive options.", marketing: false, status: "In progress", createdAt: "2026-06-02" },
];

// ---- Moments: video testimonials (the "Straight from our travellers" / 45-sec stories) ----
const VID = "https://res.cloudinary.com/dyxxkrq8r/video/upload/v1779219201/WhatsApp_Video_2026-05-16_at_1.31.18_PM_pa9p61.mp4";
export const SEED_TESTIMONIALS = [
  { id: "v1", name: "Aishwarya", dest: "Bali", quote: "Felt like a private concierge planned every minute.", video: VID, poster: "" },
  { id: "v2", name: "Harish", dest: "Thailand", quote: "Best 7 days I've spent in years. Zero stress.", video: VID, poster: "" },
  { id: "v3", name: "Priyadarshini", dest: "Singapore", quote: "Kids loved every day — MHB nailed the schedule.", video: VID, poster: "" },
  { id: "v4", name: "Mahesh", dest: "Europe", quote: "Multi-country and never felt rushed.", video: VID, poster: "" },
  { id: "v5", name: "Sneha", dest: "Vietnam", quote: "Hoi An lanterns at night — that's the moment.", video: VID, poster: "" },
];

// ---- Moments: traveller stories / postcard reviews (the photo gallery) ----
export const SEED_MOMENTS = [
  { id: "m1", initial: "S", name: "Shiv", city: "Hyderabad", caption: "6 Day Singapore + Malaysia escape", destination: "Singapore · Malaysia", duration: "6 Days · 5 Nights", rating: 5, title: "Felt like every detail was thought through", review: "From airport pickup to the last dinner, everything was handled. We just showed up and enjoyed.", date: "May 2026", image: wix("nsplsh_df573ee0f6154a9a80b452293e2c0475~mv2.jpg") },
  { id: "m2", initial: "A", name: "Abi", city: "Chennai", caption: "5 Night couple in Langkawi", destination: "Langkawi · Malaysia", duration: "5 Days · 4 Nights", rating: 5, title: "Quietest, most romantic trip we've done", review: "Overwater views, a private dinner on the beach, and not a single thing to worry about.", date: "Apr 2026", image: wix("nsplsh_05291b47a88e40e986ad33b6de021909~mv2.jpg") },
  { id: "m3", initial: "H", name: "Hari", city: "Mumbai", caption: "7 Day Bali deep dive", destination: "Ubud · Seminyak · Uluwatu", duration: "7 Days · 6 Nights", rating: 5, title: "My first solo trip and they nailed it", review: "Ubud was my favourite — monkey forest, rice terraces, yoga at sunrise. Every day was paced perfectly.", date: "Feb 2026", image: wix("nsplsh_657846644f576b59425177~mv2.jpg") },
  { id: "m4", initial: "P", name: "Priya", city: "Bengaluru", caption: "6 Day Vietnam explorer", destination: "Hanoi · Halong · Hoi An", duration: "6 Days · 5 Nights", rating: 5, title: "Vietnam still had something in me", review: "Halong Bay cruise was unreal and the food blew us away. Smooth transfers throughout.", date: "Mar 2026", image: wix("11062b_a0faae69bec6475c834fa172822d6ba9~mv2.jpeg") },
  { id: "m5", initial: "N", name: "Neha", city: "Jaipur", caption: "8 Day Singapore + wildlife", destination: "Singapore · Sentosa", duration: "8 Days · 7 Nights", rating: 4, title: "Kids loved every bit of it", review: "Night safari, Universal Studios and Gardens by the Bay — the kids are still talking about it.", date: "Dec 2025", image: wix("e7beb6_45e14c300a1f4d98a7b96422aaac6f10~mv2.jpg") },
  { id: "m6", initial: "R", name: "Rohan", city: "Pune", caption: "5 Day Dubai solo adventure", destination: "Dubai", duration: "5 Days · 4 Nights", rating: 5, title: "A Himalayan reset we needed", review: "Desert safari, Burj Khalifa, and the gold souk. Fast-paced but every transfer was on time.", date: "Jan 2026", image: wix("e7beb6_45e14c300a1f4d98a7b96422aaac6f10~mv2.jpg") },
];

// ---- Careers page: open roles, perks and intro copy ----
export const SEED_CAREERS = {
  email: "careers@myholidaybro.com",
  hero: {
    kicker: "Careers · MyHolidayBro",
    heading: "Build the holiday company you",
    accent: "wish existed",
    sub: "We're a small, very deliberate team obsessed with the craft of a great trip. If that sounds like your kind of room — come build with us.",
  },
  perks: [
    { t: "Real travel benefits", d: "Annual offsite trip + discounted MHB packages for you & your family." },
    { t: "Health cover", d: "Comprehensive medical insurance for you, your spouse and kids." },
    { t: "Hybrid by default", d: "Three days from the studio, two from wherever you concentrate best." },
    { t: "Learning budget", d: "₹50k/year for courses, conferences, books — no approvals needed." },
  ],
  roles: [
    { id: "rl1", team: "Trip Design", title: "Trip Captain · International", type: "Full-time · Hyderabad", blurb: "Curate international itineraries end-to-end — from first WhatsApp ping to landing back home. 2+ years in travel; obsessive about details." },
    { id: "rl2", team: "Trip Design", title: "Trip Captain · Domestic & Weekends", type: "Full-time · Hyderabad / Bangalore", blurb: "Own the domestic and weekend desk. You know your Coorgs from your Chikmagalurs and can plan a long-weekend in 12 minutes flat." },
    { id: "rl3", team: "Engineering", title: "Frontend Engineer (Next.js)", type: "Full-time · Remote-friendly", blurb: "Help us build a delightful booking experience. Next.js, React, CSS Modules. Bonus: you've shipped travel or marketplace UI." },
    { id: "rl4", team: "Ops", title: "On-trip Support Lead", type: "Full-time · Hyderabad", blurb: "Run the 24×7 traveller support pod. Calm under pressure, fluent across WhatsApp and ground-handler phone trees." },
    { id: "rl5", team: "Brand", title: "Content & Social Designer", type: "Contract / Full-time · Hyderabad", blurb: "Shoot, edit, ship — reels, photo edits, the occasional newsletter cover. A portfolio that doesn't scream stock-template." },
  ],
  fallback: {
    title: "Don't see your role?",
    body: "We're always open to surprising fits. Send a note to careers@myholidaybro.com — tell us what you'd build here and why.",
  },
};

// ---- Legal / policy page (/terms): full long-form policy content ----
export const SEED_POLICIES = {
  kicker: "Legal",
  title: "Terms of Use",
  accent: "Use",
  subtitle: "These Terms of Use form a binding agreement between you and MyHolidayBro when you use this website or any of our services. Please read them carefully.",
  lastUpdated: "Last updated · January 2026",
  contactEmail: "contact@myholidaybro.com",
  contactPhone: "+91 96666 98990",
  sections: [
    { id: "agreement", title: "Agreement", body: `These Terms of Use constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("You", "User") and our affiliated entities (hereinafter referred to as "MyHolidayBro", "we", "us", "our"). The information, data and material ("Information") contained on this website ("Site") has been prepared solely for the purpose of providing information about MyHolidayBro and its partners and the services that they offer.

You agree that by accessing the Site, you have read, understood and agree to be bound by all of these Terms of Use. If you do not agree, you are expressly prohibited from using the Site and must discontinue use immediately.

MyHolidayBro reserves the right to alter, change, modify, add or remove portions of these Terms at any time. Changes are effective when posted on the Site. It is your responsibility to review the Terms regularly; continued use of the Site is deemed acceptance of amended Terms.` },
    { id: "eligibility", title: "Eligibility & use of the website", body: `You warrant that you are at least 18 years of age and possess the legal authority to enter into this agreement. If you are making travel reservations on behalf of another person, you agree to inform them of these Terms and to be financially responsible for all use of the Website. You also warrant that all information supplied is true, current, complete and accurate, and that the traveller is not an unaccompanied minor.` },
    { id: "representations", title: "User representations", body: `• All registration information you submit will be true, accurate, current and complete.
• You will maintain the accuracy of such information and update it as necessary.
• You have the legal capacity and agree to comply with the Terms of Use.
• You are not under 18 years of age — or, if a minor, you have parental permission.
• You will not access the Site through automated means (bots, scripts, scrapers).
• You will not use the Site for any illegal or unauthorised purpose.
• Your use of the Site will not violate any applicable law or regulation.

If you provide information that is untrue, inaccurate, not current or incomplete, we may suspend or terminate your account and refuse current or future use of the Site.` },
    { id: "holiday-contract", title: "Your holiday contract", body: `When a booking is made, the "lead name" on the booking guarantees they have authority to accept these terms on behalf of the party. After we receive your booking and appropriate payments, if the arrangements are available, we will issue a confirmation invoice. A binding agreement comes into existence when we dispatch this invoice to the lead name or your tour operator / travel agent.

Please check the details on your invoice carefully. In the event of any discrepancy, contact us immediately as it may not be possible to make changes later.` },
    { id: "documents", title: "Passports, visas, health requirements & travel documents", body: `It is your responsibility to ensure you are in possession of all necessary travel and health documents before departure. A full and valid passport is required for destinations we feature (including children) and visas may be required for overseas destinations. By availing our services you agree that MyHolidayBro can only help you apply for the visa and is not responsible for any issues — including delay, clarification or rejection by the embassy.` },
    { id: "insurance", title: "Insurance", body: `We consider adequate travel insurance to be essential. It is your responsibility to ensure the cover you purchase is suitable for your particular needs. MyHolidayBro cannot be held responsible for denied entry if you cannot provide details of insurance, and we will not be liable for losses that would otherwise have been covered by adequate insurance.` },
    { id: "payment", title: "Paying for your holiday", body: `To confirm your chosen arrangements, you may pay a partial amount (as chosen by the tour operator) or pay in full. If you choose to pay a partial sum, the remainder is due within 3 days of paying the partial amount. If we do not receive the balance in full and on time we may treat your booking as cancelled and cancellation charges will apply.

Cancellation fees, processing fees and insurance premiums are due immediately on invoicing. Travel documents are sent within 14 days after receipt of final payment. Bookings made less than 30 days before arrival require full payment immediately on receipt of written confirmation.

We accept payment by credit card, debit card, internet banking and bank transfers.` },
    { id: "convenience-fees", title: "Convenience fees", body: `Convenience fees are applicable for all payments made after the date of booking, except for transfers into our bank account. We reserve the right to withdraw waivers for convenience fees on payments made on the day of booking.

Credit-card fraud contingency: If you do not supply the correct credit / debit card billing address or cardholder information, the issue of tickets may be delayed and the overall cost may increase. We reserve the right to cancel your holiday if payment is declined or incorrect card information is supplied. We may also perform random checks to minimise credit-card fraud.` },
    { id: "price", title: "Your holiday price", body: `MyHolidayBro endeavours to display the most up-to-date and correct prices on our website. We reserve the right to raise or lower prices at any time. Occasionally an incorrect price may be shown due to an error — when we become aware of any such error we will notify you, and we reserve the right to cancel the booking if you do not wish to accept the price actually applicable.` },
    { id: "change-booking", title: "If you change your booking", body: `If, after our confirmation invoice has been issued, you wish to change your travel arrangements, we will do our utmost to make those changes — but it may not always be possible. Any request must be made by the lead name on the booking or your tour operator through MyHolidayBro.

Costs could increase the closer to your departure month the changes are made. Only one change of departure month per booking may be permitted; any change in departure month will be treated as a cancellation and full cancellation charges will apply. Certain arrangements may not be amended after they have been confirmed, and any alteration could incur a cancellation charge of up to 100% of that part of the arrangements.` },
    { id: "cancellation", title: "If you cancel your holiday", body: `You, or any member of your party, may cancel your travel arrangements at any time. Written notification by mail, fax or email from the lead name on the booking or your tour operator on your behalf must be received at our offices.

Our cancellation charges are a percentage of the total holiday cost and are based on how many days before departure we receive your cancellation notice (not when your correspondence was sent). Amendment charges are non-refundable.

If only some members of your party cancel, in addition to the applicable cancellation charges we will recalculate the holiday cost for the remaining travellers, which may include single-room supplements. In cases where supplier cancellation charges exceed the deposit, we may pass the charge on to you.` },
    { id: "we-change", title: "If we change or cancel your holiday", body: `Our tour operators plan arrangements many days in advance, so we reserve the right to make changes to and correct errors in holiday details both before and after bookings have been confirmed. We must also reserve the right to cancel confirmed bookings at any time.

Most changes are minor. If we have to make a major change or cancel, we will tell you as soon as possible and offer you the choice of accepting the changed arrangements or purchasing alternative arrangements of a similar standard. If the alternative is less expensive than your original, we will refund the difference; if more expensive, we will ask you to pay the difference.` },
    { id: "refunds", title: "Mode and duration of refunds", body: `• Refunds initiated from our systems usually realise in 3 – 4 working days, but can take up to 21 working days to reflect.
• Refund will be initiated only to the original mode of payment. Where this is not possible, refunds may be done to the buyer's banking account after KYC verification (typically 7 – 15 working days).
• All PayPal refunds after 60 days of transaction will be done only to the PayPal-linked email ID. Exceptions are handled case by case and we do not entertain cross-currency refunds.` },
    { id: "flights", title: "Flights", body: `We are not always in a position at the time of booking to confirm the carrier(s), aircraft type and flight timings used. Flight details shown on the website and confirmation invoice are for guidance only and subject to alteration. The latest timings are shown on the tickets dispatched approximately two weeks before departure. Flight times may change even after tickets are dispatched — we will contact you as soon as possible.

This website is our responsibility as your tour operator. It is not issued on behalf of and does not commit the airlines mentioned, or any airline whose services are used.` },
    { id: "behaviour", title: "Behaviour", body: `When you book a holiday with MyHolidayBro you accept responsibility for the proper conduct of yourself and your party. If we (or any person in authority) reasonably believe that you or any member of your party is behaving so as to cause or be likely to cause danger or upset, or damage to property, we are entitled to terminate the holiday of the person(s) concerned. No refunds will be made. You will be responsible for full payment for any damage or loss caused.` },
    { id: "complaints", title: "If you have a complaint", body: `In the event of any problem with your holiday arrangements while away, you must immediately inform the tour operator's representative, MyHolidayBro and the supplier of the service in question, and complete a report form whilst in resort. If you remain dissatisfied, please call or write to care@myholidaybro.com within 7 days of your return with your booking reference and full details.` },
    { id: "liability", title: "Our liability to you", body: `We will endeavour that your holiday arrangements are made, performed or provided with reasonable skill and care. If your contracted arrangements are not provided as promised or prove deficient due to our failure to use reasonable skill and care, we will make all reasonable efforts to rectify the same. We assume no liability for errors due to systematic issues, fluctuations in prices, availability of flights / hotels / cars, or the standards of service provided by third-party suppliers. Our maximum liability in such cases will be limited to refund of the booking amount, subject to MyHolidayBro receiving the same from the supplier.

We will not be responsible for any injury, illness, death, loss, damage, expense, cost or other claim arising from the act(s) and/or omission(s) of the affected person or any member of their party, or of any third party not connected with the provision of your arrangements which were unforeseeable or unavoidable.

Excursions, tours, activities or other events you book or pay for through anybody other than MyHolidayBro (or whilst on holiday) are not part of your package holiday provided by us. For any such local event your contract is with the supplier of that event and not with us.` },
    { id: "privacy", title: "Data protection & privacy", body: `In order to process your booking and meet your requirements, we must pass your personal details to the relevant suppliers. We may also hold your information for our future marketing purposes (such as informing you of promotional offers or sending our brochure). If you do not wish to receive these approaches, please change your communication preferences on the website. See our Privacy Policy for full details on how your personal details are used.` },
    { id: "special-requests", title: "Special requests & medical", body: `Any special request must be made at the time of booking. We will try to pass reasonable requests to the relevant supplier but cannot guarantee they will be met. The fact that a request is noted on your confirmation invoice is not confirmation that it will be met — failure to meet a special request is not a breach of contract unless we have specifically confirmed it.

Please advise us of any disabilities and special requirements at the time of booking. If we reasonably feel unable to accommodate the needs of the person(s) concerned, we will not confirm the booking, or will cancel it when we become aware of the details. For assistance contact contact@myholidaybro.com.` },
    { id: "disclaimer", title: "Disclaimer", body: `The Site is provided on an "as-is" and "as-available" basis. Your use of the Site and our services is at your sole risk. To the fullest extent permitted by law, we disclaim all warranties, express or implied, in connection with the Site and your use thereof, including merchantability, fitness for a particular purpose, and non-infringement. We make no warranties about the accuracy or completeness of the Site's content or of any websites linked to the Site, and assume no liability or responsibility for content errors, personal injury, unauthorised access, bugs, viruses or any loss or damage incurred as a result of using the Site.` },
    { id: "limit-liability", title: "Limitation of liability", body: `To the maximum extent permitted by law, in no event shall MyHolidayBro be liable to any person or entity for any direct, indirect, incidental, special, exemplary, compensatory, consequential or punitive damages — including, but not limited to, loss of production, profit, revenue, contract, goodwill, reputation, business interruption, data or other intangible losses. Notwithstanding anything to the contrary, our liability to you for any cause whatsoever and regardless of the form of action will at all times be limited to the total amount of the transaction in question.` },
    { id: "indemnification", title: "Indemnification", body: `You agree to defend, indemnify and hold us harmless — including our subsidiaries, affiliates, directors, officers, agents, partners and employees — from and against any loss, damage, liability, claim or demand, including reasonable attorney's fees and expenses, made by any third party due to or arising out of: (1) use of the Website, (2) breach of these Terms of Use, (3) any breach of your representations and warranties, or (4) your violation of the rights of a third party, including intellectual property rights.` },
    { id: "force-majeure", title: "Force majeure", body: `A force majeure event is any event beyond MyHolidayBro's control, including but not limited to natural disasters, weather conditions, fire, nuclear incident, terrorist acts, riots, war, labour disputes, strikes, government actions, bankruptcy, machinery breakdown, network or system interruptions, internet or communications breakdown, quarantine, epidemic or pandemic. You agree that MyHolidayBro will have no liability and will make no refund in the event of any delay, cancellation, overbooking, strike, force majeure or other causes beyond their direct control.` },
    { id: "ownership", title: "Ownership & prohibited activities", body: `All trademarks, copyrights, service marks, logos, brands and other intellectual and proprietary rights associated with our services and displayed on this website are proprietary to us and owned or controlled by us or licensed to us. While you may make limited copies of your travel itinerary for personal use, you agree not to otherwise modify, copy, distribute, transmit, display, perform, reproduce, publish, license, create derivative works from, transfer, or sell information, software, products or services obtained from this website. Additionally, you agree not to:

• Make any speculative, false or fraudulent reservation.
• Access or copy content using any robot, spider, scraper or automated means without our written permission.
• Bypass or circumvent any access-limiting measures employed on the website.
• Take any action that imposes a disproportionately large load on our infrastructure.
• Frame, mirror or create derivative works from the Site.
• Decompile, disassemble or reverse-engineer any of our software.
• Attempt unauthorised access to the Site or its connected systems.
• Manipulate identifiers to disguise the origin of any content you transmit.

If your booking or account shows signs of fraud, abuse or suspicious activity, we may cancel any travel or service reservations associated with your name, email address or account, and close any associated accounts.` },
    { id: "jurisdiction", title: "Jurisdiction & applicable law", body: `These Terms & Conditions and any agreement to which they apply are governed by the laws of the courts in Bangalore, India. The courts in Bangalore, India shall have exclusive jurisdiction without regard to conflict-of-law principles. All guest claims must be submitted in writing and received by MyHolidayBro no later than sixty (60) days after the completion of the MyHolidayBro vacation. Claims not submitted and received within this time shall be deemed waived and barred.` },
    { id: "misc", title: "Miscellaneous", body: `• If any part of these Terms is determined to be indefinite, invalid or unenforceable, the rest shall continue in full force.
• The parties are independent contractors. These Terms do not create a partnership, franchise, joint venture, agency, fiduciary or employment relationship.
• We may assign any or all of our rights and obligations to others at any time.
• We will not be responsible for any loss, damage, delay, or failure to act caused by any cause beyond our reasonable control.` },
  ],
};

export const SEED_SETTINGS = {
  brandName: "MyHolidayBro",
  tagline: "Bro, lose yourself. Discover yourself.",
  currency: "₹ INR",
  region: "India",
  supportEmail: "contact@myholidaybro.com",
  supportPhone: "+91 96666 98990",
  googleRating: "4.6",
  googleReviews: "1,000",
  // Used on the itinerary PDF closing "Contact / Meet us" page
  companyLegalName: "MyHolidayBro Pvt. Ltd.",
  officeAddress: "613, Tower B, Building - Noida One, Sector 62,\nNoida, Uttar Pradesh, IN - 201301",
};

import {
  SEED_PLACES, SEED_HOTELS, SEED_BLOCKS, SEED_ITINERARIES, SEED_TRIP_TEMPLATES,
} from "./itinerarySeed.js";

export const SEED = {
  destinations: SEED_DESTINATIONS,
  weekends: SEED_WEEKENDS,
  home: SEED_HOME,
  nav: SEED_NAV,
  footer: SEED_FOOTER,
  content: SEED_CONTENT,
  adventureStyles: SEED_ADVENTURE_STYLES,
  users: SEED_USERS,
  travelers: SEED_TRAVELERS,
  travelerGroups: SEED_TRAVELER_GROUPS,
  assignments: SEED_ASSIGNMENTS,
  enquiries: SEED_ENQUIRIES,
  settings: SEED_SETTINGS,
  testimonials: SEED_TESTIMONIALS,
  moments: SEED_MOMENTS,
  careers: SEED_CAREERS,
  policies: SEED_POLICIES,
  // Itinerary PDF generator
  itineraries: SEED_ITINERARIES,
  places: SEED_PLACES,
  hotels: SEED_HOTELS,
  blocks: SEED_BLOCKS,
  tripTemplates: SEED_TRIP_TEMPLATES,
};
