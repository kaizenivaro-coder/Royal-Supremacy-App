export interface LocalAuthAccount {
  id: string;
  username: string;
  email?: string;
  passwordHash: string;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
}

interface AuthSuccess {
  account: LocalAuthAccount;
  accounts: LocalAuthAccount[];
  user: AuthUser;
  error?: undefined;
}

interface AuthFailure {
  account?: undefined;
  accounts?: undefined;
  user?: undefined;
  error: string;
}

export type LocalAuthResult = AuthSuccess | AuthFailure;

interface CreateAccountOptions {
  id?: string;
  now?: Date;
}

export function normalizeIdentifier(identifier: string) {
  return identifier.trim().toLowerCase();
}

function isEmailIdentifier(identifier: string) {
  return identifier.includes("@");
}

function isValidEmail(identifier: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
}

function usernameFromEmail(email: string) {
  return email.split("@")[0] || email;
}

function getAccountIdentifiers(account: LocalAuthAccount) {
  const identifiers = [account.username];
  if (account.email) identifiers.push(account.email);
  return identifiers.map(normalizeIdentifier);
}

function findAccountByIdentifier(
  accounts: LocalAuthAccount[],
  identifier: string,
) {
  const normalized = normalizeIdentifier(identifier);
  return accounts.find((account) =>
    getAccountIdentifiers(account).includes(normalized),
  );
}

function toAuthUser(account: LocalAuthAccount): AuthUser {
  return {
    id: account.id,
    username: account.username,
    email: account.email,
  };
}

function validateCredentials(identifier: string, password: string) {
  const normalizedIdentifier = normalizeIdentifier(identifier);

  if (!normalizedIdentifier) {
    return "Enter an email or username.";
  }

  if (isEmailIdentifier(normalizedIdentifier) && !isValidEmail(normalizedIdentifier)) {
    return "Use a valid email or username.";
  }

  if (password.length < 4) {
    return "Password must be at least 4 characters.";
  }

  return undefined;
}

function createAccountId() {
  return globalThis.crypto?.randomUUID?.() ?? `local_${Date.now()}`;
}

function legacyHash(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return `legacy:${(hash >>> 0).toString(16)}`;
}

async function hashPassword(accountId: string, password: string) {
  const input = `${accountId}:${password}`;
  const subtle = globalThis.crypto?.subtle;

  if (!subtle) {
    return legacyHash(input);
  }

  const digest = await subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function createLocalAccount(
  accounts: LocalAuthAccount[],
  identifier: string,
  password: string,
  options: CreateAccountOptions = {},
): Promise<LocalAuthResult> {
  const validationError = validateCredentials(identifier, password);
  if (validationError) {
    return { error: validationError };
  }

  if (findAccountByIdentifier(accounts, identifier)) {
    return { error: "That email or username is already in use." };
  }

  const normalized = normalizeIdentifier(identifier);
  const email = isEmailIdentifier(normalized) ? normalized : undefined;
  const username = email ? usernameFromEmail(email) : identifier.trim();
  const id = options.id ?? createAccountId();
  const account: LocalAuthAccount = {
    id,
    username,
    email,
    passwordHash: await hashPassword(id, password),
    createdAt: (options.now ?? new Date()).toISOString(),
  };
  const nextAccounts = [...accounts, account];

  return {
    account,
    accounts: nextAccounts,
    user: toAuthUser(account),
  };
}

export async function verifyLocalCredentials(
  accounts: LocalAuthAccount[],
  identifier: string,
  password: string,
): Promise<LocalAuthResult> {
  const validationError = validateCredentials(identifier, password);
  if (validationError) {
    return { error: validationError };
  }

  const account = findAccountByIdentifier(accounts, identifier);
  if (!account) {
    return { error: "No Royal Supremacy account found." };
  }

  const passwordHash = await hashPassword(account.id, password);
  if (passwordHash !== account.passwordHash) {
    return { error: "Password does not match." };
  }

  return {
    account,
    accounts,
    user: toAuthUser(account),
  };
}
