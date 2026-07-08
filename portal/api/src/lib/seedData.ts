import type { DailyItem } from "../../../shared/types";

// Sample data for local development only — shaped like what the real nightly
// refresh (once wired to Graph API + the ICM/HRST/BM-PRN workbooks) will produce.
// Used automatically when DATA_STORE=memory (the default for local dev).

function isoDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

const today = isoDate(0);

export function buildSeedItems(): DailyItem[] {
  const ps = [
    { name: "Jane Smith", email: "jsmith@sharedsupport.org" },
    { name: "Marcus Lee", email: "mlee@sharedsupport.org" },
  ];

  const items: DailyItem[] = [
    {
      id: `${ps[0].email}|BM_PRN_MISSED|JOHN DOE`,
      psEmail: ps[0].email,
      psName: ps[0].name,
      category: "BM_PRN_MISSED",
      severity: "red",
      individual: "John Doe",
      description: "MISSED PRN (4 days since last BM)",
      sourceDate: today,
      firstSeenDate: isoDate(1),
      status: "pending",
      reviewedBy: null,
      reviewedAt: null,
    },
    {
      id: `${ps[0].email}|HRST_EXPIRING|MARY JOHNSON`,
      psEmail: ps[0].email,
      psName: ps[0].name,
      category: "HRST_EXPIRING",
      severity: "amber",
      individual: "Mary Johnson",
      description: "HRST assessment action due within 30 days (action by 7/20)",
      sourceDate: today,
      firstSeenDate: isoDate(3),
      status: "pending",
      reviewedBy: null,
      reviewedAt: null,
    },
    {
      id: `${ps[0].email}|CHART_MISSED|ROBERT PORITSKY`,
      psEmail: ps[0].email,
      psName: ps[0].name,
      category: "CHART_MISSED",
      severity: "red",
      individual: "Robert Poritsky",
      description: "Overnight chart not completed yesterday",
      sourceDate: today,
      firstSeenDate: today,
      status: "pending",
      reviewedBy: null,
      reviewedAt: null,
    },
    {
      id: `${ps[0].email}|ICM_ISSUE|JOHN DOE|time-mismatch-0712`,
      psEmail: ps[0].email,
      psName: ps[0].name,
      category: "ICM_ISSUE",
      severity: "amber",
      individual: "John Doe",
      description: "Time Mismatch flagged in ICM STA verification",
      sourceDate: today,
      firstSeenDate: today,
      status: "pending",
      reviewedBy: null,
      reviewedAt: null,
    },
    {
      id: `${ps[0].email}|APPOINTMENT|MARY JOHNSON|today-3pm`,
      psEmail: ps[0].email,
      psName: ps[0].name,
      category: "APPOINTMENT",
      severity: "info",
      individual: "Mary Johnson",
      description: "Dental / Routine at 3:00 PM with Dr. Alvarez",
      sourceDate: today,
      firstSeenDate: today,
      status: "reviewed",
      reviewedBy: ps[0].name,
      reviewedAt: new Date().toISOString(),
    },
    {
      id: `${ps[1].email}|FMLA|SAM WRIGHT`,
      psEmail: ps[1].email,
      psName: ps[1].name,
      category: "FMLA",
      severity: "amber",
      individual: "Sam Wright (staff)",
      description: "Returning from leave within 7 days (expected 7/13)",
      sourceDate: today,
      firstSeenDate: isoDate(2),
      status: "pending",
      reviewedBy: null,
      reviewedAt: null,
    },
    {
      id: `${ps[1].email}|HRST_EXPIRING|ALEX RIVERA`,
      psEmail: ps[1].email,
      psName: ps[1].name,
      category: "HRST_EXPIRING",
      severity: "red",
      individual: "Alex Rivera",
      description: "HRST assessment action overdue by 2 days",
      sourceDate: today,
      firstSeenDate: isoDate(5),
      status: "pending",
      reviewedBy: null,
      reviewedAt: null,
    },
  ];

  return items;
}
