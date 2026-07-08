// Wraps Static Web Apps' built-in auth endpoints (/.auth/me, /.auth/login/aad,
// /.auth/logout). These are injected by the SWA runtime — both in production and
// when running locally via `swa start` — so no MSAL/custom auth code is needed here.
// See: https://learn.microsoft.com/azure/static-web-apps/user-information

export interface ClientPrincipal {
  identityProvider: string;
  userId: string;
  userDetails: string; // email address for Entra ID
  userRoles: string[];
}

export async function getClientPrincipal(): Promise<ClientPrincipal | null> {
  try {
    const res = await fetch("/.auth/me");
    if (!res.ok) return null;
    const payload = (await res.json()) as { clientPrincipal: ClientPrincipal | null };
    return payload.clientPrincipal;
  } catch {
    return null;
  }
}

export function loginUrl(): string {
  return `/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent(window.location.pathname)}`;
}

export function logoutUrl(): string {
  return `/.auth/logout?post_logout_redirect_uri=${encodeURIComponent("/")}`;
}
