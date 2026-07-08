import { CosmosClient, Container } from "@azure/cosmos";
import type { DailyItem } from "../../../shared/types";
import type { ItemStore } from "./store";

// Container is partitioned by /psEmail — every read/write for a single PS's
// items stays within one logical partition, and the nightly refresh writes are
// naturally spread across partitions rather than hammering one hot partition.
export class CosmosItemStore implements ItemStore {
  private container: Container;

  constructor() {
    const endpoint = requireEnv("COSMOS_ENDPOINT");
    const key = requireEnv("COSMOS_KEY");
    const databaseId = process.env.COSMOS_DATABASE ?? "program-portal";
    const containerId = process.env.COSMOS_CONTAINER ?? "DailyItems";
    const client = new CosmosClient({ endpoint, key });
    this.container = client.database(databaseId).container(containerId);
  }

  async listItems(psEmail?: string): Promise<DailyItem[]> {
    if (psEmail) {
      const { resources } = await this.container.items
        .query<DailyItem>({
          query: "SELECT * FROM c WHERE c.psEmail = @psEmail",
          parameters: [{ name: "@psEmail", value: psEmail }],
        })
        .fetchAll();
      return resources;
    }
    const { resources } = await this.container.items
      .query<DailyItem>("SELECT * FROM c")
      .fetchAll();
    return resources;
  }

  async getItem(id: string): Promise<DailyItem | null> {
    const { resources } = await this.container.items
      .query<DailyItem>({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: id }],
      })
      .fetchAll();
    return resources[0] ?? null;
  }

  async markReviewed(id: string, reviewedBy: string): Promise<DailyItem | null> {
    const existing = await this.getItem(id);
    if (!existing) return null;
    const updated: DailyItem = {
      ...existing,
      status: "reviewed",
      reviewedBy,
      reviewedAt: new Date().toISOString(),
    };
    await this.container.item(id, existing.psEmail).replace(updated);
    return updated;
  }

  async upsertItems(items: DailyItem[]): Promise<void> {
    // Cosmos has no batch-upsert-across-partitions primitive in the JS SDK,
    // so this issues one upsert per item. Fine at this data volume (dozens to
    // low hundreds of items per refresh); revisit with TransactionalBatch
    // per-partition if the caseload grows enough to matter.
    for (const item of items) {
      await this.container.items.upsert(item);
    }
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}
