import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getClientPrincipal, isAdmin } from "../lib/auth";
import { getStore } from "../lib/storeFactory";

export async function markReviewed(
  request: HttpRequest,
  _context: InvocationContext,
): Promise<HttpResponseInit> {
  const principal = getClientPrincipal(request);
  if (!principal) {
    return { status: 401, jsonBody: { error: "Not authenticated." } };
  }

  const id = request.params.id;
  if (!id) {
    return { status: 400, jsonBody: { error: "Missing item id." } };
  }

  const store = getStore();
  const existing = await store.getItem(id);
  if (!existing) {
    return { status: 404, jsonBody: { error: "Item not found." } };
  }

  // A PS can only mark their own items reviewed; admins can mark any.
  if (existing.psEmail !== principal.userDetails && !isAdmin(principal)) {
    return { status: 403, jsonBody: { error: "Not your item to review." } };
  }

  const updated = await store.markReviewed(id, principal.userDetails);
  return { status: 200, jsonBody: updated };
}

app.http("markReviewed", {
  methods: ["PATCH"],
  authLevel: "anonymous",
  route: "items/{id}",
  handler: markReviewed,
});
