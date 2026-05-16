import React, { useState } from "react";
import { useAppStore } from "../data/store";
import { Card, PageHeader, Badge, Button, Input, Textarea, Label, Select } from "../components/ui";
import { Megaphone, AlertCircle, Calendar, User, Send, Bell } from "lucide-react";
import { Announcement } from "../types";
import { cn } from "../lib/utils";

export default function Announcements() {
  const { announcements, isAdmin, setAnnouncements } = useAppStore();
  const [showForm, setShowForm] = useState(false);

  const sortedAnnouncements = [...announcements].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const handlePost = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const title = (form.elements.namedItem("title") as HTMLInputElement).value;
    const message = (form.elements.namedItem("message") as HTMLTextAreaElement).value;
    const priority = (form.elements.namedItem("priority") as HTMLSelectElement).value;

    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title,
      message,
      priority,
      postedBy: "Supreme Commander",
      date: new Date().toISOString().split("T")[0],
    };

    setAnnouncements([...announcements, newAnn]);
    setShowForm(false);
    form.reset();
  };

  return (
    <div className="space-y-8 pb-10 text-left">
      <PageHeader
        title="Royal Decrees"
        description="Official strategic updates and mandatory orders from leadership."
      >
        {isAdmin && (
          <Button 
            onClick={() => setShowForm(!showForm)}
            variant={showForm ? "secondary" : "gold"}
            size="sm"
            className="font-black uppercase tracking-widest gap-2"
          >
            {showForm ? "Close Comms" : "Signal Squad"}
            <Bell size={16} />
          </Button>
        )}
      </PageHeader>

      {showForm && isAdmin && (
        <Card className="max-w-2xl mx-auto border-gold/30 shadow-gold p-8 mb-10 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Megaphone size={120} />
          </div>
          <h3 className="text-xl font-black text-white uppercase tracking-widest mb-6">Dispatch New Decree</h3>
          <form className="space-y-6 relative z-10" onSubmit={handlePost}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Subject</Label>
                <Input id="title" name="title" required placeholder="OPERATION UPDATES..." className="uppercase font-black" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Threat Level</Label>
                <Select id="priority" name="priority">
                   <option value="Normal">Normal</option>
                   <option value="Important">Important</option>
                   <option value="Urgent">Urgent</option>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message Directive</Label>
              <Textarea id="message" name="message" required rows={4} placeholder="ENTER COMMUNICATIONS..." className="font-medium" />
            </div>
            <Button type="submit" className="w-full gap-2 font-black uppercase tracking-widest">
               Execute Broadcast <Send size={16} />
            </Button>
          </form>
        </Card>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {sortedAnnouncements.length > 0 ? (
          sortedAnnouncements.map((ann) => (
            <Card
              key={ann.id}
              className={cn(
                "p-0 overflow-hidden group transition-all duration-300",
                ann.priority === "Urgent" ? "border-danger/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]" : 
                ann.priority === "Important" ? "border-gold/30 shadow-gold" : 
                "border-white/5"
              )}
            >
              <div className="flex flex-col">
                {/* Visual Header */}
                <div className={cn(
                  "h-1.5 w-full",
                  ann.priority === "Urgent" ? "bg-danger" : 
                  ann.priority === "Important" ? "bg-gold" : 
                  "bg-purple-royal"
                )} />

                <div className="p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                         <Badge 
                           variant={ann.priority === "Urgent" ? "danger" : ann.priority === "Important" ? "gold" : "purple"}
                           className="font-black px-3 py-1 scale-110"
                         >
                           {ann.priority}
                         </Badge>
                         <div className="flex items-center gap-4 text-[10px] font-black text-text-muted uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><Calendar size={12} className="text-gold" /> {ann.date}</span>
                            <span className="flex items-center gap-1.5"><User size={12} className="text-gold" /> {ann.postedBy}</span>
                         </div>
                      </div>
                      <h2 className={cn(
                        "text-2xl md:text-3xl font-display font-black uppercase tracking-tight leading-tight group-hover:gold-gradient-text transition-all",
                        ann.priority === "Urgent" ? "text-danger" : "text-white"
                      )}>
                        {ann.title}
                      </h2>
                    </div>
                    <Megaphone className={cn(
                      "opacity-10 group-hover:opacity-30 transition-opacity transform group-hover:scale-110 shrink-0",
                      ann.priority === "Urgent" ? "text-danger" : ann.priority === "Important" ? "text-gold" : "text-purple-royal"
                    )} size={48} />
                  </div>

                  <div className="bg-white/5 border border-white/5 rounded-lg p-6 mb-2">
                    <p className="text-[17px] text-white/90 leading-relaxed font-normal whitespace-pre-wrap">
                       {ann.message}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-24 bg-white/5 border border-dashed border-white/10 rounded-lg flex flex-col items-center">
            <Megaphone size={64} className="mb-6 text-text-muted opacity-20" strokeWidth={1} />
            <h3 className="text-2xl font-black uppercase text-white mb-2 tracking-widest">Total Radio Silence</h3>
            <p className="text-text-muted max-w-xs font-medium">Standby for incoming communications from the high command.</p>
          </div>
        )}
      </div>
    </div>
  );
}
