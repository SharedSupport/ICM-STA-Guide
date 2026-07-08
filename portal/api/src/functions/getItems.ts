import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getClientPrincipal, isAdmin } from "../lib/auth";
import { getStore } from "../lib/storeFactory";
import type { ItemsResponse } from "../../../shared/types";

export async function getItems(
  request: HttpRequest,
  _context: InvocationContext,
): Promise<HttpResponseInit> {
  const principal = getClientPrincipal(request);
  if (!principal) {
    return { status: 401, jsonBody: { error: "Not authenticated." } };
  }

  const store = getStore();
  const items = await store.listItems(isAdmin(principal) ? undefined : principal.userDetails);
  const body: ItemsResponse = { items, generatedAt: new Date().toISOString() };
  return { status: 200, jsonBody: body };
}

app.http("getItems", {
  methods: ["GET"],
  // SWA's edge already enforces authentication before this Function is ever
  // invoked (see staticwebapp.config.json's route rules); anonymous here just
  // means "don't also require a Functions key", not "unauthenticated".
  authLevel: "anonymous",
  route: "items",
  handler: getItems,
});
