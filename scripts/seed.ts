// ─── Seed Script ────────────────────────────────────────────
// Inserts sample adoptable listings + organizations (source:
// "sample") so the client is demoable before any external API
// keys are configured. Idempotent — upserts by (source, sourceId).
//
//   npm run seed
// ─────────────────────────────────────────────────────────────

import { bootstrapEnvironment } from "@rodrigo-barraza/utilities-library/vault";

await bootstrapEnvironment();

const { MongoClient } = await import("mongodb");
const { COLLECTIONS, LISTING_SOURCE, LISTING_STATUS } = await import("../src/constants.ts");
const CONFIG = (await import("../src/config.ts")).default;

const now = new Date();

const organizations = [
  {
    source: LISTING_SOURCE.SAMPLE,
    sourceId: "org-happy-tails",
    name: "Happy Tails Rescue",
    slug: "happy-tails-rescue",
    email: "hello@happytails.example",
    phone: "",
    website: "https://happytails.example",
    url: null,
    description: "Volunteer-run rescue finding homes for dogs and cats across the Pacific Northwest.",
    photos: [],
    address: { street: "", city: "Vancouver", state: "BC", postcode: "", country: "CA" },
    coordinates: { type: "Point", coordinates: [-123.1207, 49.2827] },
    verified: true,
    syncedAt: now, createdAt: now, updatedAt: now,
  },
  {
    source: LISTING_SOURCE.SAMPLE,
    sourceId: "org-second-chance",
    name: "Second Chance Shelter",
    slug: "second-chance-shelter",
    email: "adopt@secondchance.example",
    phone: "",
    website: "https://secondchance.example",
    url: null,
    description: "Open-admission shelter with a focus on seniors and special-needs animals.",
    photos: [],
    address: { street: "", city: "Seattle", state: "WA", postcode: "", country: "US" },
    coordinates: { type: "Point", coordinates: [-122.3321, 47.6062] },
    verified: true,
    syncedAt: now, createdAt: now, updatedAt: now,
  },
  {
    source: LISTING_SOURCE.SAMPLE,
    sourceId: "org-street-paws",
    name: "Street Paws International",
    slug: "street-paws-international",
    email: "contact@streetpaws.example",
    phone: "",
    website: "https://streetpaws.example",
    url: null,
    description: "Street-animal rescue and rehoming, with international adoption flights.",
    photos: [],
    address: { street: "", city: "Bangkok", state: "", postcode: "", country: "TH" },
    coordinates: { type: "Point", coordinates: [100.5018, 13.7563] },
    verified: true,
    syncedAt: now, createdAt: now, updatedAt: now,
  },
];

interface SampleListing {
  sourceId: string; name: string; species: string; breed: string; age: string;
  sex: string; size: string; description: string; org: string;
  city: string; state: string; country: string; coords: [number, number] | null;
  attrs?: Partial<Record<"spayedNeutered" | "houseTrained" | "specialNeeds" | "shotsCurrent" | "goodWithChildren" | "goodWithDogs" | "goodWithCats", boolean>>;
}

const samples: SampleListing[] = [
  { sourceId: "pet-luna", name: "Luna", species: "dog", breed: "Border Collie", age: "young", sex: "female", size: "medium", org: "org-happy-tails", city: "Vancouver", state: "BC", country: "CA", coords: [-123.1207, 49.2827], description: "Luna is a whip-smart border collie who knows sit, stay, and how to open lever door handles. She needs a home with space to run and a human who enjoys being outsmarted.", attrs: { spayedNeutered: true, houseTrained: true, shotsCurrent: true, goodWithDogs: true } },
  { sourceId: "pet-mochi", name: "Mochi", species: "cat", breed: "Domestic Shorthair", age: "baby", sex: "male", size: "small", org: "org-happy-tails", city: "Vancouver", state: "BC", country: "CA", coords: [-123.1207, 49.2827], description: "A four-month-old orange menace with a motor that never stops. Mochi was bottle-raised by fosters and thinks humans are furniture.", attrs: { shotsCurrent: true, goodWithCats: true, goodWithChildren: true } },
  { sourceId: "pet-biscuit", name: "Biscuit", species: "dog", breed: "Golden Retriever", age: "senior", sex: "male", size: "large", org: "org-second-chance", city: "Seattle", state: "WA", country: "US", coords: [-122.3321, 47.6062], description: "Ten years young, Biscuit was surrendered when his family moved. He is a certified good boy: gentle with kids, calm indoors, and an expert napper looking for a soft landing.", attrs: { spayedNeutered: true, houseTrained: true, shotsCurrent: true, goodWithChildren: true, goodWithDogs: true, goodWithCats: true } },
  { sourceId: "pet-clover", name: "Clover", species: "rabbit", breed: "Holland Lop", age: "adult", sex: "female", size: "small", org: "org-second-chance", city: "Seattle", state: "WA", country: "US", coords: [-122.3321, 47.6062], description: "Clover is a litter-trained lop who free-roams politely and loves cilantro more than life itself.", attrs: { spayedNeutered: true, houseTrained: true } },
  { sourceId: "pet-pepper", name: "Pepper", species: "cat", breed: "Tuxedo", age: "adult", sex: "female", size: "medium", org: "org-second-chance", city: "Seattle", state: "WA", country: "US", coords: [-122.3321, 47.6062], description: "Pepper is a dignified tuxedo cat with one working ear and zero patience for closed doors. FIV-positive and perfectly healthy — she just needs to be an only cat or live with other FIV+ friends.", attrs: { spayedNeutered: true, specialNeeds: true, shotsCurrent: true } },
  { sourceId: "pet-rocket", name: "Rocket", species: "dog", breed: "Thai Ridgeback", age: "young", sex: "male", size: "medium", org: "org-street-paws", city: "Bangkok", state: "", country: "TH", coords: [100.5018, 13.7563], description: "Rescued from a market as a puppy, Rocket is now a sleek, loyal shadow who adores people. Flight-ready with full vaccinations and an international health certificate.", attrs: { spayedNeutered: true, shotsCurrent: true, goodWithDogs: true } },
  { sourceId: "pet-sunny", name: "Sunny", species: "bird", breed: "Cockatiel", age: "adult", sex: "unknown", size: "small", org: "org-happy-tails", city: "Vancouver", state: "BC", country: "CA", coords: [-123.1207, 49.2827], description: "Sunny whistles the first four notes of a song nobody has identified yet. Comes with cage, toys, and strong opinions about millet." },
  { sourceId: "pet-tank", name: "Tank", species: "dog", breed: "American Bulldog", age: "adult", sex: "male", size: "xlarge", org: "org-second-chance", city: "Seattle", state: "WA", country: "US", coords: [-122.3321, 47.6062], description: "Tank is 40 kilograms of couch potato. Long-stay resident (400+ days) — he gets overlooked because of his size, but he is the staff's unanimous favorite.", attrs: { spayedNeutered: true, houseTrained: true, shotsCurrent: true, goodWithChildren: true } },
];

const listings = samples.map((sample) => ({
  source: LISTING_SOURCE.SAMPLE,
  sourceId: sample.sourceId,
  name: sample.name,
  species: sample.species,
  breed: sample.breed,
  breedSecondary: "",
  mixedBreed: false,
  age: sample.age,
  sex: sample.sex,
  size: sample.size,
  status: LISTING_STATUS.ADOPTABLE,
  description: sample.description,
  photos: [],
  attributes: {
    spayedNeutered: sample.attrs?.spayedNeutered ?? null,
    houseTrained: sample.attrs?.houseTrained ?? null,
    specialNeeds: sample.attrs?.specialNeeds ?? null,
    shotsCurrent: sample.attrs?.shotsCurrent ?? null,
    goodWithChildren: sample.attrs?.goodWithChildren ?? null,
    goodWithDogs: sample.attrs?.goodWithDogs ?? null,
    goodWithCats: sample.attrs?.goodWithCats ?? null,
  },
  organizationSourceId: sample.org,
  location: {
    city: sample.city,
    state: sample.state,
    postcode: "",
    country: sample.country,
    coordinates: sample.coords ? { type: "Point" as const, coordinates: sample.coords } : null,
  },
  url: null,
  publishedAt: now,
  syncedAt: now,
  createdAt: now,
  updatedAt: now,
}));

const client = new MongoClient(CONFIG.MONGODB_URI);
await client.connect();
const db = client.db(CONFIG.MONGODB_DB_NAME);

for (const org of organizations) {
  const { createdAt, ...rest } = org;
  await db.collection(COLLECTIONS.ORGANIZATIONS).updateOne(
    { source: org.source, sourceId: org.sourceId },
    { $set: rest, $setOnInsert: { createdAt } },
    { upsert: true },
  );
}
for (const listing of listings) {
  const { createdAt, ...rest } = listing;
  await db.collection(COLLECTIONS.LISTINGS).updateOne(
    { source: listing.source, sourceId: listing.sourceId },
    { $set: rest, $setOnInsert: { createdAt } },
    { upsert: true },
  );
}

console.log(`Seeded ${organizations.length} organizations and ${listings.length} listings (source: sample).`);
await client.close();
