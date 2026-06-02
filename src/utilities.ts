// ─── Utilities ──────────────────────────────────────────────

import type { PaginationQuery, Pagination } from "./types.ts";

export function buildPagination(query: PaginationQuery): Pagination {
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || "", 10) || 20));
  const offset = Math.max(0, parseInt(query.offset || "", 10) || 0);
  return { limit, offset, skip: offset };
}
