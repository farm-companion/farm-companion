import { test } from "node:test";
import assert from "node:assert/strict";
import { buildAyrsharePayload, postLimit, publishPost, PostTooLongError } from "./ayrshare.js";

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

test("the strictest platform in the list sets the limit", () => {
  assert.equal(postLimit(["twitter", "facebook"]), 280);
  assert.equal(postLimit(["facebook"]), 63206);
  assert.equal(postLimit(["TWITTER"]), 280, "platform names are matched case-insensitively");
  assert.equal(postLimit(["something-ayrshare-added"]), Number.POSITIVE_INFINITY);
  assert.equal(postLimit([]), Number.POSITIVE_INFINITY);
});

test("a caption past the strictest limit is refused before it reaches Ayrshare", async () => {
  // max_tokens is 1024, so a verbose model answer runs to thousands of
  // characters. X takes 280. Caught here rather than as an opaque 400.
  process.env.SOCIAL_PLATFORMS = "twitter,facebook";
  await assert.rejects(
    () => publishPost({ caption: "a".repeat(281) }),
    PostTooLongError,
  );
});

test("a caption inside the limit still goes through", async () => {
  process.env.SOCIAL_PLATFORMS = "twitter";
  delete process.env.SOCIAL_PUBLISH;
  const payload = await publishPost({ caption: "a".repeat(280) });
  assert.equal(payload.post.length, 280);
});
