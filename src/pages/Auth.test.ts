import assert from "node:assert/strict";
import test from "node:test";
import { getAuthCredentialFieldPolicy } from "./Auth.tsx";

test("auth login fields do not invite shared-browser credential autofill", () => {
  const policy = getAuthCredentialFieldPolicy(false);

  assert.equal(policy.form.autoComplete, "off");
  assert.equal(policy.identifier.autoComplete, "off");
  assert.equal(policy.identifier.name, "royal-login-handle");
  assert.equal(policy.password.autoComplete, "new-password");
  assert.equal(policy.password.name, "royal-login-passphrase");
  assert.equal(policy.password["data-lpignore"], "true");
  assert.equal(policy.password["data-1p-ignore"], "true");
});

test("auth signup fields also avoid credential reuse from login managers", () => {
  const policy = getAuthCredentialFieldPolicy(true);

  assert.equal(policy.identifier.name, "royal-signup-handle");
  assert.equal(policy.password.name, "royal-signup-passphrase");
  assert.equal(policy.identifier.autoComplete, "off");
  assert.equal(policy.password.autoComplete, "new-password");
});
