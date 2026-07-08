import type { ClientPrincipal } from "../authClient";
import { logoutUrl } from "../authClient";

export type HealthLabel = "ALL CLEAR" | "REVIEW" | "ACTION NEEDED";

interface Props {
  user: ClientPrincipal;
  health: HealthLabel;
  pendingCount: number;
  displayName?: string;
}

const HEALTH_CLASS: Record<HealthLabel, string> = {
  "ALL CLEAR": "health-ok",
  REVIEW: "health-warn",
  "ACTION NEEDED": "health-bad",
};

export function Header({ user, health, pendingCount, displayName }: Props) {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="app-header">
      <div className="app-header-top">
        <div>
          <div className="app-title">Program Portal</div>
          <div className="app-subtitle">
            {displayName ?? user.userDetails}
            <span className={`health-badge ${HEALTH_CLASS[health]}`}>{health}</span>
          </div>
        </div>
        <div className="app-header-right">
          <div className="app-date">{today}</div>
          <div className="app-pending">{pendingCount} item{pendingCount === 1 ? "" : "s"} pending review</div>
          <a className="signout-link" href={logoutUrl()}>
            Sign out
          </a>
        </div>
      </div>
    </header>
  );
}
