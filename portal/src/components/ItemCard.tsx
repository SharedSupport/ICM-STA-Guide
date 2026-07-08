import type { DailyItem } from "../../shared/types";

interface Props {
  item: DailyItem;
  onMarkReviewed: (id: string) => void;
  busy: boolean;
}

const SEVERITY_LABEL: Record<DailyItem["severity"], string> = {
  red: "Action Needed",
  amber: "Review",
  info: "Info",
};

export function ItemCard({ item, onMarkReviewed, busy }: Props) {
  const isReviewed = item.status === "reviewed";
  return (
    <div className={`item-card severity-${item.severity}${isReviewed ? " reviewed" : ""}`}>
      <div className="item-card-main">
        <span className={`pill pill-${item.severity}`}>{SEVERITY_LABEL[item.severity]}</span>
        <div className="item-card-text">
          <div className="item-individual">{item.individual}</div>
          <div className="item-description">{item.description}</div>
          <div className="item-meta">
            First seen {item.firstSeenDate} &middot; Updated {item.sourceDate}
          </div>
        </div>
      </div>
      <div className="item-card-action">
        {isReviewed ? (
          <span className="reviewed-tag">
            &#10004; Reviewed{item.reviewedBy ? ` by ${item.reviewedBy}` : ""}
          </span>
        ) : (
          <button disabled={busy} onClick={() => onMarkReviewed(item.id)}>
            {busy ? "Saving…" : "Mark Reviewed"}
          </button>
        )}
      </div>
    </div>
  );
}
