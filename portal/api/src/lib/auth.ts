import type { HttpRequest } from "@azure/functions";

// Static Web Apps injects the signed-in user's identity into every request that
// reaches a linked Function as a base64-encoded JSON header. There is no separate
// token validation step needed here — the SWA edge already authenticated the user
// before the request ever reached this Function; this just reads what it decided.
// https://learn.microsoft.com/azure/static-web-apps/user-information?tabs=javascript#api-functions

export interface ClientPrincipal {
  identityProvider: string;
  userId: string;
  userDetails: string;
  userRoles: string[];
}

const ADMIN_ROLE = "program-admin";

export function getClientPrincipal(req: HttpRequest): ClientPrincipal | null {
  const header = req.headers.get("x-ms-client-principal");
  if (!header) return null;
  try {
    const decoded = Buffer.from(header, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded) as ClientPrincipal;
    if (!parsed.userDetails) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isAdmin(principal: ClientPrincipal): boolean {
  return principal.userRoles?.includes(ADMIN_ROLE) ?? false;
}
