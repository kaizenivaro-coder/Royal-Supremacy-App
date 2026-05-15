import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  Crown,
  LayoutDashboard,
  Users,
  UserCircle,
  Shield,
  Calendar,
  Swords,
  TrendingUp,
  Trophy,
  Megaphone,
  UserPlus,
  FileEdit,
  Menu,
  X,
  CalendarDays,
  Activity,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";
import { useAppStore } from "../data/store";
import { getNextScheduledEvent } from "../lib/appInsights";

const navItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "My Profile", path: "/profile", icon: UserCircle },
  { name: "Members", path: "/members", icon: Users },
  { name: "Teams", path: "/teams", icon: Shield },
  { name: "Schedule", path: "/schedule", icon: Calendar },
  { name: "Matches", path: "/matches", icon: Swords },
  { name: "Royal Points", path: "/points", icon: TrendingUp },
  { name: "Leaderboard", path: "/leaderboard", icon: Trophy },
  { name: "Announcements", path: "/announcements", icon: Megaphone },
  { name: "Tryouts", path: "/tryouts", icon: UserPlus },
  { name: "Admin", path: "/admin", icon: FileEdit, adminOnly: true },
];

export default function RootLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAdmin, members, matches, schedule, authUser, logout } = useAppStore();
  const activePage = navItems.find((item) => item.path === location.pathname);
  const activeMembers = members.filter((member) => member.status === "Active").length;
  const wins = matches.filter((match) => match.result === "Win").length;
  const winRate = matches.length ? Math.round((wins / matches.length) * 100) : 0;
  const nextOperation = getNextScheduledEvent(schedule);
  const commanderName = authUser?.username ?? "Commander";

  const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <div className="flex bg-background min-h-screen text-text-white">
      {/* Mobile nav header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-surface/95 backdrop-blur-md border-b border-gold/20 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2 text-gold">
          <Crown className="w-6 h-6" />
          <span className="font-display font-bold text-lg tracking-wider mlbb-title">
            ROYAL SUPREMACY
          </span>
        </div>
        <button
          onClick={toggleMenu}
          className="p-2 text-text-muted hover:text-white transition"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Sidebar background overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-white/5 transform transition-transform duration-300 lg:relative lg:translate-x-0 h-screen overflow-y-auto",
          "lg:bg-[#081225]/95 lg:border-r-gold/15",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="p-6 hidden lg:flex items-center gap-3 text-gold border-b border-blue-200/10">
          <Crown className="w-8 h-8 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
          <div className="flex flex-col uppercase">
            <span className="font-display font-bold text-lg leading-tight tracking-[0.2em] text-gold mlbb-title">
              ROYAL
            </span>
            <span className="font-display font-semibold text-sm leading-tight tracking-[0.1em] text-white/90">
              SUPREMACY
            </span>
          </div>
        </div>

        <nav className="p-4 space-y-1 mt-16 lg:mt-0">
          <div className="text-xs font-semibold text-text-muted/60 uppercase tracking-wider mb-4 px-3">
            Land of Dawn Ops
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isRestricted = item.adminOnly && !isAdmin;

            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-gradient-to-r from-purple-royal/30 to-gold/10 text-gold border border-gold/30 shadow-[0_0_18px_rgba(95,183,255,0.12)]"
                    : "text-text-muted hover:bg-surface-hover hover:text-white hover:border-blue-200/10 border border-transparent",
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "w-5 h-5",
                      isActive
                        ? "text-gold"
                        : "opacity-70 group-hover:opacity-100",
                    )}
                  />
                  {item.name}
                </div>
                {isRestricted && <Shield className="w-3.5 h-3.5 opacity-40" />}
              </NavLink>
            );
          })}
        </nav>

        <div className="absolute bottom-8 left-4 right-4 p-4 bg-background/70 border border-gold/15">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-text-muted">
              Signed In
            </span>
          </div>
          <div className="truncate text-xs font-semibold text-white">
            {commanderName}
          </div>
          <button
            type="button"
            onClick={logout}
            className="mt-3 flex w-full items-center justify-center gap-2 border border-blue-200/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-text-muted transition hover:border-gold/25 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full min-h-screen pt-16 lg:pt-0">
        <div className="hidden lg:block border-b border-gold/15 bg-background/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between gap-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gold">
                Land of Dawn Command
              </p>
              <h2 className="font-display text-2xl font-black uppercase text-white mlbb-title">
                {activePage?.name || "Command Center"}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-3 bg-surface/80 border border-blue-200/10 min-w-32">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
                  <Activity size={13} className="text-success" />
                  Active
                </div>
                <div className="text-lg font-black text-white">
                  {activeMembers}/{members.length}
                </div>
              </div>
              <div className="px-4 py-3 bg-surface/80 border border-blue-200/10 min-w-32">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
                  <Trophy size={13} className="text-gold" />
                  Win Rate
                </div>
                <div className="text-lg font-black text-white">{winRate}%</div>
              </div>
              <div className="px-4 py-3 bg-surface/80 border border-blue-200/10 min-w-44">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
                  <CalendarDays size={13} className="text-purple-light" />
                  Next
                </div>
                <div className="text-sm font-black text-white truncate max-w-40">
                  {nextOperation ? nextOperation.title : "Standby"}
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                aria-label="Sign out"
                className="flex h-[68px] items-center justify-center gap-2 border border-gold/20 bg-gold/10 px-4 text-[10px] font-black uppercase tracking-wider text-gold transition hover:border-gold/45 hover:bg-gold/15"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
