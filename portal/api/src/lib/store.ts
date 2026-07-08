import type { DailyItem } from "../../../shared/types";

export interface ItemStore {
  /** All items for a given PS email, or all items if psEmail is undefined (admin view). */
  listItems(psEmail?: string): Promise<DailyItem[]>;
  getItem(id: string): Promise<DailyItem | null>;
  /** Marks an item reviewed. Returns null if the item does not exist. */
  markReviewed(id: string, reviewedBy: string): Promise<DailyItem | null>;
  /** Used by the nightly refresh job to upsert the latest computed item set. */
  upsertItems(items: DailyItem[]): Promise<void>;
}
