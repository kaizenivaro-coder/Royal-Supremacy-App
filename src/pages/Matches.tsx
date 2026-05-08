import { useAppStore } from "../data/store";
import { Card, PageHeader, Badge } from "../components/ui";
import { Swords, Trophy, AlertTriangle, MessageSquare, History } from "lucide-react";
import { cn } from "../lib/utils";

export default function Matches() {
  const { matches } = useAppStore();

  return (
    <div className="space-y-8 pb-10 text-left">
      <PageHeader
        title="Battle Reports"
        description="Comprehensive combat archives of all official squad operations."
      />

      <div className="space-y-6">
        {matches.length > 0 ? (
          matches.map((match) => (
            <Card
              key={match.id}
              className="p-0 overflow-hidden border-white/5 bg-surface group hover:border-gold/30 transition-all duration-300"
            >
              <div className="flex flex-col lg:flex-row">
                {/* Result Indicator & Main Teams */}
                <div className={cn(
                  "p-8 lg:w-96 flex flex-col items-center justify-center relative",
                  match.result === "Win" ? "bg-success/5" : match.result === "Loss" ? "bg-danger/5" : "bg-white/5"
                )}>
                   <div className={cn(
                     "absolute top-0 left-0 w-1.5 h-full",
                     match.result === "Win" ? "bg-success shadow-[0_0_15px_var(--color-success)]" : 
                     match.result === "Loss" ? "bg-danger shadow-[0_0_15px_var(--color-danger)]" : 
                     "bg-text-muted"
                   )} />
                   
                   <Badge 
                    variant={match.result === "Win" ? "success" : match.result === "Loss" ? "danger" : "default"}
                    className="mb-4 scale-125 select-none"
                   >
                     {match.result}
                   </Badge>

                   <div className="flex items-center gap-6 w-full justify-center">
                     <div className="flex flex-col items-center">
                       <div className="w-16 h-16 rounded-full bg-surface border-2 border-purple-royal/30 flex items-center justify-center text-xl font-black text-purple-light shadow-2xl mb-2">RS</div>
                       <span className="text-[10px] font-black text-white uppercase tracking-widest text-center truncate w-24">{match.team}</span>
                     </div>
                     <span className="text-2xl font-black italic text-text-muted/30">VS</span>
                     <div className="flex flex-col items-center">
                       <div className="w-16 h-16 rounded-full bg-surface border-2 border-white/10 flex items-center justify-center text-xl font-black text-text-muted shadow-2xl mb-2">OPP</div>
                       <span className="text-[10px] font-black text-white uppercase tracking-widest text-center truncate w-24">{match.enemyTeam}</span>
                     </div>
                   </div>

                   <div className="mt-6 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">{match.date}</span>
                      <span className="text-[10px] font-bold text-gold uppercase tracking-[0.2em]">{match.matchType}</span>
                   </div>
                </div>

                {/* Analysis & MVP */}
                <div className="flex-1 p-8 bg-gradient-to-br from-transparent to-white/[0.02]">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full">
                      {/* MVP Section */}
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5 relative group/item">
                         <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-lg bg-gold/10 text-gold border border-gold/20">
                               <Trophy size={16} />
                            </div>
                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Master of Operation</span>
                         </div>
                         <div className="text-lg font-black text-white uppercase tracking-tighter mb-1 group-hover/item:text-gold transition-colors">{match.mvp}</div>
                         <div className="text-[10px] font-bold text-gold uppercase tracking-widest">MVP Awarded</div>
                      </div>

                      {/* Best Performer */}
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5 group/item">
                         <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-lg bg-purple-royal/20 text-purple-light border border-purple-royal/30">
                               <Swords size={16} />
                            </div>
                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Combat specialist</span>
                         </div>
                         <div className="text-lg font-black text-white uppercase tracking-tighter mb-1 group-hover/item:text-purple-light transition-colors">{match.bestPerformer}</div>
                         <div className="text-[10px] font-bold text-purple-light uppercase tracking-widest">Elite Performance</div>
                      </div>

                      {/* Mistake */}
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5 group/item">
                         <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-lg bg-danger/10 text-danger border border-danger/30">
                               <AlertTriangle size={16} />
                            </div>
                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Tactical Error</span>
                         </div>
                         <div className="text-lg font-black text-white uppercase tracking-tighter mb-1 group-hover/item:text-danger transition-colors">{match.mainMistake}</div>
                         <div className="text-[10px] font-bold text-danger uppercase tracking-widest">Debrief focus</div>
                      </div>
                   </div>

                   {match.notes && (
                     <div className="mt-8 flex items-start gap-4 p-4 rounded-xl bg-surface-hover/30 border border-white/5">
                        <MessageSquare size={16} className="text-gold mt-1 shrink-0" />
                        <div>
                           <div className="text-[10px] font-black uppercase text-gold tracking-widest mb-1">Commander's Notes</div>
                           <p className="text-sm font-medium text-text-muted leading-relaxed italic">
                             "{match.notes}"
                           </p>
                        </div>
                     </div>
                   )}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-24 text-center border-dashed border-white/10 flex flex-col items-center">
            <History size={64} strokeWidth={1} className="text-text-muted opacity-20 mb-6" />
            <h3 className="text-2xl font-black uppercase text-white mb-2">No Battle Records</h3>
            <p className="text-text-muted max-w-sm font-medium">The history scrolls are empty. Engage in combat to record your first victory.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
