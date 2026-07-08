import type { ItemStore } from "./store";
import { getMemoryStore } from "./memoryStore";
import { CosmosItemStore } from "./cosmosStore";

let singleton: ItemStore | undefined;

// DATA_STORE=cosmos in production app settings; defaults to the in-memory
// store so `npm start` works locally with zero Azure setup. See README.md.
export function getStore(): ItemStore {
  if (singleton) return singleton;
  const mode = process.env.DATA_STORE ?? "memory";
  singleton = mode === "cosmos" ? new CosmosItemStore() : getMemoryStore();
  return singleton;
}
