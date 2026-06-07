// Seed data for the itinerary PDF generator.
// Mirrors the structure of a real client itinerary (cover, schedule, day-by-day
// detail, accommodation, notes, inclusions/exclusions, terms) plus the reusable
// "libraries" (places, hotels, content blocks, templates) used to build them fast.

const w = (slug) =>
  `https://static.wixstatic.com/media/${slug}/v1/fill/w_800,h_600,al_c,q_85,enc_avif,quality_auto/${slug}`;

const IMG = {
  bali: w("nsplsh_657846644f576b59425177~mv2.jpg"),
  beach: w("nsplsh_4d314f6278767357566859~mv2.jpg"),
  temple: w("nsplsh_df573ee0f6154a9a80b452293e2c0475~mv2.jpg"),
  forest: w("11062b_a0faae69bec6475c834fa172822d6ba9~mv2.jpeg"),
  hill: w("nsplsh_c9a8db6c852e41de80d01c2d166a13ee~mv2.jpg"),
  city: w("nsplsh_6a574b6b2d305a42557967~mv2_d_4439_3072_s_4_2.jpg"),
};

// ---- Reusable Places / Activities library ----
export const SEED_PLACES = [
  { id: "pl_gwk", name: "Garuda Wisnu Kencana Cultural Park", duration: "", note: "Entrance ticket is included", image: IMG.temple,
    description: "A tourist destination at Ungasan, Badung, about 10–15 minutes from Ngurah Rai International Airport. Devoted to the Hindu god Vishnu and his mount, Garuda." },
  { id: "pl_padang", name: "Padang Padang beach", duration: "", note: "Entrance ticket is included", image: IMG.beach,
    description: "A well-known surf spot and seashore heaven on the Bukit Peninsula in South Bali, with rock caves, tidal swimming pools and world-class waves." },
  { id: "pl_uluwatu", name: "Uluwatu temple", duration: "", note: "Entrance ticket is included", image: IMG.temple,
    description: "A Balinese Hindu sea temple located in Uluwatu, regarded as one of the sad kahyangan and dedicated to Sang Hyang Widhi Wasa." },
  { id: "pl_kecak", name: "Kecak Fire and Dance Show", duration: "", note: "Entrance ticket is included", image: IMG.city,
    description: "Watch the amazing portrayal of the Ramayana in the Kecak Fire Dance." },
  { id: "pl_kelingking", name: "Kelingking Beach", duration: "", note: "Entrance ticket is included", image: IMG.beach,
    description: "White sandy beach with turquoise waters enclosed by a steep cliff & headland." },
  { id: "pl_angel", name: "Angel Billabong", duration: "", note: "Entrance ticket is included", image: IMG.beach,
    description: "A natural infinity pool on Nusa Penida island, adjacent to Pasih Uug Beach in Bunga Mekar Village." },
  { id: "pl_broken", name: "Broken Beach", duration: "", note: "Entrance ticket is included", image: IMG.beach,
    description: "An incredible little cove on Nusa Penida with an archway that lets water flow in and out from the ocean." },
  { id: "pl_snorkel", name: "Snorkeling at Toya Pakeh", duration: "", note: "Entrance ticket is included", image: IMG.beach,
    description: "Manta Bay is a succession of bays surrounded by abrupt cliffs — a superb snorkeling site." },
  { id: "pl_monkey", name: "Sacred Monkey Forest Sanctuary", duration: "", note: "Entrance ticket is included", image: IMG.forest,
    description: "The sanctuary and natural habitat of the Balinese long-tailed monkey at Padangtegal, Ubud. About 749 monkeys live here." },
  { id: "pl_goagajah", name: "Goa Gajah", duration: "", note: "Entrance ticket is included", image: IMG.temple,
    description: "Goa Gajah, or Elephant Cave, near Ubud. Built in the 9th century, it served as a sanctuary." },
  { id: "pl_coffee", name: "Coffee plantation", duration: "", note: "Entrance ticket is included", image: IMG.forest,
    description: "Visit a coffee plantation in central Bali." },
  { id: "pl_tegalalang", name: "Tegalalang Rice Terrace", duration: "", note: "Entrance ticket is included", image: IMG.forest,
    description: "Scenic, terraced hillside of rice paddies amid lush greenery, plus zip lines & jungle swings (fees not included)." },
  { id: "pl_swing", name: "Bali Swing", duration: "", note: "Entrance ticket is included", image: IMG.forest,
    description: "Optional Bali Swing over the jungle valley." },
  { id: "pl_goalawah", name: "Goa Lawah Temple", duration: "", note: "Entrance ticket is included", image: IMG.temple,
    description: "Pura Goa Lawah, a Balinese Hindu temple located in Klungkung, Bali." },
  { id: "pl_virgin", name: "Virgin Beach", duration: "", note: "Entrance ticket is included", image: IMG.beach,
    description: "Visit Virgin Beach in Karangasem Regency." },
  { id: "pl_lempuyang", name: "Lempuyang Temple", duration: "Half Day", note: "Entrance ticket is included", image: IMG.hill,
    description: "Pura Penataran Agung Lempuyang on the slope of Mount Lempuyang in Karangasem, Bali — the famous 'Gateway to Heaven'." },
  { id: "pl_tirta", name: "Tirta Gangga Water Palace", duration: "", note: "Entrance ticket is included", image: IMG.forest,
    description: "A former royal palace in eastern Bali, about 5 km from Karangasem near Abang." },
];

// ---- Reusable Hotels library ----
export const SEED_HOTELS = [
  { id: "ht_horison", name: "Horison Seminyak Bali - CHSE Certified", location: "Near to Legian Beach", rating: 4, score: "4.0",
    checkin: "2:00 PM", checkout: "12:00 PM", mealPlan: "Breakfast", images: [IMG.bali, IMG.beach, IMG.city, IMG.temple],
    rooms: [{ type: "Deluxe Room", occupancy: "2 Pax", refundable: false, breakfast: true }] },
  { id: "ht_freddies", name: "Freddies Villa Ubud", location: "6.6 kms from Goa Gajah", rating: 4, score: "4.3",
    checkin: "2:00 PM", checkout: "12:00 PM", mealPlan: "Breakfast", images: [IMG.forest, IMG.hill, IMG.bali, IMG.temple],
    rooms: [{ type: "Villa Room", occupancy: "2 Pax", refundable: false, breakfast: true }] },
];

// ---- Reusable content blocks (notes / inclusions / exclusions / terms) ----
export const SEED_BLOCKS = [
  { id: "bk_notes", kind: "list", title: "Standard Notes", items: [
    "Once you arrive at airport, our representative will be holding a placard with your name at the Arrivals hall.",
    "Please note the hotel check-in and check-out time while booking your flights.",
    "Early check-in and Late check-out requests are purely based on availability. We will place a request with the hotels but cannot guarantee the same.",
    "All travellers to Bali, Indonesia should carry a double-dose vaccination certificate and a passport with at least 6 months validity.",
    "All private transfers will be in a sedan vehicle.",
    "Bali requires an on-arrival visa which will cost USD 30 per person.",
    "2 days prior to your travel dates our team will create a WhatsApp group to assist you during your trip.",
    "If activities are not available on the assigned day we will interchange them based on availability; prior information will be given to the guest.",
  ]},
  { id: "bk_incl", kind: "list", title: "Standard Inclusions", items: [
    "Accommodation as per the itinerary with breakfast",
    "To & fro airport transfers in a private vehicle",
    "Intercity & sightseeing transfers in a private vehicle",
    "Lunch included at Nusa Penida Island Tour",
    "All sightseeing entrance tickets as mentioned",
    "GST is included",
  ]},
  { id: "bk_excl", kind: "list", title: "Standard Exclusions", items: [
    "Any other activities, transfers or meals not mentioned in the itinerary",
    "Flight tickets are not included",
    "TCS 5% is not included",
    "Visa is not included",
    "Travel Insurance is not included",
    "Anything not mentioned under inclusions",
  ]},
  { id: "bk_terms", kind: "sections", title: "Standard Terms & Conditions", sections: [
    { heading: "Hotel / Land Cancellation Policy", body: "Cancellation policy is subject to change and depends on the hotel policy. In peak season (long weekends, festival season, summer vacation etc.) most hotels charge 100% cancellation." },
    { heading: "ID Proof", body: "As per government regulations, a valid Photo ID must be carried by every person above 18 staying at the hotel (Driver's License, Voter Card, Passport, Ration Card). PAN Cards are not accepted." },
    { heading: "Refunds", body: "There will be no refund for unused nights or early check-out. The price does not include expenses of a personal nature such as laundry, telephone calls, room service, alcoholic beverages, mini-bar, tips, etc." },
    { heading: "Itinerary Changes", body: "We reserve the right to modify the itinerary due to Force Majeure events, strikes, weather, traffic, overbooking, flight changes or entry restrictions. We will arrange suitable alternates but cannot be held liable for refund/compensation claims arising out of this." },
  ]},
];

// ---- A complete seeded itinerary (the Bali reference) ----
export const SEED_ITINERARIES = [
  {
    id: "it_bali_sushil",
    status: "Final",
    title: "Magnificent Nusa Penida & Ubud",
    destination: "Bali",
    clientName: "Sushil",
    pax: 2,
    paxLabel: "2 Adults",
    tripId: "56802",
    startDate: "25 June, 2024",
    duration: "6 Days",
    dateRangeLabel: "Jun 25 to Jun 30",
    priceLabel: "68,500",
    priceUnit: "per couple",
    gstIncluded: true,
    priceTiers: [
      { amount: "34,250", label: "Per Person on Double Sharing basis x 2 Pax" },
    ],
    greeting: "Our sales team has put together this quote for your upcoming trip. Please go through it and let us know if you would like any changes in any of the provided services. Our contact details are at the end.",
    heroImage: IMG.bali,
    trustBadges: ["Complete pre-trip and on-trip assistance", "No hidden charges", "Verified hotels and cabs"],
    transport: [
      { vehicle: "2 - SIC (Adult)", items: [
        "Arrival & Transfers to Bali Hotel (Kuta / Seminyak)",
        "Nusa Penida Day Tour with shared boat transfers",
      ]},
      { vehicle: "1 - 04/6 Seater (Avanza / Xenia) - 10 Hr", items: [
        "Cab for Uluwatu sunset tour sightseeing",
        "Cab for Ubud sightseeing",
      ]},
      { vehicle: "2 - Adult Ticket", items: [
        "Water Sports Package A - Activity Combo",
        "Kintamani & Ubud Tour",
      ]},
    ],
    visa: "Indonesia visa-on-arrival assistance (USD 30 per person, payable directly)",
    segments: [
      { name: "Kuta + Nusa penida", dateLabel: "Jun 25 to Jun 28" },
      { name: "Ubud", dateLabel: "Jun 28 to Jun 30" },
    ],
    days: [
      { id: "d1", dateLabel: "Jun 25", segment: "Kuta + Nusa penida", items: [
        { type: "transfer", title: "Transfers to Kuta Hotel (Private Transfers)", note: "Hotel check-in" },
      ]},
      { id: "d2", dateLabel: "Jun 26", segment: "Kuta + Nusa penida", items: [
        { type: "transfer", title: "Transfer to Uluwatu temple sunset tour (Private transfers)", duration: "6 Hrs", note: "Inclusive of hotel pick up and drop off. Pick up will be at 02:00 PM" },
        { type: "activity", placeId: "pl_gwk" },
        { type: "activity", placeId: "pl_padang" },
        { type: "activity", placeId: "pl_uluwatu" },
        { type: "activity", placeId: "pl_kecak" },
      ]},
      { id: "d3", dateLabel: "Jun 27", segment: "Kuta + Nusa penida", items: [
        { type: "transfer", title: "Transfer to Nusa penida Day tour with Lunch (Private transfers)", duration: "8-9 hours", note: "06:30 AM. Inclusive of private hotel pick up and drop off, shared boat transfers" },
        { type: "activity", placeId: "pl_kelingking" },
        { type: "activity", placeId: "pl_angel" },
        { type: "activity", placeId: "pl_broken" },
        { type: "activity", placeId: "pl_snorkel" },
      ]},
      { id: "d4", dateLabel: "Jun 28", segment: "Ubud", items: [
        { type: "transfer", title: "Transfers to Ubud Sightseeing (Private Transfers)" },
        { type: "activity", placeId: "pl_monkey" },
        { type: "activity", placeId: "pl_goagajah" },
        { type: "activity", placeId: "pl_coffee" },
        { type: "activity", placeId: "pl_tegalalang" },
        { type: "activity", placeId: "pl_swing" },
      ]},
      { id: "d5", dateLabel: "Jun 29", segment: "Ubud", items: [
        { type: "transfer", title: "Transfers to East Bali exploration trip (Private transfers)" },
        { type: "activity", placeId: "pl_goalawah" },
        { type: "activity", placeId: "pl_virgin" },
        { type: "activity", placeId: "pl_lempuyang" },
        { type: "activity", placeId: "pl_tirta" },
      ]},
      { id: "d6", dateLabel: "Jun 30", segment: "Ubud", items: [
        { type: "transfer", title: "Transfers to DPS Airport (Private Transfers)" },
      ]},
    ],
    accommodations: [
      { id: "ac1", hotelId: "ht_horison", dateLabel: "Jun 25 - Jun 28",
        nightsLabel: "1st 2nd 3rd Nights at Kuta, Bali", mealPlan: "Breakfast",
        name: "Horison Seminyak Bali - CHSE Certified", location: "Near to Legian Beach", rating: 4, score: "4.0",
        checkin: "2:00 PM", checkout: "12:00 PM", images: [IMG.bali, IMG.beach, IMG.city, IMG.temple],
        rooms: [{ type: "Deluxe Room", occupancy: "2 Pax", refundable: false, breakfast: true }] },
      { id: "ac2", hotelId: "ht_freddies", dateLabel: "Jun 28 - Jun 30",
        nightsLabel: "4th 5th Nights at Ubud, Bali", mealPlan: "Breakfast",
        name: "Freddies Villa Ubud", location: "6.6 kms from Goa Gajah", rating: 4, score: "4.3",
        checkin: "2:00 PM", checkout: "12:00 PM", images: [IMG.forest, IMG.hill, IMG.bali, IMG.temple],
        rooms: [{ type: "Villa Room", occupancy: "2 Pax", refundable: false, breakfast: true }] },
    ],
    notes: [
      "Once you arrive at airport, our representative will be holding a placard with your name at the Arrivals hall.",
      "Please note the hotel check-in and check-out time while booking your flights.",
      "Early check-in and Late check-out requests are purely based on availability. We will place a request with the hotels but cannot guarantee the same.",
      "All travellers to Bali should carry a double-dose vaccination certificate and a passport with at least 6 months validity.",
      "All private transfers will be in a sedan vehicle.",
      "Bali requires an on-arrival visa which will cost USD 30 per person.",
      "2 days prior to your travel dates our team will create a WhatsApp group to assist you during your trip.",
    ],
    inclusions: [
      "3 nights in Horison Seminyak Bali - CHSE Certified, Kuta + Nusa penida (Deluxe Room, Breakfast, Non-refundable)",
      "2 nights in Freddies Villa Ubud, Ubud (Breakfast, Non-refundable)",
      "To & fro airport transfers in a private vehicle",
      "Intercity & sightseeing transfers in a private vehicle",
      "Lunch is included at Nusa Penida Island Tour",
      "Boat & activity transfers to Nusa penida island on sharing basis; hotel pick up & drop to port is private",
      "GST is included",
    ],
    exclusions: [
      "Any other activities, transfers or meals not mentioned in the itinerary",
      "Flight tickets are not included",
      "TCS 5% is not included",
      "Visa is not included",
      "Travel Insurance is not included",
      "Retribution fee to Nusa penida island IDR 24,000/- (INR 150) is not included",
      "Snorkeling donation at Nusa Penida island is not included",
    ],
    terms: [
      { heading: "Hotel / Land Cancellation Policy", body: "Cancellation policy is subject to change and depends on the hotel policy. In peak season (long weekends, festival season, summer vacation etc.) most hotels charge 100% cancellation." },
      { heading: "ID Proof", body: "A valid Photo ID must be carried by every person above 18 staying at the hotel (Driver's License, Voter Card, Passport, Ration Card). PAN Cards are not accepted." },
      { heading: "Refunds & Personal Expenses", body: "No refund for unused nights or early check-out. The price excludes expenses of a personal nature such as laundry, telephone calls, room service, alcohol, mini-bar, tips, camera fees etc." },
      { heading: "Itinerary Changes", body: "We reserve the right to modify the itinerary due to Force Majeure, strikes, weather, traffic, overbooking or flight changes. We arrange suitable alternates but are not liable for refund/compensation claims arising out of this." },
    ],
  },
];

// Templates = clonable starting points (stored separately from live itineraries)
export const SEED_TRIP_TEMPLATES = [
  {
    id: "tpl_bali6",
    name: "Bali 6D / 5N — Nusa Penida & Ubud",
    destination: "Bali",
    description: "Kuta + Nusa Penida island tour + Ubud sightseeing + East Bali. Two hotels.",
    data: null, // filled at runtime from the seeded itinerary (see store)
  },
];
