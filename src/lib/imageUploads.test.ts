import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_LOCAL_IMAGE_BYTES,
  validateLocalImageUpload,
} from "./imageUploads.ts";

test("validateLocalImageUpload accepts common image files within the local MVP size limit", () => {
  assert.equal(
    validateLocalImageUpload({ type: "image/png", size: MAX_LOCAL_IMAGE_BYTES }),
    undefined,
  );
  assert.equal(
    validateLocalImageUpload({ type: "image/jpeg", size: 120_000 }),
    undefined,
  );
  assert.equal(
    validateLocalImageUpload({ type: "image/webp", size: 120_000 }),
    undefined,
  );
});

test("validateLocalImageUpload rejects non-image files and oversized images", () => {
  assert.equal(
    validateLocalImageUpload({ type: "application/pdf", size: 120_000 }),
    "Upload a PNG, JPG, WebP, or GIF image.",
  );
  assert.equal(
    validateLocalImageUpload({ type: "image/png", size: MAX_LOCAL_IMAGE_BYTES + 1 }),
    "Use an image smaller than 2 MB for this local MVP.",
  );
});
