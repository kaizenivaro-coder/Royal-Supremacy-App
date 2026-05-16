import { Link } from "react-router-dom";
import {
  Activity,
  Bell,
  Megaphone,
  Shield,
  TrendingUp,
  UserCircle,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useAppStore } from "../data/store";
import { Badge, Button, Card } from "../components/ui";
import {
  getLatestAnnouncements,
  getProfileBanner,
  TEAM_GROUPS,
  groupMembersByTeam,
} from "../lib/mvpApp";

type QuickPanel = "announcements" | "teams" | "tryouts" | "profile" | "notify";

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

export default function Dashboard() {
  const {
    members,
    announcements,
    tryouts,
    notifications,
    authUser,
    notifyTeamOnline,
  } = useAppStore();
  const [activePanel, setActivePanel] = useState<QuickPanel | null>(null);

  const currentMember =
    members.find((member) => member.username === authUser?.username) ?? members[0];
  const latestAnnouncements = useMemo(
    () => getLatestAnnouncements(announcements),
    [announcements],
  );
  const teamGroups = useMemo(() => groupMembersByTeam(members), [members]);
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

      {activePanel && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/75 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-gold/20 bg-surface p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h3 className="font-display text-xl font-black uppercase text-white">
                {activePanel === "notify" ? "Team Notified" : quickActions.find((item) => item.id === activePanel)?.label}
              </h3>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="grid h-9 w-9 place-items-center rounded-lg border border-blue-200/10 text-text-muted transition hover:border-gold/30 hover:text-white"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {activePanel === "announcements" && (
              <div className="space-y-3">
                {latestAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="rounded-lg border border-blue-200/10 bg-background/50 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <Badge variant={announcement.priority === "Urgent" ? "danger" : announcement.priority === "Important" ? "gold" : "purple"}>
                        {announcement.priority}
                      </Badge>
                      <span className="text-[10px] font-bold text-text-muted">{announcement.date}</span>
                    </div>
                    <h4 className="font-black uppercase text-white">{announcement.title}</h4>
                    <p className="mt-2 text-sm font-medium leading-6 text-text-muted">
                      {announcement.message}
                    </p>
                  </div>
                ))}
                <Link to="/announcements" onClick={() => setActivePanel(null)}>
                  <Button variant="secondary" className="mt-3 w-full">
                    Open Announcements
                  </Button>
                </Link>
              </div>
            )}

            {activePanel === "teams" && (
              <div className="space-y-3">
                {TEAM_GROUPS.map((team) => (
                  <div key={team} className="flex items-center justify-between rounded-lg border border-blue-200/10 bg-background/50 p-4">
                    <span className="text-sm font-black uppercase text-white">{team}</span>
                    <Badge variant={team === "Unassigned" ? "gold" : "purple"}>
                      {teamGroups[team].length}
                    </Badge>
                  </div>
                ))}
                <Link to="/teams" onClick={() => setActivePanel(null)}>
                  <Button variant="secondary" className="mt-3 w-full">
                    Open Teams
                  </Button>
                </Link>
              </div>
            )}

            {activePanel === "tryouts" && (
              <div className="rounded-lg border border-blue-200/10 bg-background/50 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                  Active Tryout Files
                </p>
                <p className="mt-2 text-4xl font-black text-white">{pendingTryoutsCount}</p>
                <Link to="/tryouts" onClick={() => setActivePanel(null)}>
                  <Button variant="secondary" className="mt-5 w-full">
                    Open Tryouts
                  </Button>
                </Link>
              </div>
            )}

            {activePanel === "profile" && (
              <div className="rounded-lg border border-blue-200/10 bg-background/50 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                  Signed in as
                </p>
                <p className="mt-2 text-2xl font-black text-gold">
                  @{currentMember?.username ?? authUser?.username}
                </p>
                <p className="mt-2 text-sm font-medium text-text-muted">
                  Banner, email, password, MLBB ID, roles, and heroes live in your
                  profile settings.
                </p>
                <Link to="/profile" onClick={() => setActivePanel(null)}>
                  <Button variant="secondary" className="mt-5 w-full">
                    Open Profile
                  </Button>
                </Link>
              </div>
            )}

            {activePanel === "notify" && (
              <div className="rounded-lg border border-gold/20 bg-background/50 p-5">
                <p className="text-lg font-black text-white">
                  {(notifications[0]?.message ?? `${currentMember?.username ?? "kingchoou"} is going online`)}
                </p>
                <p className="mt-2 text-sm font-medium leading-6 text-text-muted">
                  This is a local in-app notification for the MVP. Later it can become
                  a Supabase realtime or push notification.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
