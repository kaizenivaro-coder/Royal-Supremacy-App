import { Link } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  Bell,
  Megaphone,
  Shield,
  TrendingUp,
  UserCircle,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "../data/store";
import { Badge, Button, Card } from "../components/ui";
import {
  getActiveMembers,
  getLatestAnnouncements,
  getProfileBanner,
  groupMembersByTeam,
} from "../lib/mvpApp";
import type { Announcement, Member, Notification } from "../types";

export type QuickPanel = "announcements" | "teams" | "tryouts" | "profile" | "notify";

const QUICK_PANEL_TRANSITION_MS = 200;

const quickActions = [
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "teams", label: "Teams", icon: Users },
  { id: "tryouts", label: "Tryouts", icon: UserPlus },
  { id: "profile", label: "Profile", icon: UserCircle },
] satisfies { id: QuickPanel; label: string; icon: typeof Megaphone }[];

const analyticsCards = [
  { label: "Win Trend", value: "Coming soon", icon: TrendingUp },
  { label: "Hero Pool", value: "Coming soon", icon: Shield },
  { label: "Activity", value: "Local MVP", icon: Activity },
];

type DashboardQuickActionDialogProps = {
  panel: QuickPanel | null;
  isVisible: boolean;
  latestAnnouncements: Announcement[];
  teamGroups: ReturnType<typeof groupMembersByTeam>;
  pendingTryoutsCount: number;
  currentMember: Member | undefined;
  authUsername: string | undefined;
  notifications: Notification[];
  teamNames: string[];
  onClose: () => void;
};

const quickPanelCopy: Record<QuickPanel, { title: string; description: string }> = {
  announcements: {
    title: "Announcements",
    description: "Latest squad updates from the command feed.",
  },
  teams: {
    title: "Teams",
    description: "Current MVP roster groups and assignment counts.",
  },
  tryouts: {
    title: "Tryouts",
    description: "Pending player files that need review.",
  },
  profile: {
    title: "Profile",
    description: "Your account identity, banner, roles, and heroes.",
  },
  notify: {
    title: "Team Notified",
    description: "Your local squad activity update has been created.",
  },
};

export function DashboardQuickActionDialog({
  panel,
  isVisible,
  latestAnnouncements,
  teamGroups,
  pendingTryoutsCount,
  currentMember,
  authUsername,
  notifications,
  teamNames,
  onClose,
}: DashboardQuickActionDialogProps) {
  if (!panel) return null;

  const panelCopy = quickPanelCopy[panel];

  return (
    <div
      className={`fixed inset-0 z-[80] flex items-center justify-center bg-black/72 px-3 py-5 backdrop-blur-sm transition-opacity duration-200 ease-in-out ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={`${panelCopy.title} quick action`}
      data-background-scroll-lock="enabled"
    >
      <div
        className={`flex h-[82vh] w-[calc(100vw-1rem)] max-w-3xl flex-col overflow-hidden rounded-lg border border-blue-200/20 bg-surface shadow-[0_28px_90px_rgba(0,0,0,0.52),0_0_0_1px_rgba(242,196,83,0.06)] transition-all duration-200 ease-in-out md:h-[72vh] ${
          isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-95 opacity-0"
        }`}
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-4 md:px-5">
          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-gold/60"
            aria-label="Close quick action panel"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="min-w-0">
            <h3 className="font-display text-xl font-black uppercase tracking-widest text-gold">
              {panelCopy.title}
            </h3>
            <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-text-muted">
              {panelCopy.description}
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-5">
          {panel === "announcements" && (
            <div className="space-y-3">
              {latestAnnouncements.length > 0 ? (
                latestAnnouncements.map((announcement) => (
                  <article
                    key={announcement.id}
                    className="rounded-lg border border-blue-200/10 bg-background/50 p-4 transition hover:border-gold/25 hover:bg-background/65"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <Badge
                        variant={
                          announcement.priority === "Urgent"
                            ? "danger"
                            : announcement.priority === "Important"
                              ? "gold"
                              : "default"
                        }
                      >
                        {announcement.priority}
                      </Badge>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                        {announcement.date}
                      </span>
                    </div>
                    <h4 className="font-black uppercase text-white">
                      {announcement.title}
                    </h4>
                    <p className="mt-2 text-sm font-medium leading-6 text-text-muted">
                      {announcement.message}
                    </p>
                  </article>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-blue-200/15 bg-background/35 p-8 text-center text-sm font-semibold text-text-muted">
                  No announcements are live yet.
                </div>
              )}
              <Link to="/announcements" onClick={onClose}>
                <Button variant="gold" className="mt-3 w-full">
                  Open Announcements
                </Button>
              </Link>
            </div>
          )}

          {panel === "teams" && (
            <div className="space-y-3">
              {teamNames.map((team) => (
                <div
                  key={team}
                  className="flex items-center justify-between rounded-lg border border-blue-200/10 bg-background/50 p-4 transition hover:border-gold/25 hover:bg-background/65"
                >
                  <span className="min-w-0 truncate text-sm font-black uppercase text-white">
                    {team}
                  </span>
                  <Badge variant={team === "Unassigned" ? "gold" : "default"}>
                    {(teamGroups[team] ?? []).length}
                  </Badge>
                </div>
              ))}
              <Link to="/teams" onClick={onClose}>
                <Button variant="gold" className="mt-3 w-full">
                  Open Teams
                </Button>
              </Link>
            </div>
          )}

          {panel === "tryouts" && (
            <div className="rounded-lg border border-blue-200/10 bg-background/50 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                Active Tryout Files
              </p>
              <p className="mt-3 text-5xl font-black text-white">
                {pendingTryoutsCount}
              </p>
              <p className="mt-3 text-sm font-medium leading-6 text-text-muted">
                These are the current MVP tryout records waiting on review,
                trial, or test-match decisions.
              </p>
              <Link to="/tryouts" onClick={onClose}>
                <Button variant="gold" className="mt-5 w-full">
                  Open Tryouts
                </Button>
              </Link>
            </div>
          )}

          {panel === "profile" && (
            <div className="rounded-lg border border-blue-200/10 bg-background/50 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                Signed in as
              </p>
              <p className="mt-3 text-3xl font-black text-gold">
                @{currentMember?.username ?? authUsername ?? "kingchoou"}
              </p>
              <p className="mt-3 text-sm font-medium leading-6 text-text-muted">
                Banner, email, password, MLBB ID, roles, and main heroes live in
                your profile settings.
              </p>
              <Link to="/profile" onClick={onClose}>
                <Button variant="gold" className="mt-5 w-full">
                  Open Profile
                </Button>
              </Link>
            </div>
          )}

          {panel === "notify" && (
            <div className="rounded-lg border border-gold/20 bg-background/50 p-5">
              <p className="text-lg font-black text-white">
                {notifications[0]?.message ??
                  `${currentMember?.username ?? "kingchoou"} is going online`}
              </p>
              <p className="mt-3 text-sm font-medium leading-6 text-text-muted">
                This is a local in-app notification for the MVP. Later it can
                become a Supabase realtime or push notification.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const {
    members,
    announcements,
    tryouts,
    notifications,
    authUser,
    teams,
    notifyTeamOnline,
  } = useAppStore();
  const [activePanel, setActivePanel] = useState<QuickPanel | null>(null);
  const [renderedPanel, setRenderedPanel] = useState<QuickPanel | null>(null);
  const [isPanelVisible, setIsPanelVisible] = useState(false);

  const currentMember =
    members.find((member) => member.username === authUser?.username) ?? members[0];
  const latestAnnouncements = useMemo(
    () => getLatestAnnouncements(announcements),
    [announcements],
  );
  const activeMembers = useMemo(() => getActiveMembers(members), [members]);
  const activeTeams = useMemo(
    () => teams.filter((team) => !team.archivedAt),
    [teams],
  );
  const teamGroups = useMemo(
    () => groupMembersByTeam(activeMembers, activeTeams),
    [activeMembers, activeTeams],
  );
  const teamNames = useMemo(
    () => activeTeams.map((team) => team.name),
    [activeTeams],
  );
  const pendingTryoutsCount = tryouts.filter((tryout) =>
    ["Pending", "Trial", "Needs Test Match"].includes(tryout.status),
  ).length;
  const banner = getProfileBanner(currentMember?.bannerId);

  const openPanel = (panel: QuickPanel) => {
    if (panel === "notify") {
      notifyTeamOnline();
    }
    setActivePanel(panel);
  };

  const closePanel = () => setActivePanel(null);

  useEffect(() => {
    if (activePanel) {
      setRenderedPanel(activePanel);
      const animationFrame = window.requestAnimationFrame(() => {
        setIsPanelVisible(true);
      });

      return () => window.cancelAnimationFrame(animationFrame);
    }

    setIsPanelVisible(false);
    const timeout = window.setTimeout(() => {
      setRenderedPanel(null);
    }, QUICK_PANEL_TRANSITION_MS);

    return () => window.clearTimeout(timeout);
  }, [activePanel]);

  useEffect(() => {
    if (!renderedPanel) return undefined;

    const scrollY = window.scrollY;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    const previousOverflow = document.body.style.overflow;
    const previousPosition = document.body.style.position;
    const previousTop = document.body.style.top;
    const previousLeft = document.body.style.left;
    const previousRight = document.body.style.right;
    const previousWidth = document.body.style.width;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePanel();
      }
    };

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.documentElement.style.overflow = previousDocumentOverflow;
      document.body.style.overflow = previousOverflow;
      document.body.style.position = previousPosition;
      document.body.style.top = previousTop;
      document.body.style.left = previousLeft;
      document.body.style.right = previousRight;
      document.body.style.width = previousWidth;
      window.removeEventListener("keydown", handleKeyDown);
      window.scrollTo(0, scrollY);
    };
  }, [renderedPanel]);

  return (
    <div className="space-y-8 pb-10 text-left">
      <section
        className="battle-panel min-h-[280px] p-6 md:p-8"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(3,7,18,0.96) 0%, rgba(3,7,18,0.86) 46%, rgba(3,7,18,0.42) 100%), url(${banner.src})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="max-w-2xl">
            <Badge variant="gold" className="mb-4">
              MVP Command Center
            </Badge>
            <h1 className="font-display text-4xl font-black uppercase leading-none text-white md:text-5xl mlbb-title">
              Royal Supremacy
            </h1>
            <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-text-muted">
              Player profile, squad teams, announcements, tryouts, and admin
              assignment are ready for the first usable squad build.
            </p>
          </div>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                  Current Player
                </p>
                <h2 className="mt-1 text-2xl font-black uppercase text-white">
                  {currentMember?.playerName ?? "King Choou"}
                </h2>
              </div>
              <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-lg border border-gold/30 bg-gold/10 text-lg font-black text-gold">
                {currentMember?.profileImageSrc ? (
                  <img
                    src={currentMember.profileImageSrc}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (currentMember?.username ?? "k").slice(0, 1).toUpperCase()
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-blue-200/10 bg-background/55 p-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">
                  Username
                </p>
                <p className="mt-1 truncate text-sm font-black text-gold">
                  @{currentMember?.username ?? authUser?.username ?? "kingchoou"}
                </p>
              </div>
              <div className="rounded-lg border border-blue-200/10 bg-background/55 p-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">
                  Team
                </p>
                <p className="mt-1 truncate text-sm font-black text-white">
                  {currentMember?.team ?? "Unassigned"}
                </p>
              </div>
              <div className="rounded-lg border border-blue-200/10 bg-background/55 p-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">
                  Role
                </p>
                <p className="mt-1 truncate text-sm font-black text-white">
                  {currentMember?.mainRole ?? "EXP Lane"}
                </p>
              </div>
              <div className="rounded-lg border border-blue-200/10 bg-background/55 p-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">
                  Rank
                </p>
                <p className="mt-1 truncate text-sm font-black text-white">
                  {currentMember?.currentRank ?? "Mythical Honor"}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {analyticsCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.label} className="p-5">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-blue-200/10 bg-surface-hover text-gold">
                  <Icon size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    {card.label}
                  </p>
                  <p className="mt-1 text-lg font-black text-white">{card.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <Card className="p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-black uppercase text-white">
                Quick Actions
              </h2>
              <p className="mt-1 text-sm font-semibold text-text-muted">
                Small controls for the core MVP routes.
              </p>
            </div>
            <Button variant="gold" size="sm" className="gap-2" onClick={() => openPanel("notify")}>
              <Bell size={14} />
              Notify Team
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => openPanel(action.id)}
                  className="flex min-h-24 flex-col items-start justify-between rounded-lg border border-blue-200/10 bg-background/50 p-4 text-left transition hover:border-gold/30 hover:bg-surface-hover"
                >
                  <Icon className="h-5 w-5 text-gold" />
                  <span className="text-xs font-black uppercase tracking-widest text-white">
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-xl font-black uppercase text-white">
              Activity Feed
            </h2>
            <Badge variant="gold">{notifications.length}</Badge>
          </div>
          <div className="space-y-3">
            {notifications.length > 0 ? (
              notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-lg border border-blue-200/10 bg-background/50 p-3"
                >
                  <p className="text-sm font-black text-white">{notification.message}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-blue-200/10 bg-background/35 p-6 text-center text-sm font-semibold text-text-muted">
                Team notifications will appear here.
              </div>
            )}
          </div>
        </Card>
      </div>

      <DashboardQuickActionDialog
        panel={renderedPanel}
        isVisible={isPanelVisible}
        latestAnnouncements={latestAnnouncements}
        teamGroups={teamGroups}
        pendingTryoutsCount={pendingTryoutsCount}
        currentMember={currentMember}
        authUsername={authUser?.username}
        notifications={notifications}
        teamNames={teamNames}
        onClose={closePanel}
      />
    </div>
  );
}
