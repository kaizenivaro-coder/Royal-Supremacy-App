import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppStore } from "../data/store";
import { Card, PageHeader, Button, Input, Select, Label, Textarea } from "../components/ui";
import { ShieldAlert, LogIn, LogOut, Loader2, UserPlus, Swords, Bell, Database, Trash2, Send } from "lucide-react";
import { Announcement, Match, Member } from "../types";
import { getAdminTabFromSearch } from "../lib/appInsights";

export default function Admin() {
  const {
    isAdmin,
    setIsAdmin,
    members,
    setMembers,
    matches,
    setMatches,
    announcements,
    setAnnouncements,
    resetData
  } = useAppStore();

  const [searchParams, setSearchParams] = useSearchParams();
  const [simulating, setSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState(() =>
    getAdminTabFromSearch(window.location.search),
  );

  useEffect(() => {
    setActiveTab(getAdminTabFromSearch(`?${searchParams.toString()}`));
  }, [searchParams]);

  const selectTab = (tab: string) => {
    setActiveTab(tab);
    setSearchParams(tab === "general" ? {} : { tab });
  };

  const toggleAdmin = () => {
    setSimulating(true);
    setTimeout(() => {
      setIsAdmin(!isAdmin);
      setSimulating(false);
    }, 600);
  };

  const handleAddMember = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const newMember: Member = {
      id: `member-${Date.now()}`,
      playerName: formData.get("playerName") as string,
      mlbbId: formData.get("mlbbId") as string,
      serverId: formData.get("serverId") as string,
      mainRole: formData.get("mainRole") as string,
      secondaryRole: formData.get("secondaryRole") as string,
      mainHeroes: ["Chou"],
      currentRank: "Epic",
      highestRank: "Mythic",
      team: formData.get("team") as string,
      status: "Active",
      royalPoints: 0,
      attendanceRate: 0
    };

    setMembers([...members, newMember]);
    form.reset();
  };

  const handleLogMatch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const newMatch: Match = {
      id: `match-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      matchType: formData.get("matchType") as string,
      team: formData.get("team") as string,
      enemyTeam: formData.get("enemyTeam") as string,
      result: formData.get("result") as string,
      mvp: formData.get("mvp") as string,
      bestPerformer: "N/A",
      mainMistake: "N/A",
      notes: formData.get("notes") as string
    };

    setMatches([...matches, newMatch]);
    form.reset();
  };

  if (!isAdmin) {
    return (
      <Card className="max-w-md mx-auto mt-20 text-center p-8 border-gold/30 shadow-gold relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <ShieldAlert size={120} />
        </div>
        <ShieldAlert
          size={48}
          className="mx-auto text-gold mb-6 relative z-10"
        />
        <h2 className="text-2xl font-display font-black mb-2 relative z-10">
          RESTRICTED ACCESS
        </h2>
        <p className="text-text-muted mb-8 relative z-10 font-medium">
          Authorization required. You must be a Squad Leader to access the strategic command panel.
        </p>
        <Button
          onClick={toggleAdmin}
          disabled={simulating}
          className="w-full relative z-10 font-black uppercase tracking-widest h-12"
        >
          {simulating ? (
            <Loader2 className="animate-spin w-5 h-5 mx-auto" />
          ) : (
            <span className="flex items-center gap-2 justify-center">
              <LogIn size={18} /> Authenticate for Demo
            </span>
          )}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-8 pb-10 text-left">
      <PageHeader
        title="Command Panel"
        description="Strategic administration and squad configuration protocols."
      >
        <Button variant="danger" size="sm" onClick={toggleAdmin} className="font-black uppercase tracking-widest">
          <LogOut size={16} className="mr-2" /> Decouple
        </Button>
      </PageHeader>

      <div className="flex gap-4 border-b border-white/5 mb-6 overflow-x-auto pb-4">
        {[
          {id: "general", icon: Database, label: "Systems"},
          {id: "members", icon: UserPlus, label: "Personnel"},
          {id: "matches", icon: Swords, label: "Combat Log"},
          {id: "announcements", icon: Bell, label: "Broadcast"}
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => selectTab(tab.id)}
            className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-gold text-background shadow-gold"
                : "bg-surface border border-white/5 text-text-muted hover:text-white hover:border-gold/30"
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Sidebar / Forms area */}
        <div className="md:col-span-12 lg:col-span-5 space-y-6">
          {activeTab === "general" && (
            <Card className="border-danger/20 p-8">
              <h3 className="text-xl font-black mb-2 font-display uppercase tracking-widest text-danger">
                Critical Systems
              </h3>
              <p className="text-sm text-text-muted mb-6 font-medium leading-relaxed">
                Resetting the data core will purge all local tactical records and restore default squad configurations. This action is irreversible.
              </p>
              <Button variant="danger" className="w-full gap-2 font-black uppercase h-12" onClick={resetData}>
                <Trash2 size={18} /> Purge Data Core
              </Button>
            </Card>
          )}

          {activeTab === "members" && (
            <Card className="p-8">
              <h3 className="text-xl font-black mb-6 font-display uppercase tracking-widest text-gold flex items-center gap-2">
                <UserPlus size={20} /> Register Personnel
              </h3>
              <form className="space-y-6" onSubmit={handleAddMember}>
                <div className="space-y-2">
                   <Label>Combat Name</Label>
                   <Input name="playerName" required placeholder="NICKNAME..." className="uppercase font-black" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label>Standard Role</Label>
                      <Select name="mainRole">
                         <option>EXP Lane</option>
                         <option>Jungle</option>
                         <option>Mid Lane</option>
                         <option>Gold Lane</option>
                         <option>Roam</option>
                      </Select>
                   </div>
                   <div className="space-y-2">
                      <Label>Assigned Division</Label>
                      <Select name="team">
                         <option>Team Sovereign</option>
                         <option>Royal Valor</option>
                         <option>Academy</option>
                      </Select>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label>MLBB ID</Label>
                      <Input name="mlbbId" required placeholder="00000000" />
                   </div>
                   <div className="space-y-2">
                      <Label>Server</Label>
                      <Input name="serverId" required placeholder="0000" />
                   </div>
                </div>
                <Button className="w-full font-black uppercase tracking-widest h-12">Commit to Roster</Button>
              </form>
            </Card>
          )}

          {activeTab === "announcements" && (
            <Card className="p-8">
              <h3 className="text-xl font-black mb-6 font-display uppercase tracking-widest text-gold flex items-center gap-2">
                <Bell size={20} /> Dispatch Decree
              </h3>
              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const formData = new FormData(form);
                  
                  const newAnnouncement: Announcement = {
                    id: `ann_${Date.now()}`,
                    title: formData.get("title") as string,
                    message: formData.get("message") as string,
                    priority: formData.get("priority") as string,
                    postedBy: "Supreme Admin",
                    date: new Date().toISOString().split("T")[0],
                  };
                  setAnnouncements([...announcements, newAnnouncement]);
                  form.reset();
                }}
              >
                <div className="space-y-2">
                   <Label>Subject Line</Label>
                   <Input name="title" required placeholder="OPERATION UPDATE..." className="uppercase font-black" />
                </div>
                <div className="space-y-2">
                   <Label>Priority Protocol</Label>
                   <Select name="priority">
                      <option>Normal</option>
                      <option>Important</option>
                      <option>Urgent</option>
                   </Select>
                </div>
                <div className="space-y-2">
                   <Label>Mandatory Directive</Label>
                   <Textarea name="message" required rows={4} placeholder="ENTER COMMUNICATIONS..." className="font-medium" />
                </div>
                <Button className="w-full gap-2 font-black uppercase tracking-widest h-12">
                   <Send size={18} /> Execute Broadcast
                </Button>
              </form>
            </Card>
          )}

          {activeTab === "matches" && (
            <Card className="p-8">
              <h3 className="text-xl font-black mb-6 font-display uppercase tracking-widest text-gold flex items-center gap-2">
                <Swords size={20} /> Capture Battle Data
              </h3>
              <form className="space-y-6" onSubmit={handleLogMatch}>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label>Engagement Type</Label>
                       <Select name="matchType">
                          <option>Ranked Push</option>
                          <option>Scrim (Training)</option>
                          <option>Official Tournament</option>
                       </Select>
                    </div>
                    <div className="space-y-2">
                       <Label>Engagement Result</Label>
                       <Select name="result">
                          <option>Win</option>
                          <option>Loss</option>
                          <option>Cancelled</option>
                       </Select>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label>Our Division</Label>
                       <Select name="team">
                          {Array.from(new Set(members.map(m => m.team))).map(t => (
                            <option key={t}>{t}</option>
                          ))}
                       </Select>
                    </div>
                    <div className="space-y-2">
                       <Label>Enemy Objective</Label>
                       <Input name="enemyTeam" required placeholder="OPPOSITION NAME..." className="uppercase font-black" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label>MVP / Top Operator</Label>
                    <Select name="mvp">
                       {members.map(m => (
                         <option key={m.id}>{m.playerName}</option>
                       ))}
                    </Select>
                 </div>
                 <div className="space-y-2">
                    <Label>Tactical Observations</Label>
                    <Textarea name="notes" placeholder="ANALYSIS OF PERFORMANCE..." className="font-medium" rows={3} />
                 </div>
                 <Button className="w-full font-black uppercase tracking-widest h-14">Archive Report</Button>
              </form>
            </Card>
          )}
        </div>

        {/* Content area */}
        <div className="md:col-span-12 lg:col-span-7">
           <Card className="p-0 overflow-hidden border-white/5 h-full min-h-[600px] flex flex-col bg-surface-hover/20">
              <div className="p-6 border-b border-white/5 bg-surface/50">
                 <h4 className="text-xs font-black uppercase tracking-[0.3em] text-text-muted">Live Command Feed</h4>
              </div>
              <div className="flex-1 p-8 flex items-center justify-center text-center">
                 <div className="max-w-xs space-y-4 opacity-30">
                    <ShieldAlert size={80} className="mx-auto text-gold" strokeWidth={1} />
                    <p className="text-lg font-black uppercase tracking-tight text-white leading-tight">
                       Tactical Management Subsystem
                    </p>
                    <p className="text-xs font-medium text-text-muted">
                       Authorized operators can modify the squad's data core via the protocols on the left. Changes are synchronized across all devices in real-time.
                    </p>
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
