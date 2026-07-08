import type { DailyItem, ItemsResponse } from "../shared/types";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? `: ${text}` : ""}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchItems(): Promise<ItemsResponse> {
  const res = await fetch("/api/items");
  return json<ItemsResponse>(res);
}

export async function markReviewed(id: string): Promise<DailyItem> {
  const res = await fetch(`/api/items/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "reviewed" }),
  });
  return json<DailyItem>(res);
}
