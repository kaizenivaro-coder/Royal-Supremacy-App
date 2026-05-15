import { FormEvent, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Crown,
  KeyRound,
  LogIn,
  Mail,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { Button, Input, Label } from "../components/ui";
import { useAppStore } from "../data/store";
import { cn } from "../lib/utils";

type AuthMode = "login" | "signup";

interface AuthLocationState {
  from?: {
    pathname?: string;
    search?: string;
  };
}

const splashImage = "/auth/royal-login-splash.jpg";

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = isSignup
      ? await signup(identifier, password)
      : await login(identifier, password);

    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error ?? "Authentication failed.");
      return;
    }

    navigate(redirectPath, { replace: true });
  };

  return (
    <div className="min-h-screen overflow-hidden bg-background text-text-white">
      <main className="relative min-h-screen px-4 py-6 sm:px-8 lg:px-10">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(242,196,83,0.14),transparent_32%),radial-gradient(circle_at_84%_30%,rgba(95,183,255,0.16),transparent_28%)]" />
        <div className="relative mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl min-w-0 grid-cols-1 items-center gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="order-2 hidden min-h-[520px] overflow-hidden border border-gold/25 bg-surface/80 shadow-2xl shadow-black/40 lg:block">
            <div className="relative h-full min-h-[520px]">
              <img
                src={splashImage}
                alt="Mobile Legends Chou splash art"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-transparent to-background/80" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
              <div className="relative z-10 flex h-full flex-col justify-end p-8">
                <div className="max-w-sm border-l-2 border-gold pl-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.34em] text-gold">
                    Land of Dawn Access
                  </p>
                  <h1 className="mt-3 font-display text-4xl font-black uppercase leading-tight text-white mlbb-title">
                    Enter the Royal Command
                  </h1>
                  <p className="mt-3 text-sm font-medium leading-6 text-text-muted">
                    Honor, precision, and tournament focus for every Royal Supremacy commander.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="order-1 flex w-full min-w-0 items-center justify-center lg:order-2">
            <div
              className="battle-panel min-w-0 overflow-hidden px-5 py-7 sm:px-8 sm:py-9"
              style={{ width: "calc(100vw - 2rem)", maxWidth: "460px" }}
            >
              <div className="relative z-10">
                <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center border border-gold/50 bg-background/75 text-gold shadow-[0_0_28px_rgba(242,196,83,0.22)]">
                  <Crown className="h-9 w-9" />
                </div>

                <div className="mb-7 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.42em] text-gold">
                    Royal Supremacy
                  </p>
                  <h2 className="mt-2 font-display text-3xl font-black uppercase text-white mlbb-title sm:text-4xl">
                    {isSignup ? "Create Account" : "Squad Login"}
                  </h2>
                </div>

                <div className="mb-6 grid min-w-0 grid-cols-2 border border-blue-200/15 bg-background/65 p-1">
                  <button
                    type="button"
                    aria-pressed={mode === "login"}
                    onClick={() => switchMode("login")}
                    className={cn(
                      "flex h-11 min-w-0 items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition",
                      mode === "login"
                        ? "bg-gradient-to-r from-purple-royal to-[#1e8bf5] text-white shadow-lg shadow-purple-royal/25"
                        : "text-text-muted hover:text-white",
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
                      "flex h-11 min-w-0 items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition",
                      mode === "signup"
                        ? "bg-gradient-to-r from-gold-muted to-gold text-background shadow-lg shadow-gold/20"
                        : "text-text-muted hover:text-white",
                    )}
                  >
                    <UserPlus className="h-4 w-4" />
                    Sign Up
                  </button>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit} data-testid="auth-form">
                  <div>
                    <Label htmlFor="identifier">Email or Username</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/75" />
                      <Input
                        id="identifier"
                        value={identifier}
                        onChange={(event) => setIdentifier(event.target.value)}
                        placeholder="kingchoou or you@example.com"
                        autoComplete="username"
                        className="h-[52px] pl-11"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/75" />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Squad password"
                        autoComplete={isSignup ? "new-password" : "current-password"}
                        className="h-[52px] pl-11"
                      />
                    </div>
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger"
                    >
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant={isSignup ? "gold" : "primary"}
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full gap-2"
                  >
                    {isSignup ? (
                      <UserPlus className="h-5 w-5" />
                    ) : (
                      <ShieldCheck className="h-5 w-5" />
                    )}
                    {isSubmitting
                      ? "Processing"
                      : isSignup
                        ? "Create Account"
                        : "Enter Command"}
                  </Button>
                </form>

                <div className="mt-7 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-text-muted">
                  <Sparkles className="h-3.5 w-3.5 text-gold" />
                  Honor. Order. Victory.
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
