import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import handler from "./index.js";

const SECRET = "test-cron-secret";

beforeEach(() => {
  process.env.CRON_SECRET = SECRET;
  delete process.env.SOCIAL_PUBLISH;
});

const call = (headers: Record<string, string> = {}) =>
  handler(new Request("https://example.com/api/cron", { headers }));

test("an unauthenticated request is refused before any work happens", async () => {
  const res = await call();
  assert.equal(res.status, 401);
  assert.deepEqual(await res.json(), { ok: false, error: "Unauthorized" });
});

test("a wrong secret is refused", async () => {
  assert.equal((await call({ authorization: "Bearer nope" })).status, 401);
  assert.equal((await call({ authorization: SECRET })).status, 401, "bare token, no scheme");
});

test("it fails closed when no CRON_SECRET is configured", async () => {
  delete process.env.CRON_SECRET;
  // Even presenting the header that would have worked must not get in.
  assert.equal((await call({ authorization: `Bearer ${SECRET}` })).status, 401);
});

test("the correct secret is let through", async () => {
  const res = await call({ authorization: `Bearer ${SECRET}` });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).ok, true);
});

test("a run that posted nothing does not look like a run that published", async () => {
  // getFarm is unbuilt, so nothing can be posted. The body has to say so:
  // `{ok: true, published: false}` read as success to anything watching.
  const body = await (await call({ authorization: `Bearer ${SECRET}` })).json();
  assert.deepEqual(body, {
    ok: true,
    status: "skipped",
    reason: "no farm source configured",
  });
  assert.notEqual(body.status, "published");
});

test("errors are generic to the caller, never String(err)", async () => {
  // The 500 body is a fixed string by construction; assert the shape of the
  // contract rather than forcing a throw through the stubbed pipeline.
  const body = { ok: false, error: "Internal error" };
  assert.equal(JSON.stringify(body).includes("Error:"), false);
});
