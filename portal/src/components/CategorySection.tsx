import type { DailyItem, ItemCategory } from "../../shared/types";
import { CATEGORY_LABELS } from "../../shared/types";
import { ItemCard } from "./ItemCard";

interface Props {
  category: ItemCategory;
  items: DailyItem[];
  onMarkReviewed: (id: string) => void;
  busyIds: Set<string>;
}

export function CategorySection({ category, items, onMarkReviewed, busyIds }: Props) {
  const pending = items.filter((i) => i.status === "pending");
  const reviewed = items.filter((i) => i.status === "reviewed");

  return (
    <section className="category-section">
      <h2>
        {CATEGORY_LABELS[category]}
        <span className="category-count">{pending.length}</span>
      </h2>
      {items.length === 0 ? (
        <p className="empty-state">Nothing to review.</p>
      ) : (
        <div className="item-list">
          {[...pending, ...reviewed].map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onMarkReviewed={onMarkReviewed}
              busy={busyIds.has(item.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
