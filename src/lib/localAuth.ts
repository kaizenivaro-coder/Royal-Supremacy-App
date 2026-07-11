export interface LocalAuthAccount {
  id: string;
  username: string;
  email?: string;
  passwordHash: string;
  createdAt: string;
}

export interface PendingAccountRequest {
  id: string;
  username: string;
  passwordHash: string;
  requestedAt: string;
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

interface PendingRequestSuccess {
  request: PendingAccountRequest;
  requests: PendingAccountRequest[];
  error?: undefined;
}

interface PendingRequestFailure {
  request?: undefined;
  requests?: undefined;
  error: string;
}

export type PendingAccountRequestResult = PendingRequestSuccess | PendingRequestFailure;

interface ApprovePendingRequestSuccess {
  account: LocalAuthAccount;
  accounts: LocalAuthAccount[];
  requests: PendingAccountRequest[];
  error?: undefined;
}

interface PendingRequestActionFailure {
  account?: undefined;
  accounts?: undefined;
  requests?: undefined;
  error: string;
}

export type ApprovePendingAccountRequestResult =
  | ApprovePendingRequestSuccess
  | PendingRequestActionFailure;

interface RejectPendingRequestSuccess {
  requests: PendingAccountRequest[];
  error?: undefined;
}

export type RejectPendingAccountRequestResult =
  | RejectPendingRequestSuccess
  | PendingRequestActionFailure;

export interface CreateAccountOptions {
  id?: string;
  now?: Date;
}

interface EnsureAuthSuccess extends AuthSuccess {
  didCreate: boolean;
}

interface EnsureAuthFailure extends AuthFailure {
  didCreate?: undefined;
}

export type EnsureLocalAuthResult = EnsureAuthSuccess | EnsureAuthFailure;

export function normalizeIdentifier(identifier: string) {
  return identifier.trim().toLowerCase();
}

export function normalizeUsername(username: string) {
  return normalizeIdentifier(username);
}

function isEmailIdentifier(identifier: string) {
  return identifier.includes("@");
}

function isValidEmail(identifier: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
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

function findPendingRequestByIdentifier(
  requests: PendingAccountRequest[],
  identifier: string,
) {
  const normalized = normalizeIdentifier(identifier);
  return requests.find((request) => request.username === normalized);
}

function toAuthUser(account: LocalAuthAccount): AuthUser {
  return {
    id: account.id,
    username: account.username,
    email: account.email,
  };
}

function isValidUsername(username: string) {
  return /^[a-z0-9_]{3,20}$/.test(username);
}

function validateUsernameForSignup(identifier: string) {
  const normalizedIdentifier = normalizeIdentifier(identifier);

  if (!normalizedIdentifier) {
    return "Enter a username.";
  }

  if (isEmailIdentifier(normalizedIdentifier)) {
    return "Use a username to create an account. You can add email in your profile.";
  }

  if (!isValidUsername(normalizedIdentifier)) {
    return "Usernames must be 3-20 characters using lowercase letters, numbers, or underscores.";
  }

  return undefined;
}

function validateLoginIdentifier(identifier: string) {
  const normalizedIdentifier = normalizeIdentifier(identifier);

  if (!normalizedIdentifier) {
    return "Enter an email or username.";
  }

  if (isEmailIdentifier(normalizedIdentifier) && !isValidEmail(normalizedIdentifier)) {
    return "Use a valid email or username.";
  }

  return undefined;
}

function validatePassword(password: string) {
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
  const validationError = validateUsernameForSignup(identifier) ?? validatePassword(password);
  if (validationError) {
    return { error: validationError };
  }

  if (findAccountByIdentifier(accounts, identifier)) {
    return { error: "That email or username is already in use." };
  }

  const normalized = normalizeIdentifier(identifier);
  const id = options.id ?? createAccountId();
  const account: LocalAuthAccount = {
    id,
    username: normalized,
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

export async function createPendingAccountRequest(
  requests: PendingAccountRequest[],
  accounts: LocalAuthAccount[],
  identifier: string,
  password: string,
  options: CreateAccountOptions = {},
): Promise<PendingAccountRequestResult> {
  const validationError = validateUsernameForSignup(identifier) ?? validatePassword(password);
  if (validationError) {
    return { error: validationError };
  }

  if (findAccountByIdentifier(accounts, identifier)) {
    return { error: "That email or username is already in use." };
  }

  if (findPendingRequestByIdentifier(requests, identifier)) {
    return { error: "That account request is already waiting for Admin Portal review." };
  }

  const normalized = normalizeIdentifier(identifier);
  const id = options.id ?? createAccountId();
  const request: PendingAccountRequest = {
    id,
    username: normalized,
    passwordHash: await hashPassword(id, password),
    requestedAt: (options.now ?? new Date()).toISOString(),
  };

  return {
    request,
    requests: [request, ...requests],
  };
}

export function approvePendingAccountRequest(
  requests: PendingAccountRequest[],
  accounts: LocalAuthAccount[],
  requestId: string,
  isAdmin: boolean,
): ApprovePendingAccountRequestResult {
  if (!isAdmin) {
    return { error: "Only Admin Portal users can approve account requests." };
  }

  const request = requests.find((item) => item.id === requestId);
  if (!request) {
    return { error: "Account request not found." };
  }

  if (findAccountByIdentifier(accounts, request.username)) {
    return { error: "That account already exists." };
  }

  const account: LocalAuthAccount = {
    id: request.id,
    username: request.username,
    passwordHash: request.passwordHash,
    createdAt: new Date().toISOString(),
  };

  return {
    account,
    accounts: [...accounts, account],
    requests: requests.filter((item) => item.id !== requestId),
  };
}

export function rejectPendingAccountRequest(
  requests: PendingAccountRequest[],
  requestId: string,
  isAdmin: boolean,
): RejectPendingAccountRequestResult {
  if (!isAdmin) {
    return { error: "Only Admin Portal users can reject account requests." };
  }

  if (!requests.some((request) => request.id === requestId)) {
    return { error: "Account request not found." };
  }

  return {
    requests: requests.filter((request) => request.id !== requestId),
  };
}

export async function ensureLocalAccount(
  accounts: LocalAuthAccount[],
  identifier: string,
  password: string,
  options: CreateAccountOptions = {},
): Promise<EnsureLocalAuthResult> {
  const existingAccount = findAccountByIdentifier(accounts, identifier);
  if (existingAccount) {
    return {
      account: existingAccount,
      accounts,
      user: toAuthUser(existingAccount),
      didCreate: false,
    };
  }

  const result = await createLocalAccount(accounts, identifier, password, options);
  if (result.error) {
    return { error: result.error };
  }

  return {
    account: result.account,
    accounts: result.accounts,
    user: result.user,
    didCreate: true,
  };
}

export async function verifyLocalCredentials(
  accounts: LocalAuthAccount[],
  identifier: string,
  password: string,
): Promise<LocalAuthResult> {
  const validationError = validateLoginIdentifier(identifier) ?? validatePassword(password);
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

export function connectAccountEmail(
  accounts: LocalAuthAccount[],
  accountId: string,
  email: string,
): LocalAuthResult {
  const normalizedEmail = normalizeIdentifier(email);

  if (!normalizedEmail) {
    return { error: "Enter an email address." };
  }

  if (!isValidEmail(normalizedEmail)) {
    return { error: "Enter a valid email address." };
  }

  const account = accounts.find((item) => item.id === accountId);
  if (!account) {
    return { error: "No signed-in account found." };
  }

  const emailOwner = accounts.find(
    (item) => item.id !== accountId && item.email === normalizedEmail,
  );
  if (emailOwner) {
    return { error: "That email is already connected to another account." };
  }

  const updatedAccount = { ...account, email: normalizedEmail };
  const nextAccounts = accounts.map((item) =>
    item.id === accountId ? updatedAccount : item,
  );

  return {
    account: updatedAccount,
    accounts: nextAccounts,
    user: toAuthUser(updatedAccount),
  };
}

export async function changeAccountPassword(
  accounts: LocalAuthAccount[],
  accountId: string,
  password: string,
): Promise<LocalAuthResult> {
  const validationError = validatePassword(password);
  if (validationError) {
    return { error: validationError };
  }

  const account = accounts.find((item) => item.id === accountId);
  if (!account) {
    return { error: "No signed-in account found." };
  }

  const updatedAccount = {
    ...account,
    passwordHash: await hashPassword(account.id, password),
  };
  const nextAccounts = accounts.map((item) =>
    item.id === accountId ? updatedAccount : item,
  );

  return {
    account: updatedAccount,
    accounts: nextAccounts,
    user: toAuthUser(updatedAccount),
  };
}
