import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  Activity,
  Bell,
  FileEdit,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Shield,
  UserCircle,
  UserPlus,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";
import { useAppStore } from "../data/store";
import { SquadLogoPlaceholder } from "./SquadLogoPlaceholder";

const navItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "My Profile", path: "/profile", icon: UserCircle },
  { name: "Teams", path: "/teams", icon: Shield },
  { name: "Announcements", path: "/announcements", icon: Megaphone },
  { name: "Tryouts", path: "/tryouts", icon: UserPlus },
  { name: "Admin Portal", path: "/admin", icon: FileEdit },
];

export default function RootLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { members, authUser, logout, notifications } = useAppStore();
  const activePage = navItems.find((item) => item.path === location.pathname);
  const activeMembers = members.filter((member) => member.status === "Active").length;
  const commanderName = authUser?.username ?? "Commander";
  const currentMember = members.find((member) => member.username === authUser?.username) ?? members[0];

  const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <div className="flex min-h-screen bg-background text-text-white">
      <div className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-gold/15 bg-surface/95 px-4 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-2 text-gold">
          <SquadLogoPlaceholder className="h-8 w-8" />
          <span className="font-display text-base font-black uppercase tracking-wider text-white mlbb-title">
            Royal Supremacy
          </span>
        </div>
        <button
          onClick={toggleMenu}
          className="rounded-lg p-2 text-text-muted transition hover:bg-white/5 hover:text-white"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 h-screen w-64 transform overflow-y-auto border-r border-white/5 bg-surface transition-transform duration-300 lg:relative lg:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="hidden items-center gap-3 border-b border-blue-200/10 p-6 text-gold lg:flex">
          <SquadLogoPlaceholder className="h-9 w-9 shrink-0" />
          <div className="flex flex-col uppercase">
            <span className="font-display text-lg font-black leading-tight tracking-[0.18em] text-gold mlbb-title">
              Royal
            </span>
            <span className="font-display text-sm font-semibold leading-tight tracking-[0.1em] text-white/90">
              Supremacy
            </span>
          </div>
        </div>

        <nav className="mt-16 space-y-1 p-4 lg:mt-0">
          <div className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-text-muted/60">
            MVP Command
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "border-gold/30 bg-gold/10 text-gold shadow-[0_0_18px_rgba(242,196,83,0.1)]"
                    : "border-transparent text-text-muted hover:border-blue-200/10 hover:bg-surface-hover hover:text-white",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    isActive ? "text-gold" : "opacity-70 group-hover:opacity-100",
                  )}
                />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        <div className="absolute bottom-8 left-4 right-4 rounded-lg border border-gold/15 bg-background/70 p-4">
          <div className="mb-2 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-success" />
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
              Signed In
            </span>
          </div>
          <div className="truncate text-xs font-semibold text-white">{commanderName}</div>
          <button
            type="button"
            onClick={logout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-text-muted transition hover:border-gold/25 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="min-h-screen w-full flex-1 pt-16 lg:pt-0">
        <div className="sticky top-0 z-30 hidden border-b border-gold/15 bg-background/88 backdrop-blur-xl lg:block">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-8 py-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gold">
                Royal Supremacy MVP
              </p>
              <h2 className="font-display text-2xl font-black uppercase text-white mlbb-title">
                {activePage?.name || "Command Center"}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="min-w-32 rounded-lg border border-blue-200/10 bg-surface/80 px-4 py-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
                  <Activity size={13} className="text-success" />
                  Members
                </div>
                <div className="text-lg font-black text-white">
                  {activeMembers}/{members.length}
                </div>
              </div>
              <div className="min-w-36 rounded-lg border border-blue-200/10 bg-surface/80 px-4 py-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
                  <Shield size={13} className="text-gold" />
                  Team
                </div>
                <div className="truncate text-sm font-black text-white">
                  {currentMember?.team ?? "Unassigned"}
                </div>
              </div>
              <div className="min-w-32 rounded-lg border border-blue-200/10 bg-surface/80 px-4 py-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
                  <Bell size={13} className="text-gold" />
                  Alerts
                </div>
                <div className="text-lg font-black text-white">{notifications.length}</div>
              </div>
              <button
                type="button"
                onClick={logout}
                aria-label="Sign out"
                className="flex h-[68px] items-center justify-center gap-2 rounded-lg border border-gold/20 bg-gold/10 px-4 text-[10px] font-black uppercase tracking-wider text-gold transition hover:border-gold/45 hover:bg-gold/15"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
