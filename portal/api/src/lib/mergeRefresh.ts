import type { DailyItem } from "../../../shared/types";
import { REAPPEARING_CATEGORIES } from "../../../shared/types";

/**
 * Reconciles a freshly computed set of "candidate" items (what the source
 * reports say is true as of this refresh) against what's currently stored,
 * applying the reviewed-item suppression policy from
 * docs/program-portal-architecture.md §5:
 *
 *  - A category in REAPPEARING_CATEGORIES (missed PRN, expiring HRST, missed
 *    chart) that was reviewed but is *still being generated* by the source
 *    data means the underlying problem is still unresolved — it comes back
 *    as pending.
 *  - Everything else, once reviewed, stays reviewed even if the same
 *    candidate id is generated again (e.g. a one-time "new ICM issue" alert
 *    doesn't need to nag twice).
 *  - A brand new candidate id is inserted as pending with today marked as
 *    firstSeenDate.
 *
 * Candidates that no longer appear (the underlying issue resolved) are left
 * untouched in the store rather than deleted — callers should scope "today's
 * view" queries by sourceDate if they want resolved items to drop out of
 * sight. Actual deletion/archival of long-resolved items is a follow-up,
 * not yet needed at this data volume.
 */
export function mergeRefresh(
  existingById: ReadonlyMap<string, DailyItem>,
  candidates: readonly DailyItem[],
): DailyItem[] {
  return candidates.map((candidate) => {
    const existing = existingById.get(candidate.id);
    if (!existing) {
      return candidate;
    }

    if (existing.status === "pending") {
      return {
        ...candidate,
        firstSeenDate: existing.firstSeenDate,
      };
    }

    // existing.status === "reviewed"
    if (REAPPEARING_CATEGORIES.has(candidate.category)) {
      return {
        ...candidate,
        firstSeenDate: existing.firstSeenDate,
        status: "pending",
        reviewedBy: null,
        reviewedAt: null,
      };
    }

    return {
      ...candidate,
      firstSeenDate: existing.firstSeenDate,
      status: "reviewed",
      reviewedBy: existing.reviewedBy,
      reviewedAt: existing.reviewedAt,
    };
  });
}
