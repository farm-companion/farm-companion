import { test } from "node:test";
import assert from "node:assert/strict";
import { buildAyrsharePayload } from "./ayrshare.js";

test("caption and hashtags are joined, with the image attached", () => {
  const payload = buildAyrsharePayload(
    { caption: "Cliff-top farm shop above Boscastle harbour.", hashtags: ["#farmshop", "#Cornwall"] },
    ["twitter", "facebook"],
    "https://e.com/og?farmName=X",
  );
  assert.equal(payload.post, "Cliff-top farm shop above Boscastle harbour.\n\n#farmshop #Cornwall");
  assert.deepEqual(payload.platforms, ["twitter", "facebook"]);
  assert.deepEqual(payload.mediaUrls, ["https://e.com/og?farmName=X"]);
});

test("no hashtags means no trailing blank lines", () => {
  const payload = buildAyrsharePayload({ caption: "Just the caption." }, ["twitter"]);
  assert.equal(payload.post, "Just the caption.");
  assert.equal(payload.post.endsWith("\n"), false);
});

test("mediaUrls is omitted entirely when there is no image", () => {
  const payload = buildAyrsharePayload({ caption: "Text only." }, ["twitter"]);
  assert.equal("mediaUrls" in payload, false);
});

test("an empty caption produces an empty post, which publishPost refuses", () => {
  assert.equal(buildAyrsharePayload({ caption: "   " }, ["twitter"]).post, "");
});
