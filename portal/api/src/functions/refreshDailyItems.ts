import { app, InvocationContext, Timer } from "@azure/functions";
import { getStore } from "../lib/storeFactory";
import { fetchCandidateItems } from "../lib/fetchCandidates";
import { mergeRefresh } from "../lib/mergeRefresh";

// Scheduled to match roughly when the VBA macro runs today (early morning,
// before staff arrive). CRON is UTC; adjust for daylight saving as needed, or
// move to an App Setting if the exact time needs to be admin-configurable.
const SCHEDULE = "0 0 9 * * *"; // 9:00 AM UTC ≈ 5:00 AM Eastern

export async function refreshDailyItems(_timer: Timer, context: InvocationContext): Promise<void> {
  const store = getStore();
  const candidates = await fetchCandidateItems();

  if (candidates.length === 0) {
    context.log("refreshDailyItems: no candidate items from source systems yet (Graph API integration pending, see docs/program-portal-architecture.md).");
    return;
  }

  const existing = await store.listItems();
  const existingById = new Map(existing.map((item) => [item.id, item]));
  const merged = mergeRefresh(existingById, candidates);
  await store.upsertItems(merged);
  context.log(`refreshDailyItems: upserted ${merged.length} items.`);
}

app.timer("refreshDailyItems", {
  schedule: SCHEDULE,
  handler: refreshDailyItems,
});
