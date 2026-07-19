// ─── GlobalGiving Connector ─────────────────────────────────
// GlobalGiving API (https://www.globalgiving.org/api/) — vetted
// projects in 160+ countries; the international reach of the
// giving layer. Donations happen on globalgiving.org.
// ─────────────────────────────────────────────────────────────

import CONFIG from "../config.ts";
import type { CharityResult } from "../types.ts";

const API_BASE = "https://api.globalgiving.org/api/public";

export function isGlobalGivingConfigured(): boolean {
  return Boolean(CONFIG.GLOBALGIVING_API_KEY);
}

// Exported for tests
export function mapGlobalGivingProject(project: Record<string, any>): CharityResult {
  const id = String(project.id ?? "");
  const projectLink = String(project.projectLink || `https://www.globalgiving.org/projects/${id}/`);
  return {
    provider: "globalgiving",
    id,
    name: String(project.title || "Unknown project"),
    description: String(project.summary || ""),
    country: String(project.country || ""),
    imageUrl: project.imageLink || project.image?.imagelink?.[0]?.url || null,
    websiteUrl: projectLink,
    donateUrl: projectLink,
  };
}

export async function searchGlobalGiving(query: string, limit = 20): Promise<CharityResult[]> {
  const params = new URLSearchParams({
    api_key: CONFIG.GLOBALGIVING_API_KEY,
    q: query,
    "filter": "theme:animals",
  });
  const url = `${API_BASE}/services/search/projects?${params}`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`GlobalGiving search failed: ${response.status}`);
  }
  const data = (await response.json()) as {
    search?: { response?: { projects?: { project?: Record<string, unknown>[] } } };
  };
  const projects = data.search?.response?.projects?.project || [];
  return projects.slice(0, limit).map(mapGlobalGivingProject);
}
