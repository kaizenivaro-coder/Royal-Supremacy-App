import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  Bell,
  Ellipsis,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";
import { useAppStore } from "../data/store";
import {
  getDesktopNavigation,
  getMobilePrimaryNavigation,
  getMoreNavigation,
  type NavigationItem,
} from "../config/navigation";
import { SquadLogoPlaceholder } from "./SquadLogoPlaceholder";
import { MobileSheet } from "./overlays";

type SidebarContentProps = {
  navigation: readonly NavigationItem[];
  pathname: string;
  commanderName: string;
  squadLogoSrc: string;
  onNavigate?: () => void;
  onLogout: () => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
};

function SidebarContent({
  navigation,
  pathname,
  commanderName,
  squadLogoSrc,
  onNavigate,
  onLogout,
  collapsed = false,
  onToggleCollapsed,
}: SidebarContentProps) {
  return (
    <>
      <div className={cn("hidden h-[88px] items-center border-b border-blue-200/10 text-gold lg:flex", collapsed ? "justify-center px-3" : "gap-3 px-5")}>
        <SquadLogoPlaceholder src={squadLogoSrc} className="h-9 w-9 shrink-0" />
        <div className={cn("flex flex-1 flex-col uppercase", collapsed && "hidden")}>
          <span className="font-display text-lg font-black leading-tight tracking-[0.18em] text-gold mlbb-title">
            Royal
          </span>
          <span className="font-display text-sm font-semibold leading-tight tracking-[0.1em] text-white/90">
            Supremacy
          </span>
        </div>
        {onToggleCollapsed ? <button type="button" onClick={onToggleCollapsed} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-blue-200/10 text-text-muted transition hover:border-gold/30 hover:bg-white/5 hover:text-gold">{collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button> : null}
      </div>

      <nav className={cn("mt-16 space-y-1 lg:mt-0", collapsed ? "p-2" : "p-4")}>
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onNavigate}
              title={collapsed ? item.name : undefined}
              aria-label={item.name}
              className={cn(
                "group flex items-center rounded-lg border py-2.5 text-sm font-semibold transition-all duration-200",
                collapsed ? "justify-center px-2" : "gap-3 px-3",
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
              <span className={cn(collapsed && "sr-only")}>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className={cn("absolute bottom-8 rounded-lg border border-gold/15 bg-background/70", collapsed ? "left-2 right-2 p-2" : "left-4 right-4 p-4")}>
        {collapsed ? <button type="button" onClick={onLogout} aria-label="Sign out" title="Sign out" className="grid h-10 w-full place-items-center rounded-lg text-text-muted transition hover:bg-white/5 hover:text-white"><LogOut className="h-4 w-4" /></button> : <>
        <div className="mb-2 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-success" />
          <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
            Signed In
          </span>
        </div>
        <div className="truncate text-xs font-semibold text-white">{commanderName}</div>
        <button
          type="button"
          onClick={onLogout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-text-muted transition hover:border-gold/25 hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
        </>}
      </div>
    </>
  );
}

type MobileAppBarProps = {
  currentPageTitle: string;
  moreOpen: boolean;
  onOpenMore: () => void;
  squadLogoSrc: string;
};

function MobileAppBar({
  currentPageTitle,
  moreOpen,
  onOpenMore,
  squadLogoSrc,
}: MobileAppBarProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-gold/15 bg-[#071425]/95 px-2 backdrop-blur-md lg:hidden">
      <div className="flex min-w-0 items-center gap-2 px-1">
        <SquadLogoPlaceholder src={squadLogoSrc} className="h-8 w-8 shrink-0" />
        <div className="min-w-0 leading-tight">
          <span className="block truncate text-[9px] font-black uppercase text-text-muted">
            Royal Supremacy
          </span>
          <span className="block truncate text-sm font-black text-white">
            {currentPageTitle}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center">
        <NavLink
          to="/notifications"
          aria-label="Notifications"
          className={({ isActive }) => cn(
            "grid h-11 w-11 place-items-center rounded-lg transition-colors hover:bg-white/5 hover:text-white",
            isActive ? "text-gold" : "text-text-muted",
          )}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
        </NavLink>
        <button
          type="button"
          onClick={onOpenMore}
          aria-label="Open more navigation"
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          className={cn(
            "grid h-11 w-11 place-items-center rounded-lg transition-colors hover:bg-white/5 hover:text-white",
            moreOpen ? "text-gold" : "text-text-muted",
          )}
        >
          <Ellipsis className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

function MobileBottomNavigation({
  navigation,
}: {
  navigation: readonly NavigationItem[];
}) {
  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-gold/15 bg-[#071425]/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid h-16 grid-cols-5 px-1">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              aria-label={item.name}
              className={({ isActive }) => cn(
                "relative flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 text-[10px] font-semibold transition-colors",
                isActive ? "text-gold" : "text-text-muted hover:text-white",
              )}
            >
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <span
                      aria-hidden="true"
                      className="absolute top-0 h-0.5 w-5 rounded-full bg-gold"
                    />
                  ) : null}
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="block whitespace-nowrap leading-none">{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

function MoreNavigationSheet({
  navigation,
  onClose,
  onLogout,
  open,
}: {
  navigation: readonly NavigationItem[];
  onClose: () => void;
  onLogout: () => void;
  open: boolean;
}) {
  const signOut = () => {
    onClose();
    onLogout();
  };

  return (
    <MobileSheet open={open} title="More" onClose={onClose}>
      <nav aria-label="More navigation" className="space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors",
                isActive
                  ? "bg-gold/10 text-gold"
                  : "text-text-muted hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-blue-200/10 pt-4">
        <button
          type="button"
          onClick={signOut}
          className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-text-muted transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>
    </MobileSheet>
  );
}

export default function RootLayout() {
  const [moreOpen, setMoreOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(() =>
    localStorage.getItem("royal_supremacy_sidebar_collapsed") === "true",
  );
  const location = useLocation();
  const { authUser, isAdmin, logout, squadLogoSrc } = useAppStore();
  const commanderName = authUser?.username ?? "Commander";
  const desktopNavigation = getDesktopNavigation(isAdmin);
  const mobilePrimaryNavigation = getMobilePrimaryNavigation(isAdmin);
  const moreNavigation = getMoreNavigation(isAdmin);
  const currentPageTitle = [...mobilePrimaryNavigation, ...moreNavigation].find(
    (item) => item.path === location.pathname,
  )?.name ?? "Royal Supremacy";

  const toggleDesktopSidebar = () => {
    setDesktopSidebarCollapsed((current) => {
      const next = !current;
      localStorage.setItem("royal_supremacy_sidebar_collapsed", String(next));
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-background text-text-white">
      <MobileAppBar
        currentPageTitle={currentPageTitle}
        moreOpen={moreOpen}
        onOpenMore={() => setMoreOpen(true)}
        squadLogoSrc={squadLogoSrc}
      />

      <MobileBottomNavigation navigation={mobilePrimaryNavigation} />

      <MoreNavigationSheet
        navigation={moreNavigation}
        onClose={() => setMoreOpen(false)}
        onLogout={logout}
        open={moreOpen}
      />

      <aside className={cn("fixed inset-y-0 left-0 z-40 hidden h-screen shrink-0 overflow-y-auto border-r border-white/5 bg-surface transition-[width] duration-300 lg:block", desktopSidebarCollapsed ? "w-20" : "w-64")}>
        <SidebarContent
          navigation={desktopNavigation}
          pathname={location.pathname}
          commanderName={commanderName}
          squadLogoSrc={squadLogoSrc}
          onLogout={logout}
          collapsed={desktopSidebarCollapsed}
          onToggleCollapsed={toggleDesktopSidebar}
        />
      </aside>

      <main className={cn("min-h-screen w-full flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] pt-14 transition-[padding-left] duration-300 lg:pb-0 lg:pt-0", desktopSidebarCollapsed ? "lg:pl-20" : "lg:pl-64")}>
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
