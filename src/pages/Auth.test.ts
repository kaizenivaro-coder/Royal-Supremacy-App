import assert from "node:assert/strict";
import test from "node:test";
import {
  canClearLocalAccountsOnHost,
  clearLocalAuthStorage,
  getAuthCredentialFieldPolicy,
  getAuthSubmitLabel,
} from "./Auth.tsx";

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

test("auth submit label stays plain for login and signup", () => {
  assert.equal(getAuthSubmitLabel(false), "Login");
  assert.equal(getAuthSubmitLabel(true), "Sign Up");
});

test("local account cleanup is limited to local development hosts", () => {
  assert.equal(canClearLocalAccountsOnHost("127.0.0.1"), true);
  assert.equal(canClearLocalAccountsOnHost("localhost"), true);
  assert.equal(canClearLocalAccountsOnHost("royal-supremacy-app.kaizenivaro.chatgpt.site"), false);
});

test("local account cleanup clears stored auth and disables local seed", () => {
  const values = new Map<string, string>([
    ["royal_supremacy_auth_accounts", "[{}]"],
    ["royal_supremacy_auth_session", "{}"],
    ["royal_supremacy_pendingAccountRequests", "[{}]"],
    ["royal_supremacy_isAdmin", "true"],
  ]);
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };

  clearLocalAuthStorage(storage);

  assert.equal(values.get("royal_supremacy_disable_seed_accounts"), "true");
  assert.equal(values.get("royal_supremacy_auth_accounts"), "[]");
  assert.equal(values.get("royal_supremacy_pendingAccountRequests"), "[]");
  assert.equal(values.has("royal_supremacy_auth_session"), false);
  assert.equal(values.has("royal_supremacy_isAdmin"), false);
});
