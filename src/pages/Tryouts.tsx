import React, { useState } from "react";
import { useAppStore } from "../data/store";
import {
  Card,
  PageHeader,
  Badge,
  Button,
  Input,
  Textarea,
  Label,
  Select,
} from "../components/ui";
import {
  FileText,
  CheckCircle,
  XCircle,
  Send,
  Globe,
  Phone,
  Clock,
  UserPlus,
  ShieldPlus,
} from "lucide-react";
import { Tryout } from "../types";
import { cn } from "../lib/utils";
import { HeroIcon } from "../components/HeroIcon";

export default function Tryouts() {
  const { tryouts, setTryouts, isAdmin } = useAppStore();
  const [activeTab, setActiveTab] = useState<"pending" | "resolved">("pending");
  const [showForm, setShowForm] = useState(false);

  const pendingTryouts = tryouts.filter(
    (t) =>
      t.status === "Pending" ||
      t.status === "Needs Test Match" ||
      t.status === "Trial",
  );
  const resolvedTryouts = tryouts.filter(
    (t) => !["Pending", "Needs Test Match", "Trial"].includes(t.status),
  );

  const displayList =
    activeTab === "pending" ? pendingTryouts : resolvedTryouts;

  const handleApply = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const newTryout: Tryout = {
      id: `try-${Date.now()}`,
      playerName: formData.get("playerName") as string,
      mlbbId: formData.get("mlbbId") as string,
      serverId: formData.get("serverId") as string,
      currentRank: formData.get("currentRank") as string,
      highestRank: formData.get("highestRank") as string,
      mainRole: formData.get("mainRole") as string,
      secondaryRole: formData.get("secondaryRole") as string,
      mainHeroes: (formData.get("heroes") as string)
        .split(",")
        .map((h) => h.trim()),
      country: formData.get("country") as string,
      availability: formData.get("availability") as string,
      whatsapp: formData.get("whatsapp") as string,
      reason: formData.get("reason") as string,
      status: "Pending",
    };

    setTryouts([...tryouts, newTryout]);
    setShowForm(false);
    form.reset();
  };

  const updateStatus = (id: string, newStatus: string) => {
    setTryouts(
      tryouts.map((t) => (t.id === id ? { ...t, status: newStatus } : t)),
    );
  };

  return (
    <div className="space-y-8 pb-10 text-left">
      <PageHeader
        title="Royal Trials"
        description="Recruitment protocols for aspiring operators seeking to join the supreme ranks."
      >
        <Button
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? "secondary" : "gold"}
          className="font-black uppercase tracking-widest gap-2"
        >
          {showForm ? "Cancel Intel" : "Submit Intelligence"}
          <UserPlus size={18} />
        </Button>
      </PageHeader>

      {showForm && (
        <Card className="max-w-3xl mx-auto border-gold/30 shadow-gold p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <ShieldPlus size={150} />
          </div>
          <h3 className="text-xl font-black text-white uppercase tracking-widest mb-6 relative z-10">
            Recruitment Application
          </h3>
          <form className="space-y-6 relative z-10" onSubmit={handleApply}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>In-Game Name</Label>
                <Input
                  name="playerName"
                  required
                  placeholder="KING CHOUU..."
                  className="uppercase font-black"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>MLBB ID</Label>
                  <Input name="mlbbId" required placeholder="12345678" />
                </div>
                <div className="space-y-2">
                  <Label>Server</Label>
                  <Input name="serverId" required placeholder="1234" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Current Rank</Label>
                  <Input
                    name="currentRank"
                    required
                    placeholder="Mythic Immortal"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Highest Rank</Label>
                  <Input name="highestRank" required placeholder="153 Stars" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Main Role</Label>
                  <Select name="mainRole">
                    <option>Gold Lane</option>
                    <option>EXP Lane</option>
                    <option>Mid Lane</option>
                    <option>Jungle</option>
                    <option>Roam</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Secondary</Label>
                  <Select name="secondaryRole">
                    <option>Roam</option>
                    <option>Flex</option>
                    <option>Jungle</option>
                    <option>Gold Lane</option>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Signature Heroes (Comma separated)</Label>
              <Input
                name="heroes"
                required
                placeholder="Chou, Paquito, Benedetta..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Country/Timezone</Label>
                <Input
                  name="country"
                  required
                  placeholder="Philippines (GMT+8)"
                />
              </div>
              <div className="space-y-2">
                <Label>Contact (WA / Disc)</Label>
                <Input name="whatsapp" required placeholder="+63 XXX..." />
              </div>
              <div className="space-y-2">
                <Label>Weekly Hours</Label>
                <Input name="availability" required placeholder="40+ Hours" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Why join Royal Supremacy?</Label>
              <Textarea
                name="reason"
                required
                rows={3}
                placeholder="Tell us about your competitive experience..."
              />
            </div>

            <Button
              type="submit"
              className="w-full gap-2 font-black uppercase tracking-widest h-14"
            >
              Submit Intel for Review <Send size={18} />
            </Button>
          </form>
        </Card>
      )}

      <div className="flex gap-4 border-b border-white/5 mb-8">
        <button
          onClick={() => setActiveTab("pending")}
          className={cn(
            "pb-4 text-xs font-black uppercase tracking-widest transition-all relative flex items-center gap-2",
            activeTab === "pending"
              ? "text-gold"
              : "text-text-muted hover:text-white",
          )}
        >
          Active Files ({pendingTryouts.length})
          {activeTab === "pending" && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gold shadow-gold" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("resolved")}
          className={cn(
            "pb-4 text-xs font-black uppercase tracking-widest transition-all relative flex items-center gap-2",
            activeTab === "resolved"
              ? "text-gold"
              : "text-text-muted hover:text-white",
          )}
        >
          Archived Files ({resolvedTryouts.length})
          {activeTab === "resolved" && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gold shadow-gold" />
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {displayList.map((t) => (
          <Card
            key={t.id}
            className="relative overflow-hidden group border-white/5 hover:border-gold/30 transition-all duration-300 p-0"
          >
            <div className="flex flex-col lg:flex-row">
              {/* Badge Overlay for status */}
              <div className="absolute top-6 right-6 z-10">
                <Badge
                  variant={
                    t.status === "Accepted"
                      ? "success"
                      : t.status === "Rejected"
                        ? "danger"
                        : t.status === "Needs Test Match"
                          ? "gold"
                          : t.status === "Trial"
                            ? "purple"
                            : "default"
                  }
                  className="font-black px-4 py-1.5"
                >
                  {t.status}
                </Badge>
              </div>

              {/* Identity & Background */}
              <div className="p-8 lg:w-80 bg-surface-hover/50 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-purple-royal opacity-20" />
                <div className="w-24 h-24 rounded-2xl bg-background border-2 border-white/10 flex items-center justify-center text-4xl font-black text-text-muted mb-4 group-hover:border-gold/30 transition-colors shadow-2xl relative z-10">
                  {t.playerName.substring(0, 1).toUpperCase()}
                </div>
                <h3 className="text-2xl font-display font-black text-white text-center uppercase tracking-tight mb-1 relative z-10">
                  {t.playerName}
                </h3>
                <div className="text-[10px] font-black text-gold uppercase tracking-[0.2em] relative z-10">
                  {t.mlbbId} ({t.serverId})
                </div>
                <div className="mt-4 flex items-center gap-2 text-text-muted text-[10px] font-black uppercase tracking-widest relative z-10">
                  <Globe size={12} className="text-gold" /> {t.country}
                </div>
              </div>

              {/* Combat Specs */}
              <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="text-[10px] font-black text-gold uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FileText size={12} /> Combat Dossier
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">
                        Rank Profile
                      </p>
                      <p className="text-sm font-black text-white">
                        {t.currentRank}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">
                        Peak Combat
                      </p>
                      <p className="text-sm font-black text-white">
                        {t.highestRank}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">
                        Primary Spec
                      </p>
                      <p className="text-sm font-black text-white">
                        {t.mainRole}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">
                        Combat Focus
                      </p>
                      <p className="text-sm font-black text-white">
                        {t.secondaryRole}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                      Tactical Assets
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {t.mainHeroes.map((h) => (
                        <div key={h} className="flex flex-col items-center">
                          <HeroIcon
                            heroName={h}
                            className="w-10 h-10 rounded-full border border-white/20 mb-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col h-full">
                  <div className="text-[10px] font-black text-gold uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Clock size={12} /> Operational Context
                  </div>

                  <div className="space-y-4 flex-1">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 h-32 overflow-y-auto">
                      <p className="text-[10px] font-black text-purple-light uppercase tracking-widest mb-2 italic">
                        Why join the front lines?
                      </p>
                      <p className="text-xs font-medium text-text-muted italic leading-relaxed">
                        "{t.reason}"
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Phone size={14} className="text-gold" />
                        <span className="text-[10px] font-black text-white">
                          {t.whatsapp}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock size={14} className="text-gold" />
                        <span className="text-[10px] font-black text-white">
                          {t.availability}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Admin Actions */}
                  {isAdmin && activeTab === "pending" && (
                    <div className="pt-6 mt-6 border-t border-white/5 flex gap-2">
                      <Button
                        variant="gold"
                        size="sm"
                        className="flex-1 font-black text-[10px]"
                        onClick={() => updateStatus(t.id, "Accepted")}
                      >
                        Deploy
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1 font-black text-[10px]"
                        onClick={() => updateStatus(t.id, "Trial")}
                      >
                        Trial
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        className="flex-1 font-black text-[10px]"
                        onClick={() => updateStatus(t.id, "Rejected")}
                      >
                        Deny
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}

        {displayList.length === 0 && (
          <div className="text-center py-24 bg-white/5 border border-dashed border-white/10 rounded-3xl flex flex-col items-center">
            <FileText
              size={64}
              className="mb-6 text-text-muted opacity-20"
              strokeWidth={1}
            />
            <h3 className="text-2xl font-black uppercase text-white mb-2 tracking-widest">
              No Intelligence Data
            </h3>
            <p className="text-text-muted max-w-xs font-medium">
              Archives are empty for this protocol level.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
