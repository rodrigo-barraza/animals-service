// ─── Sync Service ───────────────────────────────────────────
// Pulls adoptable-animal listings from configured external sources
// into the local cache. Page-capped per run (ANIMALS_SYNC_MAX_PAGES)
// so a run is cheap; staleness marking handles delisted animals.
// ─────────────────────────────────────────────────────────────

import { getDatabase } from "@rodrigo-barraza/utilities-library/service";
import CONFIG from "../config.ts";
import logger from "../logger.ts";
import { COLLECTIONS, LISTING_SOURCE, LISTING_STALE_DAYS } from "../constants.ts";
import type { SyncRunDocument, SyncSourceResult } from "../types.ts";
import {
  fetchPetfinderAnimalsPage,
  fetchPetfinderOrganizationsPage,
  isPetfinderConfigured,
} from "../connectors/PetfinderConnector.ts";
import { fetchRescueGroupsPage, isRescueGroupsConfigured } from "../connectors/RescueGroupsConnector.ts";
import { upsertSyncedListings, markStaleListingsRemoved } from "./ListingService.ts";
import { upsertSyncedOrganizations, getOrganizationCoordinateMap } from "./OrganizationService.ts";

let syncInProgress = false;

function runsCollection() {
  return getDatabase().collection<SyncRunDocument>(COLLECTIONS.SYNC_RUNS);
}

async function syncPetfinder(): Promise<SyncSourceResult> {
  const result: SyncSourceResult = {
    source: LISTING_SOURCE.PETFINDER,
    configured: isPetfinderConfigured(),
    listingsUpserted: 0,
    organizationsUpserted: 0,
    pagesFetched: 0,
    error: null,
  };
  if (!result.configured) return result;

  try {
    // Organizations first so listing geo backfill can find them.
    for (let page = 1; page <= CONFIG.ANIMALS_SYNC_MAX_PAGES; page++) {
      const { organizations, totalPages } = await fetchPetfinderOrganizationsPage(page);
      result.organizationsUpserted += await upsertSyncedOrganizations(organizations);
      if (page >= totalPages) break;
    }
    for (let page = 1; page <= CONFIG.ANIMALS_SYNC_MAX_PAGES; page++) {
      const { listings, totalPages } = await fetchPetfinderAnimalsPage(page);
      // Petfinder animals carry no coordinates — copy from their org when known.
      const orgIds = [...new Set(listings.map((listing) => listing.organizationSourceId).filter(Boolean))];
      const coordinateMap = await getOrganizationCoordinateMap(LISTING_SOURCE.PETFINDER, orgIds);
      for (const listing of listings) {
        listing.location.coordinates = coordinateMap.get(listing.organizationSourceId) ?? null;
      }
      result.listingsUpserted += await upsertSyncedListings(listings);
      result.pagesFetched = page;
      if (page >= totalPages) break;
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    logger.error(`Petfinder sync failed: ${result.error}`);
  }
  return result;
}

async function syncRescueGroups(): Promise<SyncSourceResult> {
  const result: SyncSourceResult = {
    source: LISTING_SOURCE.RESCUEGROUPS,
    configured: isRescueGroupsConfigured(),
    listingsUpserted: 0,
    organizationsUpserted: 0,
    pagesFetched: 0,
    error: null,
  };
  if (!result.configured) return result;

  try {
    for (let page = 1; page <= CONFIG.ANIMALS_SYNC_MAX_PAGES; page++) {
      const { listings, organizations, totalPages } = await fetchRescueGroupsPage(page);
      result.organizationsUpserted += await upsertSyncedOrganizations(organizations);
      result.listingsUpserted += await upsertSyncedListings(listings);
      result.pagesFetched = page;
      if (page >= totalPages) break;
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    logger.error(`RescueGroups sync failed: ${result.error}`);
  }
  return result;
}

export function isAnySourceConfigured(): boolean {
  return isPetfinderConfigured() || isRescueGroupsConfigured();
}

export async function runSync(trigger: "manual" | "cron"): Promise<SyncRunDocument | { skipped: string }> {
  if (syncInProgress) return { skipped: "sync already in progress" };
  syncInProgress = true;

  const run: SyncRunDocument = {
    trigger,
    startedAt: new Date(),
    finishedAt: null,
    results: [],
    staleRemoved: 0,
  };
  try {
    run.results = [await syncPetfinder(), await syncRescueGroups()];
    const cutoff = new Date(Date.now() - LISTING_STALE_DAYS * 24 * 60 * 60 * 1000);
    run.staleRemoved = await markStaleListingsRemoved(cutoff);
    run.finishedAt = new Date();
    const inserted = await runsCollection().insertOne(run);
    logger.info(
      `Sync (${trigger}) finished: ${run.results
        .map((r) => `${r.source}=${r.configured ? r.listingsUpserted : "unconfigured"}`)
        .join(", ")}, stale removed=${run.staleRemoved}`,
    );
    return { ...run, _id: inserted.insertedId };
  } finally {
    syncInProgress = false;
  }
}

export async function getSyncStatus() {
  const lastRuns = await runsCollection().find().sort({ startedAt: -1 }).limit(5).toArray();
  return {
    inProgress: syncInProgress,
    sources: {
      petfinder: { configured: isPetfinderConfigured() },
      rescuegroups: { configured: isRescueGroupsConfigured() },
    },
    lastRuns,
  };
}
