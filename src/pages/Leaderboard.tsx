import { useState } from "react";
import { useAppStore } from "../data/store";
import { Card, PageHeader, Badge, Button } from "../components/ui";
import { Trophy, Medal, Star, Crown, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";

export default function Leaderboard() {
  const { members } = useAppStore();
  const [filterMode, setFilterMode] = useState<string>("Overall");

  const teams = Array.from(new Set(members.map((m) => m.team)));
  const filters = ["Overall", ...teams];

  const filteredMembers =
    filterMode === "Overall"
      ? members
      : members.filter((m) => m.team === filterMode);

  const sortedMembers = [...filteredMembers].sort(
    (a, b) => b.royalPoints - a.royalPoints,
  );

  const podium = sortedMembers.slice(0, 3);
  const others = sortedMembers.slice(3);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-gold group-hover:scale-110 transition-transform" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-300 group-hover:scale-110 transition-transform" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-700 group-hover:scale-110 transition-transform" />;
    return <span className="font-black text-text-muted text-sm">{index + 1}</span>;
  };

  return (
    <div className="space-y-10 pb-10 text-left">
      <PageHeader
        title="Hall of Fame"
        description="Elite rankings based on operational contribution and tactical excellence."
      />

      <div className="flex flex-wrap gap-3 mb-4">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setFilterMode(filter)}
            className={cn(
              "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              filterMode === filter
                ? "bg-gold text-background shadow-gold"
                : "bg-surface border border-white/5 text-text-muted hover:text-white hover:border-gold/30"
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Podium Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-10">
        {/* 2nd Place */}
        {podium[1] && (
          <Card className="order-2 md:order-1 h-64 flex flex-col items-center justify-end pb-8 relative group overflow-hidden bg-gradient-to-t from-slate-500/10 to-transparent">
             <div className="absolute top-0 left-0 w-full h-1 bg-slate-400" />
             <div className="w-16 h-16 rounded-2xl bg-slate-300 flex items-center justify-center text-background text-2xl font-black mb-4 group-hover:scale-110 transition-transform shadow-xl">2</div>
             <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-1">{podium[1].playerName}</h3>
             <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">{podium[1].team}</p>
             <div className="text-2xl font-black text-white">{podium[1].royalPoints} <span className="text-xs text-text-muted">PTS</span></div>
          </Card>
        )}

        {/* 1st Place */}
        {podium[0] && (
          <Card className="order-1 md:order-2 h-80 flex flex-col items-center justify-end pb-10 relative group overflow-hidden border-gold/30 bg-gradient-to-t from-gold/10 to-transparent shadow-gold">
             <div className="absolute top-0 left-0 w-full h-1.5 bg-gold" />
             <Crown className="absolute -top-1 w-12 h-12 text-gold animate-bounce" />
             <div className="w-20 h-20 rounded-2xl bg-gold flex items-center justify-center text-background text-4xl font-black mb-4 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(212,175,55,0.4)]">1</div>
             <h3 className="text-2xl font-black text-gold uppercase tracking-tighter mb-1 group-hover:gold-gradient-text transition-all">{podium[0].playerName}</h3>
             <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">{podium[0].team}</p>
             <div className="text-3xl font-black text-white">{podium[0].royalPoints} <span className="text-xs text-text-muted">PTS</span></div>
          </Card>
        )}

        {/* 3rd Place */}
        {podium[2] && (
          <Card className="order-3 md:order-3 h-56 flex flex-col items-center justify-end pb-6 relative group overflow-hidden bg-gradient-to-t from-amber-900/10 to-transparent">
             <div className="absolute top-0 left-0 w-full h-1 bg-amber-700" />
             <div className="w-14 h-14 rounded-2xl bg-amber-700 flex items-center justify-center text-white text-xl font-black mb-4 group-hover:scale-110 transition-transform shadow-xl">3</div>
             <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-1">{podium[2].playerName}</h3>
             <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">{podium[2].team}</p>
             <div className="text-xl font-black text-white">{podium[2].royalPoints} <span className="text-xs text-text-muted">PTS</span></div>
          </Card>
        )}
      </div>

      <Card className="p-0 overflow-hidden border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-surface-hover/50 text-[10px] uppercase tracking-[0.2em] font-black text-text-muted border-b border-white/5">
                <th className="p-5 text-center w-24">Pos</th>
                <th className="p-5">Operator</th>
                <th className="p-5">Tactical Division</th>
                <th className="p-5 text-right px-10">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {others.map((member, index) => (
                <tr
                  key={member.id}
                  className="hover:bg-white/5 transition-all duration-200 group"
                >
                  <td className="p-5 text-center font-black text-text-muted">
                    {index + 4}
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-white group-hover:border-gold/30 transition-colors">
                        {member.playerName.substring(0,2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-white uppercase tracking-tighter text-lg leading-none mb-1 group-hover:text-gold transition-colors">
                          {member.playerName}
                        </span>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{member.mainRole}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <Badge
                      variant={
                        member.team.includes("Sovereign") ? "gold" : "purple"
                      }
                      className="px-4 py-1"
                    >
                      {member.team}
                    </Badge>
                  </td>
                  <td className="p-5 text-right px-10">
                    <div className="text-xl font-black text-white uppercase">
                        {member.royalPoints}
                    </div>
                  </td>
                </tr>
              ))}
              {sortedMembers.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-20 text-center">
                    <div className="flex flex-col items-center opacity-30">
                       <Trophy size={48} className="mb-4" />
                       <p className="font-black uppercase tracking-widest">No Rankings Found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
