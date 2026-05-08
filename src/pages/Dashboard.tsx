import { useAppStore } from "../data/store";
import { Card, Button, Badge } from "../components/ui";
import { cn } from "../lib/utils";
import {
  Users,
  Swords,
  Calendar as CalendarIcon,
  Trophy,
  Megaphone,
  Zap,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  Crown,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getNextScheduledEvent } from "../lib/appInsights";
import { HeroIcon } from "../components/HeroIcon";

export default function Dashboard() {
  const { members, matches, schedule, announcements, tryouts, isAdmin } = useAppStore();

  const activeMembersCount = members.filter((m) => m.status === "Active").length;
  const nextOperation = getNextScheduledEvent(schedule);
  const latestAnnouncement =
    announcements.length > 0 ? announcements[announcements.length - 1] : null;
  const pendingTryoutsCount = tryouts.filter((t) => t.status === "Pending").length;

  const topPlayers = [...members]
    .sort((a, b) => b.royalPoints - a.royalPoints)
    .slice(0, 5);
  const recentMatches = [...matches]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-8 pb-10">
      {/* Hero Section */}
      <section className="battle-panel p-6 md:p-10">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7">
          <Badge variant="gold" className="mb-5">Squad Lobby: Ready</Badge>
          <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-4 uppercase leading-none mlbb-title">
            Enter the <span className="gold-gradient-text">Land of Dawn</span>
          </h1>
          <p className="text-lg text-text-muted font-medium mb-8 max-w-xl">
            Track heroes, ranked pressure, operations, and battle records from
            one Royal Supremacy command lobby.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/schedule">
              <Button variant="gold" className="gap-2">
                <CalendarIcon size={18} />
                Queue Operations
              </Button>
            </Link>
            <Link to="/members">
              <Button variant="secondary" className="gap-2">
                <Users size={18} />
                Hero Roster
              </Button>
            </Link>
          </div>
          <div className="battle-divider mt-8 max-w-xl" />
          <div className="mt-5 grid grid-cols-3 gap-3 max-w-lg">
            <div>
              <div className="text-2xl font-black text-white">{members.length}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                Squad
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-gold">{matches.length}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                Battles
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-purple-light">
                {nextOperation ? nextOperation.time : "--"}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                Next Call
              </div>
            </div>
          </div>
          </div>

          <div className="lg:col-span-5">
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {topPlayers.slice(0, 3).map((player, index) => (
                <div
                  key={player.id}
                  className={cn(
                    "relative p-3 bg-background/55 border border-blue-200/15",
                    index === 0 ? "translate-y-0" : "translate-y-6",
                  )}
                >
                  <div className="absolute -top-2 -left-2 h-6 w-6 bg-gold text-background text-[10px] font-black flex items-center justify-center">
                    {index + 1}
                  </div>
                  <HeroIcon
                    heroName={player.mainHeroes[0]}
                    className="hero-token aspect-square w-full"
                  />
                  <div className="mt-3 text-center">
                    <div className="truncate text-xs font-black uppercase text-white">
                      {player.playerName}
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-gold">
                      {player.mainHeroes[0]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 border border-gold/20 bg-background/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                  Next Operation
                </span>
                <Badge variant="purple">{nextOperation?.type || "Standby"}</Badge>
              </div>
              <div className="mt-2 text-lg font-black text-white">
                {nextOperation?.title || "Awaiting Orders"}
              </div>
              <div className="text-xs font-bold text-text-muted">
                {nextOperation
                  ? `${nextOperation.date} at ${nextOperation.time}`
                  : "No queued operation"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4 p-6 glass-card-hover group">
          <div className="w-14 h-14 bg-gold/10 flex items-center justify-center text-gold shrink-0 border border-gold/25 group-hover:bg-gold/20 transition-colors">
            <Users size={28} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-black text-text-muted mb-0.5">Total Squad</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-white">{members.length}</h3>
              <span className="text-[10px] font-black text-success uppercase">{activeMembersCount} Active</span>
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-6 glass-card-hover group">
          <div className="w-14 h-14 bg-purple-royal/20 flex items-center justify-center text-purple-light shrink-0 border border-purple-royal/35 group-hover:bg-purple-royal/30 transition-colors">
            <Zap size={28} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-black text-text-muted mb-0.5">Next Operation</p>
            <h3 className="text-lg font-bold text-white truncate max-w-[140px]">
              {nextOperation ? nextOperation.type : "Standby"}
            </h3>
            <p className="text-[10px] text-text-muted font-bold truncate">
              {nextOperation ? `${nextOperation.date} at ${nextOperation.time}` : "Awaiting Orders"}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-6 glass-card-hover group">
          <div className="w-14 h-14 bg-success/10 flex items-center justify-center text-success shrink-0 border border-success/20 group-hover:bg-success/20 transition-colors">
            <Swords size={28} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-black text-text-muted mb-0.5">Total Matches</p>
            <h3 className="text-3xl font-black text-white">{matches.length}</h3>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Recorded</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-6 glass-card-hover group">
          <div className="w-14 h-14 bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0 border border-orange-500/20 group-hover:bg-orange-500/20 transition-colors">
            <UserPlus size={28} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-black text-text-muted mb-0.5">Applications</p>
            <h3 className="text-3xl font-black text-white">{pendingTryoutsCount}</h3>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Pending Review</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Areas */}
        <div className="lg:col-span-8 space-y-8">
          {/* Quick Stats & Promo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {latestAnnouncement && (
              <Card className="relative overflow-hidden group">
                <div className="flex items-center gap-2 text-gold mb-4">
                  <Megaphone size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Latest Announcement</span>
                </div>
                <h4 className="text-xl font-display font-bold text-white mb-2 leading-tight">
                  {latestAnnouncement.title}
                </h4>
                <p className="text-sm text-text-muted line-clamp-2 mb-4 font-medium">
                  {latestAnnouncement.message}
                </p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                  <span className="text-[10px] font-bold text-text-muted">{latestAnnouncement.date}</span>
                  <Link to="/announcements">
                    <Button variant="ghost" size="sm" className="group/btn">
                      Read Full <ArrowRight size={14} className="ml-1 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </Card>
            )}

            <Card className="bg-gradient-to-br from-purple-royal/20 to-transparent border-purple-royal/20">
              <div className="flex items-center gap-2 text-purple-light mb-4">
                <ShieldCheck size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Squad Mission</span>
              </div>
              <h4 className="text-xl font-display font-bold text-white mb-2 leading-tight">
                Achieve Mythic Immortal
              </h4>
              <p className="text-sm text-text-muted font-medium mb-4">
                Our current season primary goal is to have 100% of Royal Sovereign 
                reach current highest tier by month end.
              </p>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-[65%] bg-purple-royal shadow-[0_0_10px_var(--color-purple-royal)]" />
              </div>
              <p className="text-[10px] text-right mt-2 text-purple-light font-black uppercase tracking-widest">65% Completed</p>
            </Card>
          </div>

          <Card>
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-display font-black text-2xl uppercase">
                Recent Battles
              </h3>
              <Link to="/matches">
                <Button variant="secondary" size="sm" className="gap-2">
                  Match History <ArrowRight size={14} />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentMatches.map((match) => (
                <div
                  key={match.id}
                  className="p-5 bg-surface-hover/35 border border-blue-200/10 hover:border-gold/25 transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant={match.result === "Win" ? "success" : "danger"}>
                      {match.result}
                    </Badge>
                    <span className="text-[10px] font-bold text-text-muted">{match.date}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex flex-col items-center flex-1 text-center">
                      <div className="w-10 h-10 rounded-full bg-purple-royal/20 flex items-center justify-center text-purple-light mb-2 font-black text-xs border border-purple-royal/20">RS</div>
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest truncate w-full">{match.team}</span>
                    </div>
                    <span className="text-gold font-black italic">VS</span>
                    <div className="flex flex-col items-center flex-1 text-center">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-text-muted mb-2 font-black text-xs border border-white/10">OPP</div>
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest truncate w-full">{match.enemyTeam}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-center font-black uppercase tracking-[0.2em] text-gold border-t border-white/5 pt-3 group-hover:tracking-[0.3em] transition-all">
                    MVP: {match.mvp}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Sidebar Area */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="premium-gradient-card">
            <h3 className="flex items-center gap-2 font-display font-black text-xl uppercase tracking-widest mb-6">
              <Trophy size={20} className="text-gold" />
              Elite 5
            </h3>
            <div className="space-y-6">
              {topPlayers.map((player, index) => (
                <div key={player.id} className="group relative flex items-center gap-4">
                  <div className="relative">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-transform group-hover:scale-110",
                      index === 0 ? "bg-gold text-background shadow-gold" : 
                      index === 1 ? "bg-slate-300 text-background" : 
                      index === 2 ? "bg-amber-600 text-white" : 
                      "bg-surface-hover text-text-muted border border-white/5"
                    )}>
                      {index + 1}
                    </div>
                    {index === 0 && (
                      <Crown className="absolute -top-3 -right-3 w-6 h-6 text-gold drop-shadow-lg animate-bounce" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-white uppercase tracking-wider text-sm truncate">
                      {player.playerName}
                    </div>
                    <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                      {player.team}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-black text-gold text-lg leading-none">
                      {player.royalPoints}
                    </div>
                    <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                      Points
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/leaderboard" className="block mt-8">
              <Button variant="secondary" className="w-full text-xs">Full Leaderboard</Button>
            </Link>
          </Card>

          {isAdmin && (
            <Card className="border-purple-royal/20 bg-purple-royal/5">
              <h3 className="font-display font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2 text-purple-light">
                <Zap size={14} />
                Quick Admin Actions
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Link to="/admin?tab=matches">
                  <Button variant="secondary" size="sm" className="w-full text-[10px]">Log Match</Button>
                </Link>
                <Link to="/admin?tab=points">
                  <Button variant="secondary" size="sm" className="w-full text-[10px]">Grant PTS</Button>
                </Link>
                <Link to="/admin?tab=announcements">
                  <Button variant="secondary" size="sm" className="w-full text-[10px]">Post Note</Button>
                </Link>
                <Link to="/admin?tab=members">
                  <Button variant="secondary" size="sm" className="w-full text-[10px]">Add Member</Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
