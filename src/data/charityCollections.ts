// ─── Curated Charity Collections ────────────────────────────
// Hand-picked, well-established animal-welfare organizations.
// These render with zero API keys configured — donate links go
// straight to Every.org (US 501c3s) or the org's own donate page.
// Live Every.org/GlobalGiving search augments these when keys exist.
// ─────────────────────────────────────────────────────────────

import type { CharityCollection } from "../types.ts";

export const CHARITY_COLLECTIONS: CharityCollection[] = [
  {
    slug: "shelters-and-rescue",
    title: "Shelters & Rescue",
    description: "Organizations pulling animals off the street and out of kill shelters, and getting them into homes.",
    emoji: "🏠",
    charities: [
      {
        provider: "curated",
        id: "best-friends-animal-society",
        name: "Best Friends Animal Society",
        description: "Runs the largest no-kill sanctuary in the US and works with shelters nationwide toward no-kill by every community.",
        country: "US",
        imageUrl: null,
        websiteUrl: "https://bestfriends.org",
        donateUrl: "https://www.every.org/best-friends-animal-society#/donate",
      },
      {
        provider: "curated",
        id: "aspca",
        name: "ASPCA",
        description: "Rescue, adoption, and cruelty-prevention programs across the United States since 1866.",
        country: "US",
        imageUrl: null,
        websiteUrl: "https://www.aspca.org",
        donateUrl: "https://www.every.org/aspca#/donate",
      },
      {
        provider: "curated",
        id: "muttville",
        name: "Muttville Senior Dog Rescue",
        description: "Rescues senior dogs — the animals most likely to be passed over — and finds them homes and hospice care.",
        country: "US",
        imageUrl: null,
        websiteUrl: "https://muttville.org",
        donateUrl: "https://www.every.org/muttville#/donate",
      },
    ],
  },
  {
    slug: "street-animals-worldwide",
    title: "Street Animals Worldwide",
    description: "Groups caring for stray and street animals in places with little or no shelter infrastructure.",
    emoji: "🌍",
    charities: [
      {
        provider: "curated",
        id: "animal-aid-unlimited",
        name: "Animal Aid Unlimited",
        description: "Rescue hospital and sanctuary for injured and ill street animals in Udaipur, India.",
        country: "IN",
        imageUrl: null,
        websiteUrl: "https://animalaidunlimited.org",
        donateUrl: "https://www.every.org/animal-aid-unlimited#/donate",
      },
      {
        provider: "curated",
        id: "soi-dog-foundation",
        name: "Soi Dog Foundation",
        description: "Spay/neuter, medical care, and adoption for street dogs and cats in Thailand; fights the dog meat trade across Asia.",
        country: "TH",
        imageUrl: null,
        websiteUrl: "https://www.soidog.org",
        donateUrl: "https://www.soidog.org/donate",
      },
      {
        provider: "curated",
        id: "four-paws",
        name: "FOUR PAWS International",
        description: "Global animal welfare — stray animal care programs, disaster response, and sanctuaries across Europe, Asia, and Africa.",
        country: "AT",
        imageUrl: null,
        websiteUrl: "https://www.four-paws.org",
        donateUrl: "https://www.four-paws.org/donate",
      },
    ],
  },
  {
    slug: "wildlife-and-conservation",
    title: "Wildlife & Conservation",
    description: "Protecting wild animals and the habitats they depend on.",
    emoji: "🐘",
    charities: [
      {
        provider: "curated",
        id: "sheldrick-wildlife-trust",
        name: "Sheldrick Wildlife Trust",
        description: "Orphaned elephant and rhino rescue and rehabilitation in Kenya; anti-poaching and habitat protection.",
        country: "KE",
        imageUrl: null,
        websiteUrl: "https://www.sheldrickwildlifetrust.org",
        donateUrl: "https://www.every.org/sheldrick-wildlife-trust-usa#/donate",
      },
      {
        provider: "curated",
        id: "wildlife-conservation-society",
        name: "Wildlife Conservation Society",
        description: "Science-driven conservation protecting wildlife in nearly 60 countries and the world's ocean.",
        country: "US",
        imageUrl: null,
        websiteUrl: "https://www.wcs.org",
        donateUrl: "https://www.every.org/wildlife-conservation-society#/donate",
      },
      {
        provider: "curated",
        id: "jane-goodall-institute",
        name: "Jane Goodall Institute",
        description: "Chimpanzee research, sanctuary, and community-centered conservation across Africa.",
        country: "US",
        imageUrl: null,
        websiteUrl: "https://janegoodall.org",
        donateUrl: "https://www.every.org/the-jane-goodall-institute#/donate",
      },
    ],
  },
  {
    slug: "veterinary-care",
    title: "Veterinary Care & Spay/Neuter",
    description: "Free and low-cost veterinary care — the highest-leverage way to reduce animal suffering at scale.",
    emoji: "🩺",
    charities: [
      {
        provider: "curated",
        id: "vets-without-borders",
        name: "Veterinarians Without Borders",
        description: "Deploys veterinary teams to underserved communities and disaster zones worldwide.",
        country: "CA",
        imageUrl: null,
        websiteUrl: "https://www.vetswithoutborders.ca",
        donateUrl: "https://www.vetswithoutborders.ca/donate",
      },
      {
        provider: "curated",
        id: "fixnation",
        name: "FixNation",
        description: "Free spay/neuter clinic for homeless cats — trap-neuter-return at scale.",
        country: "US",
        imageUrl: null,
        websiteUrl: "https://fixnation.org",
        donateUrl: "https://www.every.org/fixnation#/donate",
      },
    ],
  },
];
