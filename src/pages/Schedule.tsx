import { useAppStore } from "../data/store";
import { Card, PageHeader, Badge, Button } from "../components/ui";
import { Calendar, Clock, Users, CheckCircle2, XCircle, AlertCircle, MapPin } from "lucide-react";
import { cn } from "../lib/utils";

const DEMO_USER_ID = "member_001"; // Assume we are 'King Choou' for this demo

export default function Schedule() {
  const { schedule, setSchedule } = useAppStore();

  const updateAttendance = (eventId: string, status: string) => {
    const newSchedule = schedule.map((event) => {
      if (event.id === eventId) {
        return {
          ...event,
          attendance: {
            ...(event.attendance || {}),
            [DEMO_USER_ID]: status,
          },
        };
      }
      return event;
    });
    setSchedule(newSchedule);
  };

  return (
    <div className="space-y-8 pb-10 text-left">
      <PageHeader
        title="Tactical Schedule"
        description="Monitor and coordinate upcoming squad operations."
      />

      <div className="grid grid-cols-1 gap-6">
        {schedule.length > 0 ? (
          schedule.map((event) => {
            const userStatus = event.attendance?.[DEMO_USER_ID] || "Pending";
            
            return (
              <Card
                key={event.id}
                className="p-0 overflow-hidden flex flex-col md:flex-row relative group border-white/5 hover:border-purple-royal/30 transition-all duration-300"
              >
                {/* Date block */}
                <div className="bg-surface-hover/50 md:w-56 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5 shrink-0 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-purple-royal opacity-40" />
                  
                  <div className="text-gold font-display font-black text-sm uppercase tracking-[0.3em] mb-2 leading-none">
                    {new Date(event.date).toLocaleDateString("en-US", {
                      month: "short",
                    })}
                  </div>
                  <div className="text-6xl font-display font-black text-white leading-none mb-4">
                    {new Date(event.date).getDate()}
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-text-muted text-[10px] font-black uppercase tracking-widest">
                    <Clock size={12} className="text-gold" />
                    {event.time}
                  </div>
                </div>

                {/* Details block */}
                <div className="p-8 flex-1 flex flex-col justify-center relative bg-gradient-to-r from-transparent to-purple-royal/5">
                  <div className="flex flex-wrap items-start justify-between gap-6 mb-4">
                    <div className="space-y-3 flex-1 min-w-[200px]">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant="purple" className="px-3 py-1 font-black">{event.type}</Badge>
                        <span className="text-[10px] uppercase tracking-widest font-black text-text-muted flex items-center gap-1.5">
                          <Users size={14} className="text-gold" />
                          {event.team}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest font-black text-text-muted flex items-center gap-1.5">
                           <MapPin size={14} className="text-gold" />
                           Lobby 1
                        </span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-display font-black text-white group-hover:gold-gradient-text transition-all uppercase tracking-tight">
                        {event.title}
                      </h3>
                      <p className="text-text-muted text-sm font-medium max-w-xl leading-relaxed">
                        {event.description}
                      </p>
                    </div>

                    {/* Attendance Controls */}
                    <div className="flex flex-col gap-3 shrink-0">
                      <div className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">Your Deployment</div>
                      <div className="flex gap-2">
                        <Button
                          variant={userStatus === "Attending" ? "gold" : "ghost"}
                          size="sm"
                          onClick={() => updateAttendance(event.id, "Attending")}
                          className={cn(
                            "gap-2 px-4 h-9 border border-white/5",
                            userStatus === "Attending" ? "" : "hover:border-success/30 hover:text-success"
                          )}
                        >
                          <CheckCircle2 size={14} />
                          Ready
                        </Button>
                        <Button
                          variant={userStatus === "Not Attending" ? "danger" : "ghost"}
                          size="sm"
                          onClick={() => updateAttendance(event.id, "Not Attending")}
                          className={cn(
                            "gap-2 px-4 h-9 border border-white/5",
                            userStatus === "Not Attending" ? "" : "hover:border-danger/30 hover:text-danger"
                          )}
                        >
                          <XCircle size={14} />
                          Absent
                        </Button>
                        <Button
                          variant={userStatus === "Maybe" ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => updateAttendance(event.id, "Maybe")}
                          className={cn(
                            "gap-2 px-4 h-9 border border-white/5",
                            userStatus === "Maybe" ? "bg-white/10" : "hover:border-white/20 hover:text-white"
                          )}
                        >
                          <AlertCircle size={14} />
                          Later
                        </Button>
                      </div>
                      
                      {/* Operational Strength */}
                      <div className="mt-2 flex items-center gap-2">
                         <div className="flex -space-x-2">
                            {[1,2,3,4].map(i => (
                               <div key={i} className="w-5 h-5 rounded-full bg-white/10 border border-background flex items-center justify-center text-[8px] font-black text-text-muted">
                                  {i}
                               </div>
                            ))}
                         </div>
                         <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">+5 Others Confirmed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="p-20 text-center text-text-muted flex flex-col items-center justify-center border-dashed border-white/10">
            <Calendar size={64} strokeWidth={1} className="mb-6 opacity-20" />
            <h3 className="text-2xl font-black uppercase text-white mb-2">No Active Operations</h3>
            <p className="max-w-xs font-medium">Standby for orders from command. Ensure your equipment is ready.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
