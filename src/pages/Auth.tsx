import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  KeyRound,
  LogIn,
  Mail,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { Input, Label } from "../components/ui";
import { useAppStore } from "../data/store";
import { normalizeUsername } from "../lib/localAuth";
import { publicAsset } from "../lib/publicAssets";
import { cn } from "../lib/utils";

type AuthMode = "login" | "signup";

interface SignupRequestReceipt {
  identifier: string;
  password: string;
}

interface AuthLocationState {
  from?: {
    pathname?: string;
    search?: string;
  };
}

const splashImage = publicAsset("auth/royal-login-splash.jpg");
const desktopAuthImage = publicAsset("auth/royal-auth-desktop-fullbleed.png");
const mobileAuthImage = publicAsset("auth/royal-auth-mobile-fullbleed.png");

export function getAuthCredentialFieldPolicy(isSignup: boolean) {
  return {
    form: {
      autoComplete: "off",
    },
    identifier: {
      id: isSignup ? "royal-signup-handle" : "royal-login-handle",
      name: isSignup ? "royal-signup-handle" : "royal-login-handle",
      autoComplete: "off",
      "data-lpignore": "true",
      "data-1p-ignore": "true",
    },
    password: {
      id: isSignup ? "royal-signup-passphrase" : "royal-login-passphrase",
      name: isSignup ? "royal-signup-passphrase" : "royal-login-passphrase",
      autoComplete: "new-password",
      "data-lpignore": "true",
      "data-1p-ignore": "true",
    },
  } as const;
}

export function getAuthSubmitLabel(isSignup: boolean) {
  return isSignup ? "Sign Up" : "Login";
}

type LocalAuthStorage = Pick<Storage, "setItem" | "removeItem">;

export function canClearLocalAccountsOnHost(hostname: string) {
  return ["127.0.0.1", "localhost", "::1", "[::1]"].includes(hostname);
}

export function clearLocalAuthStorage(storage: LocalAuthStorage) {
  storage.setItem("royal_supremacy_disable_seed_accounts", "true");
  storage.setItem("royal_supremacy_auth_accounts", "[]");
  storage.setItem("royal_supremacy_pendingAccountRequests", "[]");
  storage.removeItem("royal_supremacy_auth_session");
  storage.removeItem("royal_supremacy_isAdmin");
}

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [signupReceipt, setSignupReceipt] = useState<SignupRequestReceipt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, signup } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = useMemo(() => {
    const state = location.state as AuthLocationState | null;
    const from = state?.from;
    return `${from?.pathname ?? "/"}${from?.search ?? ""}`;
  }, [location.state]);
  const isSignup = mode === "signup";
  const credentialPolicy = getAuthCredentialFieldPolicy(isSignup);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("clearLocalAccounts") !== "1") return;

    if (canClearLocalAccountsOnHost(window.location.hostname)) {
      clearLocalAuthStorage(window.localStorage);
      window.location.replace("/auth");
      return;
    }

    navigate("/auth", { replace: true });
  }, [location.search, navigate]);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError("");
    setSignupReceipt(null);
    setIdentifier("");
    setPassword("");
  };

  const handleIdentifierChange = (value: string) => {
    setIdentifier(isSignup ? normalizeUsername(value) : value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    const submittedIdentifier = identifier;
    const submittedPassword = password;

    const result = isSignup
      ? await signup(identifier, password)
      : await login(identifier, password);

    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error ?? "Authentication failed.");
      setPassword("");
      return;
    }

    if (isSignup) {
      setSignupReceipt({
        identifier: normalizeUsername(submittedIdentifier),
        password: submittedPassword,
      });
      setIdentifier("");
      setPassword("");
      return;
    }

    navigate(redirectPath, { replace: true });
  };

  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-background text-text-white">
      <picture className="absolute inset-0">
        <source media="(max-width: 767px)" srcSet={mobileAuthImage} />
        <img
          src={desktopAuthImage || splashImage}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center"
        />
      </picture>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,18,0),rgba(3,7,18,0.2)_36%,rgba(3,7,18,0.58)_64%,rgba(3,7,18,0.84)),radial-gradient(circle_at_50%_4%,rgba(95,183,255,0.16),transparent_26%)] md:bg-[linear-gradient(90deg,rgba(3,7,18,0),rgba(3,7,18,0.04)_42%,rgba(3,7,18,0.3)_70%,rgba(3,7,18,0.62)),radial-gradient(circle_at_84%_20%,rgba(95,183,255,0.16),transparent_30%)]" />

      <main className="relative z-10 flex min-h-[100svh] items-end justify-center px-4 pb-5 pt-[34svh] sm:px-8 md:items-center md:justify-end md:px-14 md:py-8">
        <section className="mx-auto flex w-full max-w-[430px] items-center justify-center md:mx-0">
          <div className="w-full rounded-lg border border-blue-200/12 bg-[#06111f]/48 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.48)] backdrop-blur-xl sm:p-7 md:bg-[#06111f]/42">
            {signupReceipt ? (
              <div className="auth-request-alert space-y-5" role="status" aria-live="polite">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-gold/35 bg-gold/10 text-gold">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-gold">
                      Request Sent
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-white">
                      Your account request has been sent to the Admin Portal for review.
                      You will be allowed in shortly after approval.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border border-blue-200/12 bg-black/18 p-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                      Username / Email
                    </p>
                    <p className="mt-1 break-all text-sm font-black text-gold">
                      {signupReceipt.identifier}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                      Password
                    </p>
                    <p className="mt-1 break-all text-sm font-black text-white">
                      {signupReceipt.password}
                    </p>
                  </div>
                </div>

                <p className="text-xs font-semibold leading-5 text-text-muted">
                  Keep these details. They are the login details you will use after an
                  admin allows this account to exist.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSignupReceipt(null);
                    setMode("login");
                    setIdentifier(signupReceipt.identifier);
                  }}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-gold/45 bg-gold text-sm font-black uppercase tracking-wider text-background shadow-[0_16px_36px_rgba(242,196,83,0.2)] transition hover:bg-[#ffd766] focus:outline-none focus:ring-2 focus:ring-gold/60 active:scale-[0.99]"
                >
                  <LogIn className="h-4 w-4" />
                  Back to Login
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6 grid min-w-0 grid-cols-2 rounded-lg border border-blue-200/12 bg-black/18 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <button
                    type="button"
                    aria-pressed={mode === "login"}
                    onClick={() => switchMode("login")}
                    className={cn(
                      "flex h-11 min-w-0 items-center justify-center gap-2 rounded-md text-xs font-black uppercase tracking-wider transition",
                      mode === "login"
                        ? "bg-gold text-background shadow-[0_0_22px_rgba(242,196,83,0.22)]"
                        : "text-text-muted hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <LogIn className="h-4 w-4" />
                    Login
                  </button>
                  <button
                    type="button"
                    aria-pressed={mode === "signup"}
                    onClick={() => switchMode("signup")}
                    className={cn(
                      "flex h-11 min-w-0 items-center justify-center gap-2 rounded-md text-xs font-black uppercase tracking-wider transition",
                      mode === "signup"
                        ? "bg-gold text-background shadow-[0_0_22px_rgba(242,196,83,0.22)]"
                        : "text-text-muted hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <UserPlus className="h-4 w-4" />
                    Sign Up
                  </button>
                </div>

                <form
                  className="space-y-5"
                  onSubmit={handleSubmit}
                  data-testid="auth-form"
                  autoComplete={credentialPolicy.form.autoComplete}
                >
                  <div>
                    <Label htmlFor={credentialPolicy.identifier.id}>
                      {isSignup ? "Username" : "Username or Email"}
                    </Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/80" />
                      <Input
                        id={credentialPolicy.identifier.id}
                        name={credentialPolicy.identifier.name}
                        value={identifier}
                        onChange={(event) => handleIdentifierChange(event.target.value)}
                        autoComplete={credentialPolicy.identifier.autoComplete}
                        data-lpignore={credentialPolicy.identifier["data-lpignore"]}
                        data-1p-ignore={credentialPolicy.identifier["data-1p-ignore"]}
                        autoCapitalize="none"
                        spellCheck={false}
                        className="h-[52px] border-blue-200/18 bg-[#0b1c32]/72 pl-11"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={credentialPolicy.password.id}>Password</Label>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/80" />
                      <Input
                        id={credentialPolicy.password.id}
                        name={credentialPolicy.password.name}
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete={credentialPolicy.password.autoComplete}
                        data-lpignore={credentialPolicy.password["data-lpignore"]}
                        data-1p-ignore={credentialPolicy.password["data-1p-ignore"]}
                        className="h-[52px] border-blue-200/18 bg-[#0b1c32]/72 pl-11"
                      />
                    </div>
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger"
                    >
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-lg border border-gold/45 bg-gold text-sm font-black uppercase tracking-wider text-background shadow-[0_16px_36px_rgba(242,196,83,0.2)] transition hover:bg-[#ffd766] focus:outline-none focus:ring-2 focus:ring-gold/60 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isSignup ? (
                      <UserPlus className="h-5 w-5" />
                    ) : (
                      <LogIn className="h-5 w-5" />
                    )}
                    {isSubmitting ? "Processing" : getAuthSubmitLabel(isSignup)}
                  </button>
                </form>
              </>
            )}

          </div>
        </section>
      </main>
    </div>
  );
}
