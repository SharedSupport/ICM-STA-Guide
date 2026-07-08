import type { DailyItem } from "../../../shared/types";
import type { ItemStore } from "./store";
import { buildSeedItems } from "./seedData";

// In-memory store for local development without an Azure Cosmos DB account.
// State lives only for the lifetime of the Functions host process — fine for
// exercising the UI locally, not a substitute for the real store in prod.
class MemoryItemStore implements ItemStore {
  private items = new Map<string, DailyItem>();

  constructor(seed: DailyItem[]) {
    for (const item of seed) this.items.set(item.id, item);
  }

  async listItems(psEmail?: string): Promise<DailyItem[]> {
    const all = [...this.items.values()];
    return psEmail ? all.filter((i) => i.psEmail === psEmail) : all;
  }

  async getItem(id: string): Promise<DailyItem | null> {
    return this.items.get(id) ?? null;
  }

  async markReviewed(id: string, reviewedBy: string): Promise<DailyItem | null> {
    const existing = this.items.get(id);
    if (!existing) return null;
    const updated: DailyItem = {
      ...existing,
      status: "reviewed",
      reviewedBy,
      reviewedAt: new Date().toISOString(),
    };
    this.items.set(id, updated);
    return updated;
  }

  async upsertItems(items: DailyItem[]): Promise<void> {
    for (const item of items) this.items.set(item.id, item);
  }
}

let singleton: MemoryItemStore | undefined;

export function getMemoryStore(): MemoryItemStore {
  if (!singleton) singleton = new MemoryItemStore(buildSeedItems());
  return singleton;
}
