// ─── Listing Query + Submission Validation Tests ────────────

import { describe, it, expect } from "vitest";
import { buildListingQuery } from "../src/services/ListingService.ts";
import { validateSubmission } from "../src/services/SubmissionService.ts";

describe("buildListingQuery", () => {
  it("defaults to adoptable status", () => {
    expect(buildListingQuery({})).toEqual({ status: "adoptable" });
  });

  it("drops the status filter when status=any", () => {
    expect(buildListingQuery({ status: "any" })).toEqual({});
  });

  it("combines filters and uppercases country", () => {
    const query = buildListingQuery({ species: "dog", age: "senior", country: "ca", search: "collie" });
    expect(query).toEqual({
      status: "adoptable",
      species: "dog",
      age: "senior",
      "location.country": "CA",
      $text: { $search: "collie" },
    });
  });

  it("builds a $nearSphere geo clause with km→m radius", () => {
    const query = buildListingQuery({ near: { longitude: -123.1, latitude: 49.3, radiusKm: 50 } });
    expect(query["location.coordinates"]).toEqual({
      $nearSphere: {
        $geometry: { type: "Point", coordinates: [-123.1, 49.3] },
        $maxDistance: 50_000,
      },
    });
  });
});

describe("validateSubmission", () => {
  it("accepts a minimal valid submission", () => {
    expect(validateSubmission({ organizationName: "Happy Tails", email: "a@b.org" })).toBeNull();
  });

  it("requires an organization name", () => {
    expect(validateSubmission({ email: "a@b.org" })).toMatch(/organizationName/);
    expect(validateSubmission({ organizationName: "   ", email: "a@b.org" })).toMatch(/organizationName/);
  });

  it("requires a plausible email", () => {
    expect(validateSubmission({ organizationName: "X", email: "nope" })).toMatch(/email/);
    expect(validateSubmission({ organizationName: "X" })).toMatch(/email/);
  });

  it("caps message length", () => {
    expect(validateSubmission({ organizationName: "X", email: "a@b.org", message: "y".repeat(5001) })).toMatch(/too long/);
  });
});
