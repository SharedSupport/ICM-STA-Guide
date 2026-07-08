import { useCallback, useEffect, useMemo, useState } from "react";
import type { ClientPrincipal } from "./authClient";
import { getClientPrincipal } from "./authClient";
import { fetchItems, markReviewed } from "./apiClient";
import type { DailyItem, ItemCategory } from "../shared/types";
import { CATEGORY_LABELS } from "../shared/types";
import { Header } from "./components/Header";
import type { HealthLabel } from "./components/Header";
import { CategorySection } from "./components/CategorySection";
import { SignIn } from "./components/SignIn";

const CATEGORY_ORDER: ItemCategory[] = [
  "BM_PRN_MISSED",
  "HRST_EXPIRING",
  "CHART_MISSED",
  "ICM_ISSUE",
  "APPOINTMENT",
  "FMLA",
];

function computeHealth(items: DailyItem[]): HealthLabel {
  const pending = items.filter((i) => i.status === "pending");
  if (pending.length === 0) return "ALL CLEAR";
  if (pending.some((i) => i.severity === "red")) return "ACTION NEEDED";
  return "REVIEW";
}

export default function App() {
  const [user, setUser] = useState<ClientPrincipal | null | undefined>(undefined);
  const [items, setItems] = useState<DailyItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClientPrincipal().then(setUser);
  }, []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetchItems();
      setItems(res.items);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load items.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadItems();
  }, [user, loadItems]);

  const handleMarkReviewed = useCallback(async (id: string) => {
    setBusyIds((prev) => new Set(prev).add(id));
    try {
      const updated = await markReviewed(id);
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to mark item reviewed.");
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, []);

  const byPs = useMemo(() => {
    const map = new Map<string, DailyItem[]>();
    for (const item of items) {
      const key = `${item.psName}|${item.psEmail}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [items]);

  if (user === undefined) {
    return <div className="loading-screen">Loading…</div>;
  }
  if (user === null) {
    return <SignIn />;
  }

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const health = computeHealth(items);
  const isMultiPs = byPs.size > 1;

  return (
    <div className="app-shell">
      <Header user={user} health={health} pendingCount={pendingCount} />
      <main className="app-main">
        {loading && <p className="empty-state">Loading your brief…</p>}
        {loadError && <p className="error-banner">{loadError}</p>}
        {!loading && !loadError && items.length === 0 && (
          <p className="empty-state">No flagged items right now. Check back tomorrow.</p>
        )}
        {[...byPs.entries()].map(([key, psItems]) => {
          const [psName] = key.split("|");
          return (
            <div key={key} className="ps-group">
              {isMultiPs && <h1 className="ps-group-heading">{psName}</h1>}
              {CATEGORY_ORDER.map((category) => {
                const categoryItems = psItems.filter((i) => i.category === category);
                if (categoryItems.length === 0) return null;
                return (
                  <CategorySection
                    key={category}
                    category={category}
                    items={categoryItems}
                    onMarkReviewed={handleMarkReviewed}
                    busyIds={busyIds}
                  />
                );
              })}
            </div>
          );
        })}
      </main>
      <footer className="app-footer">
        Program Portal &middot; {Object.keys(CATEGORY_LABELS).length} tracked categories &middot; Data
        refreshes nightly.
      </footer>
    </div>
  );
}
