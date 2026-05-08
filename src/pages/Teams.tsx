import { useAppStore } from "../data/store";
import { Card, PageHeader, Badge } from "../components/ui";
import { Users, Shield, Star, Swords } from "lucide-react";
import { cn } from "../lib/utils";

const MLBB_ROLES = ["Gold Lane", "EXP Lane", "Mid Lane", "Jungle", "Roam"];

export default function Teams() {
  const { teams, members } = useAppStore();

  const getMemberDetails = (id: string) => members.find((m) => m.id === id);

  return (
    <div className="space-y-8 pb-10 text-left">
      <PageHeader
        title="Squad Divisions"
        description="The elite tactical units of the Royal Supremacy hierarchy."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {teams.map((team) => (
          <Card
            key={team.id}
            className="flex flex-col relative overflow-hidden group p-0 border-white/5 hover:border-gold/30 transition-all duration-500"
          >
            {/* Team Banner / Header */}
            <div className="relative h-32 overflow-hidden bg-surface-hover">
               <div className={cn(
                 "absolute inset-0 bg-gradient-to-br transition-opacity duration-500",
                 team.name.includes("Sovereign") 
                  ? "from-gold/20 via-background to-background opacity-60 group-hover:opacity-80" 
                  : "from-purple-royal/20 via-surface to-background opacity-60 group-hover:opacity-80"
               )} />
               
               <div className="absolute inset-0 p-8 flex items-center justify-between">
                  <div className="flex flex-col">
                    <h2 className="text-3xl font-display font-black text-white tracking-widest uppercase leading-none mb-2">
                       {team.name}
                    </h2>
                    <Badge variant={team.name.includes("Sovereign") ? "gold" : "purple"}>
                      {team.type}
                    </Badge>
                  </div>
                  <Shield size={48} className={cn(
                    "opacity-20 group-hover:opacity-40 transition-all transform group-hover:scale-110",
                    team.name.includes("Sovereign") ? "text-gold" : "text-purple-royal"
                  )} />
               </div>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-text-muted text-sm font-medium italic border-l-2 border-gold/40 pl-4 py-1">
                "{team.notes}"
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 relative overflow-hidden group/cap">
                   <div className="absolute top-0 left-0 w-1 h-full bg-gold opacity-0 group-hover/cap:opacity-100 transition-opacity" />
                   <div className="flex items-center gap-3 text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">
                      <Star size={12} className="text-gold" />
                      Division Captain
                   </div>
                   <div className="font-black text-white uppercase text-lg group-hover/cap:text-gold transition-colors">{team.captain}</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                   <div className="flex items-center gap-3 text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5">
                      <Users size={12} className="text-purple-light" />
                      Operational Size
                   </div>
                   <div className="font-black text-white uppercase text-lg">{team.members.length} / 6 Operators</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-[0.3em]">
                  <Swords size={12} className="text-gold" />
                  Tactical Roster
                </div>
                
                <div className="grid gap-2">
                  {MLBB_ROLES.map((role) => {
                    const memberWithRole = team.members
                      .map(id => getMemberDetails(id))
                      .find(m => m?.mainRole === role);
                    
                    return (
                      <div 
                        key={role}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl border border-white/5 transition-all text-left",
                          memberWithRole ? "bg-white/5" : "bg-transparent border-dashed border-white/10 opacity-40 shrink-0"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black uppercase tracking-tighter shrink-0",
                            memberWithRole ? "bg-purple-royal/20 text-gold" : "bg-white/5 text-text-muted"
                          )}>
                             {role.substring(0, 2)}
                          </div>
                          <div>
                            <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-0.5">{role}</div>
                            <div className="text-sm font-black text-white uppercase tracking-tight">
                              {memberWithRole ? memberWithRole.playerName : "VACANT"}
                            </div>
                          </div>
                        </div>
                        {memberWithRole && (
                          <div className="text-right">
                            <div className="text-[10px] font-black text-gold uppercase tracking-widest">{memberWithRole.currentRank}</div>
                            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">RANK</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Bench / Substitutes */}
                {team.members.length > 5 && (
                  <div className="pt-4 mt-4 border-t border-white/5">
                    <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Substitutes</div>
                    <div className="flex flex-wrap gap-2">
                      {team.members
                        .map(id => getMemberDetails(id))
                        .filter(m => m && !MLBB_ROLES.includes(m.mainRole))
                        .map(m => m && (
                          <Badge key={m.id} variant="purple" className="py-1.5 px-3">
                             {m.playerName} ({m.mainRole})
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
