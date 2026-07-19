// ─── Connector Mapper Tests ─────────────────────────────────
// Fixture payloads shaped like the real provider responses, run
// through the pure mappers. No network, no database.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import { mapPetfinderAnimal, mapPetfinderOrganization } from "../src/connectors/PetfinderConnector.ts";
import { parseRescueGroupsPage } from "../src/connectors/RescueGroupsConnector.ts";
import { mapEveryOrgNonprofit } from "../src/connectors/EveryOrgConnector.ts";
import { mapGlobalGivingProject } from "../src/connectors/GlobalGivingConnector.ts";
import { mapEveryOrgWebhook } from "../src/services/DonationService.ts";

const NOW = new Date("2026-07-18T00:00:00Z");

describe("Petfinder mapper", () => {
  const fixture = {
    id: 74213456,
    organization_id: "WA252",
    url: "https://www.petfinder.com/dog/kona-74213456/",
    type: "Dog",
    breeds: { primary: "Labrador Retriever", secondary: "Husky", mixed: true },
    age: "Young",
    gender: "Female",
    size: "Medium",
    attributes: { spayed_neutered: true, house_trained: false, special_needs: false, shots_current: true },
    environment: { children: true, dogs: true, cats: null },
    name: "Kona",
    description: "A very good girl.",
    photos: [{ small: "s.jpg", medium: "m.jpg", large: "l.jpg", full: "f.jpg" }],
    status: "adoptable",
    published_at: "2026-07-01T12:00:00+0000",
    contact: { address: { city: "Seattle", state: "WA", postcode: "98101", country: "US" } },
  };

  it("maps a Petfinder animal to a listing document", () => {
    const listing = mapPetfinderAnimal(fixture, NOW);
    expect(listing.source).toBe("petfinder");
    expect(listing.sourceId).toBe("74213456");
    expect(listing.name).toBe("Kona");
    expect(listing.species).toBe("dog");
    expect(listing.breed).toBe("Labrador Retriever");
    expect(listing.mixedBreed).toBe(true);
    expect(listing.age).toBe("young");
    expect(listing.sex).toBe("female");
    expect(listing.size).toBe("medium");
    expect(listing.status).toBe("adoptable");
    expect(listing.photos).toEqual(["l.jpg"]);
    expect(listing.attributes.spayedNeutered).toBe(true);
    expect(listing.attributes.houseTrained).toBe(false);
    expect(listing.attributes.goodWithCats).toBeNull();
    expect(listing.organizationSourceId).toBe("WA252");
    expect(listing.location.city).toBe("Seattle");
    expect(listing.location.country).toBe("US");
    expect(listing.location.coordinates).toBeNull();
    expect(listing.publishedAt).toEqual(new Date("2026-07-01T12:00:00+0000"));
  });

  it("maps species variants", () => {
    expect(mapPetfinderAnimal({ ...fixture, type: "Small & Furry" }, NOW).species).toBe("small_pet");
    expect(mapPetfinderAnimal({ ...fixture, type: "Scales, Fins & Other" }, NOW).species).toBe("reptile");
    expect(mapPetfinderAnimal({ ...fixture, type: "Rabbit" }, NOW).species).toBe("rabbit");
  });

  it("handles missing fields without throwing", () => {
    const listing = mapPetfinderAnimal({ id: 1 }, NOW);
    expect(listing.name).toBe("Unnamed friend");
    expect(listing.species).toBe("other");
    expect(listing.age).toBe("unknown");
    expect(listing.photos).toEqual([]);
    expect(listing.publishedAt).toBeNull();
  });

  it("maps a Petfinder organization", () => {
    const org = mapPetfinderOrganization(
      {
        id: "WA252",
        name: "Second Chance",
        email: "a@b.org",
        url: "https://www.petfinder.com/member/wa252/",
        website: "https://secondchance.org",
        mission_statement: "Saving animals.",
        address: { address1: "1 Main St", city: "Seattle", state: "WA", postcode: "98101", country: "US" },
      },
      NOW,
    );
    expect(org.source).toBe("petfinder");
    expect(org.sourceId).toBe("WA252");
    expect(org.slug).toBe("wa252");
    expect(org.website).toBe("https://secondchance.org");
    expect(org.address.city).toBe("Seattle");
  });
});

describe("RescueGroups parser", () => {
  const fixture = {
    data: [
      {
        type: "animals",
        id: "20941234",
        attributes: {
          name: "Ziggy",
          breedPrimary: "Domestic Short Hair",
          isBreedMixed: false,
          ageGroup: "Senior",
          sex: "Male",
          sizeGroup: "Medium",
          descriptionText: "Sweet old man.",
          isAltered: true,
          isCatsOk: true,
          url: "https://example.rescuegroups.org/animals/ziggy",
          createdDate: "2026-06-15T00:00:00Z",
        },
        relationships: {
          species: { data: [{ type: "species", id: "2" }] },
          orgs: { data: [{ type: "orgs", id: "5551" }] },
          pictures: { data: [{ type: "pictures", id: "p1" }] },
        },
      },
    ],
    included: [
      { type: "species", id: "2", attributes: { singular: "Cat" } },
      { type: "pictures", id: "p1", attributes: { large: { url: "https://cdn.example/p1-large.jpg" } } },
      {
        type: "orgs",
        id: "5551",
        attributes: {
          name: "Whisker Rescue",
          city: "Portland",
          state: "OR",
          postalcode: "97201",
          country: "United States",
          lat: 45.5152,
          lon: -122.6784,
          email: "meow@whisker.org",
        },
      },
    ],
    meta: { pages: 42 },
  };

  it("maps animals with included species, pictures, and org geo", () => {
    const { listings, organizations, totalPages } = parseRescueGroupsPage(fixture, NOW);
    expect(totalPages).toBe(42);
    expect(organizations).toHaveLength(1);
    expect(organizations[0].name).toBe("Whisker Rescue");
    expect(organizations[0].coordinates).toEqual({ type: "Point", coordinates: [-122.6784, 45.5152] });

    expect(listings).toHaveLength(1);
    const listing = listings[0];
    expect(listing.source).toBe("rescuegroups");
    expect(listing.species).toBe("cat");
    expect(listing.age).toBe("senior");
    expect(listing.photos).toEqual(["https://cdn.example/p1-large.jpg"]);
    expect(listing.organizationSourceId).toBe("5551");
    expect(listing.location.city).toBe("Portland");
    expect(listing.location.coordinates).toEqual({ type: "Point", coordinates: [-122.6784, 45.5152] });
  });

  it("drops 0,0 coordinates", () => {
    const modified = structuredClone(fixture);
    (modified.included[2].attributes as Record<string, unknown>).lat = 0;
    (modified.included[2].attributes as Record<string, unknown>).lon = 0;
    const { organizations } = parseRescueGroupsPage(modified, NOW);
    expect(organizations[0].coordinates).toBeNull();
  });

  it("handles an empty page", () => {
    const { listings, organizations, totalPages } = parseRescueGroupsPage({}, NOW);
    expect(listings).toEqual([]);
    expect(organizations).toEqual([]);
    expect(totalPages).toBe(1);
  });
});

describe("Giving provider mappers", () => {
  it("maps an Every.org nonprofit", () => {
    const charity = mapEveryOrgNonprofit({
      slug: "soi-dog-foundation",
      name: "Soi Dog",
      description: "Street dogs.",
      logoUrl: "logo.png",
      websiteUrl: "https://soidog.org",
    });
    expect(charity.provider).toBe("everyorg");
    expect(charity.donateUrl).toBe("https://www.every.org/soi-dog-foundation#/donate");
    expect(charity.imageUrl).toBe("logo.png");
  });

  it("maps a GlobalGiving project", () => {
    const charity = mapGlobalGivingProject({
      id: 12345,
      title: "Save Street Dogs in India",
      summary: "Medical care for street dogs.",
      country: "India",
      projectLink: "https://www.globalgiving.org/projects/save-street-dogs/",
    });
    expect(charity.provider).toBe("globalgiving");
    expect(charity.id).toBe("12345");
    expect(charity.country).toBe("India");
    expect(charity.donateUrl).toBe("https://www.globalgiving.org/projects/save-street-dogs/");
  });

  it("maps an Every.org donation webhook payload", () => {
    const donation = mapEveryOrgWebhook({
      chargeId: "ch_123",
      partnerDonationId: "pd_9",
      amount: "25.00",
      currency: "usd",
      frequency: "Monthly",
      toNonprofit: { slug: "aspca" },
    });
    expect(donation.provider).toBe("everyorg");
    expect(donation.chargeId).toBe("ch_123");
    expect(donation.nonprofitSlug).toBe("aspca");
    expect(donation.amount).toBe(25);
    expect(donation.currency).toBe("USD");
  });

  it("tolerates malformed webhook payloads", () => {
    const donation = mapEveryOrgWebhook({ amount: "not-a-number" });
    expect(donation.amount).toBeNull();
    expect(donation.chargeId).toBe("");
  });
});
