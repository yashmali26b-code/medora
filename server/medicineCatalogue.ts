import type { MedicineCatalogItem } from "../drizzle/schema";

export type CatalogueStatus = "draft" | "approved" | "archived";

export function normalizeCatalogueQuery(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

export function splitCatalogueTerms(value: string): string[] {
  return value
    .split(/[,;\n]/)
    .map(normalizeCatalogueQuery)
    .filter(Boolean);
}

/**
 * Matches owner-entered query terms only. It intentionally does not infer a diagnosis,
 * predict eligibility, or generate a new medicine recommendation.
 */
export function matchesCatalogueQuery(item: Pick<MedicineCatalogItem, "genericName" | "brandNames" | "searchTerms">, query: string): boolean {
  const normalized = normalizeCatalogueQuery(query);
  if (!normalized) return false;

  const searchableTerms = [
    normalizeCatalogueQuery(item.genericName),
    ...splitCatalogueTerms(item.brandNames),
    ...splitCatalogueTerms(item.searchTerms),
  ];

  return searchableTerms.some((term) => term === normalized || term.includes(normalized) || normalized.includes(term));
}

/** Public search is limited to explicitly approved owner entries that match an owner-entered term. */
export function selectPublicCatalogueMatches<T extends Pick<MedicineCatalogItem, "genericName" | "brandNames" | "searchTerms" | "status">>(items: T[], query: string): T[] {
  return items.filter((item) => item.status === "approved" && matchesCatalogueQuery(item, query));
}
