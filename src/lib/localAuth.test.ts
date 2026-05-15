import assert from "node:assert/strict";
import test from "node:test";
import {
  createLocalAccount,
  normalizeIdentifier,
  verifyLocalCredentials,
} from "./localAuth.ts";

test("normalizeIdentifier trims and lowercases usernames or emails", () => {
  assert.equal(normalizeIdentifier("  KING@Example.COM  "), "king@example.com");
  assert.equal(normalizeIdentifier("  RoyalKnight  "), "royalknight");
});

test("createLocalAccount lets signup use either email or username only", async () => {
  const emailSignup = await createLocalAccount([], "Royal.Commander@example.com", "blade");
  assert.equal(emailSignup.error, undefined);
  assert.equal(emailSignup.user?.email, "royal.commander@example.com");
  assert.equal(emailSignup.user?.username, "royal.commander");

  const usernameSignup = await createLocalAccount([], "KingChoou", "dash");
  assert.equal(usernameSignup.error, undefined);
  assert.equal(usernameSignup.user?.email, undefined);
  assert.equal(usernameSignup.user?.username, "KingChoou");
});

test("verifyLocalCredentials accepts the stored email or username with the same password", async () => {
  const signup = await createLocalAccount([], "captain@example.com", "shield");
  assert.ok(signup.accounts);

  const emailLogin = await verifyLocalCredentials(
    signup.accounts,
    "CAPTAIN@example.com",
    "shield",
  );
  const usernameLogin = await verifyLocalCredentials(
    signup.accounts,
    "captain",
    "shield",
  );

  assert.equal(emailLogin.user?.id, signup.user?.id);
  assert.equal(usernameLogin.user?.id, signup.user?.id);
});

test("createLocalAccount blocks duplicate email or username identifiers", async () => {
  const signup = await createLocalAccount([], "royal@example.com", "first");
  assert.ok(signup.accounts);

  const duplicateEmail = await createLocalAccount(
    signup.accounts,
    "ROYAL@example.com",
    "second",
  );
  const duplicateUsername = await createLocalAccount(
    signup.accounts,
    "royal",
    "second",
  );

  assert.equal(duplicateEmail.error, "That email or username is already in use.");
  assert.equal(duplicateUsername.error, "That email or username is already in use.");
});

test("verifyLocalCredentials rejects the wrong password", async () => {
  const signup = await createLocalAccount([], "sentinel", "correct");
  assert.ok(signup.accounts);

  const login = await verifyLocalCredentials(signup.accounts, "sentinel", "wrong");

  assert.equal(login.error, "Password does not match.");
  assert.equal(login.user, undefined);
});
