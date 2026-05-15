import assert from "node:assert/strict";
import test from "node:test";
import {
  connectAccountEmail,
  createLocalAccount,
  normalizeIdentifier,
  normalizeUsername,
  verifyLocalCredentials,
} from "./localAuth.ts";

test("normalizeIdentifier trims and lowercases usernames or emails", () => {
  assert.equal(normalizeIdentifier("  KING@Example.COM  "), "king@example.com");
  assert.equal(normalizeIdentifier("  RoyalKnight  "), "royalknight");
});

test("normalizeUsername stores one lowercase username shape", () => {
  assert.equal(normalizeUsername("  KingChoou  "), "kingchoou");
  assert.equal(normalizeUsername("Royal_Knight7"), "royal_knight7");
});

test("createLocalAccount signs users up with a normalized username only", async () => {
  const usernameSignup = await createLocalAccount([], "KingChoou", "dash");
  assert.equal(usernameSignup.error, undefined);
  assert.equal(usernameSignup.user?.email, undefined);
  assert.equal(usernameSignup.user?.username, "kingchoou");
});

test("createLocalAccount rejects emails and confusing username formats on signup", async () => {
  const emailSignup = await createLocalAccount([], "royal@example.com", "blade");
  const spacedUsername = await createLocalAccount([], "King Choou", "blade");
  const shortUsername = await createLocalAccount([], "kc", "blade");

  assert.equal(
    emailSignup.error,
    "Use a username to create an account. You can add email in your profile.",
  );
  assert.equal(
    spacedUsername.error,
    "Usernames must be 3-20 characters using lowercase letters, numbers, or underscores.",
  );
  assert.equal(
    shortUsername.error,
    "Usernames must be 3-20 characters using lowercase letters, numbers, or underscores.",
  );
});

test("verifyLocalCredentials accepts the stored email or username with the same password", async () => {
  const signup = await createLocalAccount([], "captain", "shield");
  assert.ok(signup.accounts);
  const emailConnection = connectAccountEmail(
    signup.accounts,
    signup.user.id,
    "captain@example.com",
  );
  assert.ok(emailConnection.accounts);

  const emailLogin = await verifyLocalCredentials(
    emailConnection.accounts,
    "CAPTAIN@example.com",
    "shield",
  );
  const usernameLogin = await verifyLocalCredentials(
    emailConnection.accounts,
    "CAPTAIN",
    "shield",
  );

  assert.equal(emailLogin.user?.id, signup.user?.id);
  assert.equal(usernameLogin.user?.id, signup.user?.id);
});

test("createLocalAccount blocks duplicate email or username identifiers", async () => {
  const signup = await createLocalAccount([], "royal", "first");
  assert.ok(signup.accounts);
  const withEmail = connectAccountEmail(
    signup.accounts,
    signup.user.id,
    "royal@example.com",
  );
  assert.ok(withEmail.accounts);

  const duplicateUsername = await createLocalAccount(
    withEmail.accounts,
    "ROYAL",
    "second",
  );
  const anotherSignup = await createLocalAccount(withEmail.accounts, "valor", "second");
  assert.ok(anotherSignup.accounts);
  const duplicateEmail = connectAccountEmail(
    anotherSignup.accounts,
    anotherSignup.user.id,
    "ROYAL@example.com",
  );

  assert.equal(duplicateEmail.error, "That email is already connected to another account.");
  assert.equal(duplicateUsername.error, "That email or username is already in use.");
});

test("connectAccountEmail adds a valid email to the signed-in account", async () => {
  const signup = await createLocalAccount([], "sentinel", "correct");
  assert.ok(signup.accounts);

  const connection = connectAccountEmail(
    signup.accounts,
    signup.user.id,
    " Sentinel@Example.COM ",
  );

  assert.equal(connection.error, undefined);
  assert.equal(connection.user?.email, "sentinel@example.com");
  assert.equal(connection.accounts?.[0]?.email, "sentinel@example.com");
});

test("verifyLocalCredentials rejects the wrong password", async () => {
  const signup = await createLocalAccount([], "sentinel", "correct");
  assert.ok(signup.accounts);

  const login = await verifyLocalCredentials(signup.accounts, "sentinel", "wrong");

  assert.equal(login.error, "Password does not match.");
  assert.equal(login.user, undefined);
});
