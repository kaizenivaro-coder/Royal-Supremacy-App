import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Bell,
  Database,
  Image,
  LockKeyhole,
  LogOut,
  Send,
  ShieldAlert,
  Trash2,
  Upload,
  UserPlus,
} from "lucide-react";
import { useAppStore } from "../data/store";
import {
  Button,
  Card,
  Input,
  Label,
  PageHeader,
  Select,
  Textarea,
} from "../components/ui";
import type { Announcement, Member } from "../types";
import { getAdminTabFromSearch } from "../lib/appInsights";
import { TEAM_GROUPS, validateAdminPortalPassword } from "../lib/mvpApp";
import { normalizeUsername } from "../lib/localAuth";
import { validateLocalImageUpload } from "../lib/imageUploads";
import { SquadLogoPlaceholder } from "../components/SquadLogoPlaceholder";

const tabs = [
  { id: "general", icon: Database, label: "Systems" },
  { id: "members", icon: UserPlus, label: "Members & Teams" },
  { id: "announcements", icon: Bell, label: "Announcements" },
];

export default function Admin() {
  const {
    isAdmin,
    setIsAdmin,
    members,
    setMembers,
    assignMemberTeam,
    announcements,
    setAnnouncements,
    squadLogoSrc,
    setSquadLogoSrc,
    resetData,
  } = useAppStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() =>
    getAdminTabFromSearch(window.location.search),
  );
  const [password, setPassword] = useState("");
  const [accessError, setAccessError] = useState("");
  const [memberError, setMemberError] = useState("");
  const [assignmentMessage, setAssignmentMessage] = useState("");
  const [logoError, setLogoError] = useState("");

  useEffect(() => {
    setActiveTab(getAdminTabFromSearch(`?${searchParams.toString()}`));
  }, [searchParams]);

  const selectTab = (tab: string) => {
    setActiveTab(tab);
    setSearchParams(tab === "general" ? {} : { tab });
  };

  const unlockPortal = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateAdminPortalPassword(password)) {
      setAccessError("Admin Portal password is incorrect.");
      return;
    }

    setIsAdmin(true);
    setAccessError("");
    setPassword("");
  };

  const handleAddMember = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMemberError("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const username = normalizeUsername(formData.get("username") as string);

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      setMemberError("Usernames must use 3-20 lowercase letters, numbers, or underscores.");
      return;
    }

    if (members.some((member) => member.username === username)) {
      setMemberError("That username already exists in the roster.");
      return;
    }

    const newMember: Member = {
      id: `member_${Date.now()}`,
      username,
      playerName: (formData.get("playerName") as string).trim(),
      mlbbId: (formData.get("mlbbId") as string).trim(),
      serverId: (formData.get("serverId") as string).trim(),
      mainRole: formData.get("mainRole") as string,
      secondaryRole: formData.get("secondaryRole") as string,
      mainHeroes: ((formData.get("mainHeroes") as string) || "Chou")
        .split(",")
        .map((hero) => hero.trim())
        .filter(Boolean),
      currentRank: (formData.get("currentRank") as string).trim() || "Epic",
      highestRank: (formData.get("highestRank") as string).trim() || "Mythic",
      team: formData.get("team") as string,
      status: "Active",
      bannerId: "chou-stun",
    };

    setMembers([...members, newMember]);
    form.reset();
  };

  const handleAssignment = (memberId: string, teamName: string) => {
    const result = assignMemberTeam(memberId, teamName);
    setAssignmentMessage(result.ok ? "Team assignment updated." : result.error ?? "Assignment failed.");
  };

  const handleAnnouncement = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const newAnnouncement: Announcement = {
      id: `ann_${Date.now()}`,
      title: formData.get("title") as string,
      message: formData.get("message") as string,
      priority: formData.get("priority") as string,
      postedBy: "Admin Portal",
      date: new Date().toISOString().split("T")[0],
    };

    setAnnouncements([...announcements, newAnnouncement]);
    form.reset();
  };

  const handleSquadLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateLocalImageUpload(file);
    if (validationError) {
      setLogoError(validationError);
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        setSquadLogoSrc(reader.result);
        setLogoError("");
      }
    });
    reader.readAsDataURL(file);
  };

  if (!isAdmin) {
    return (
      <Card className="mx-auto mt-16 max-w-md p-8 text-center">
        <ShieldAlert size={48} className="mx-auto mb-6 text-gold" />
        <h1 className="font-display text-2xl font-black uppercase text-white">
          Admin Portal
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-text-muted">
          Enter the local MVP password to unlock roster assignment and admin tools.
        </p>
        <form className="mt-8 space-y-4" onSubmit={unlockPortal}>
          <div className="space-y-2 text-left">
            <Label>Portal Password</Label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/75" />
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="pl-11"
              />
            </div>
          </div>
          {accessError && (
            <div className="rounded-lg border border-danger/25 bg-danger/10 p-3 text-xs font-black uppercase tracking-widest text-danger">
              {accessError}
            </div>
          )}
          <Button variant="gold" className="w-full gap-2">
            <LockKeyhole size={16} />
            Unlock Admin Portal
          </Button>
        </form>
      </Card>
    );
  }

  return (
    <div className="space-y-8 pb-10 text-left">
      <PageHeader
        title="Admin Portal"
        description="Local MVP controls for roster assignment and squad broadcasts."
      >
        <Button
          variant="danger"
          size="sm"
          onClick={() => setIsAdmin(false)}
          className="gap-2"
        >
          <LogOut size={16} />
          Lock Portal
        </Button>
      </PageHeader>

      <div className="flex gap-3 overflow-x-auto border-b border-white/5 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => selectTab(tab.id)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-xs font-black uppercase tracking-widest transition ${
              activeTab === tab.id
                ? "bg-gold text-background shadow-gold"
                : "border border-blue-200/10 bg-surface text-text-muted hover:border-gold/30 hover:text-white"
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "general" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <SquadLogoPlaceholder src={squadLogoSrc} className="h-20 w-20 shrink-0" />
              <div className="min-w-0 flex-1">
                <h2 className="flex items-center gap-2 font-display text-xl font-black uppercase text-white">
                  <Image size={20} className="text-gold" />
                  Squad Logo
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-text-muted">
                  Upload the Royal Supremacy squad mark used in the sidebar and mobile header.
                </p>
                {logoError && (
                  <div className="mt-3 rounded-lg border border-danger/25 bg-danger/10 p-3 text-xs font-black uppercase tracking-widest text-danger">
                    {logoError}
                  </div>
                )}
                <div className="mt-5 flex flex-wrap gap-3">
                  <label
                    htmlFor="squad-logo-upload"
                    className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gold/40 bg-gold px-5 text-sm font-black uppercase tracking-wider text-background shadow-lg shadow-gold/25 transition hover:bg-white"
                    style={{
                      clipPath:
                        "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
                    }}
                  >
                    <Upload size={16} />
                    Upload Logo
                  </label>
                  <input
                    id="squad-logo-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="sr-only"
                    onChange={handleSquadLogoUpload}
                  />
                  {squadLogoSrc && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setSquadLogoSrc("")}
                    >
                      Clear Logo
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-xl font-black uppercase text-white">
              MVP Data Core
            </h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-text-muted">
              Reset local roster, announcements, tryouts, and notifications while
              preserving the current auth account.
            </p>
            <Button variant="danger" className="mt-6 gap-2" onClick={resetData}>
              <Trash2 size={18} />
              Reset MVP Data
            </Button>
          </Card>
          <Card className="p-6">
            <h2 className="font-display text-xl font-black uppercase text-white">
              Current Scope
            </h2>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-blue-200/10 bg-background/50 p-4">
                <p className="text-2xl font-black text-white">{members.length}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                  Members
                </p>
              </div>
              <div className="rounded-lg border border-blue-200/10 bg-background/50 p-4">
                <p className="text-2xl font-black text-white">{announcements.length}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                  Posts
                </p>
              </div>
              <div className="rounded-lg border border-blue-200/10 bg-background/50 p-4">
                <p className="text-2xl font-black text-white">{TEAM_GROUPS.length}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                  Teams
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "members" && (
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[420px_1fr]">
          <Card className="p-6">
            <h2 className="mb-6 flex items-center gap-2 font-display text-xl font-black uppercase tracking-widest text-gold">
              <UserPlus size={20} />
              Register Member
            </h2>
            <form className="space-y-5" onSubmit={handleAddMember}>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input name="username" required autoCapitalize="none" spellCheck={false} />
              </div>
              <div className="space-y-2">
                <Label>Player Name</Label>
                <Input name="playerName" required className="font-black uppercase" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>MLBB ID</Label>
                  <Input name="mlbbId" required />
                </div>
                <div className="space-y-2">
                  <Label>Server</Label>
                  <Input name="serverId" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Current Rank</Label>
                  <Input name="currentRank" />
                </div>
                <div className="space-y-2">
                  <Label>Highest Rank</Label>
                  <Input name="highestRank" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Main Role</Label>
                  <Select name="mainRole">
                    <option>EXP Lane</option>
                    <option>Jungle</option>
                    <option>Mid Lane</option>
                    <option>Gold Lane</option>
                    <option>Roam</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Secondary Role</Label>
                  <Select name="secondaryRole">
                    <option>Roam</option>
                    <option>EXP Lane</option>
                    <option>Jungle</option>
                    <option>Mid Lane</option>
                    <option>Gold Lane</option>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assigned Team</Label>
                <Select name="team">
                  {TEAM_GROUPS.map((team) => (
                    <option key={team}>{team}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Main Heroes</Label>
                <Input name="mainHeroes" />
              </div>
              {memberError && (
                <div className="rounded-lg border border-danger/25 bg-danger/10 p-3 text-xs font-black uppercase tracking-widest text-danger">
                  {memberError}
                </div>
              )}
              <Button variant="gold" className="w-full">
                Commit Member
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="font-display text-xl font-black uppercase text-white">
                Team Assignment
              </h2>
              {assignmentMessage && (
                <span className="text-[10px] font-black uppercase tracking-widest text-gold">
                  {assignmentMessage}
                </span>
              )}
            </div>
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="grid gap-3 rounded-lg border border-blue-200/10 bg-background/45 p-4 md:grid-cols-[1fr_240px]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black uppercase text-white">
                      {member.playerName}
                    </p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                      @{member.username} / {member.currentRank}
                    </p>
                  </div>
                  <Select
                    value={member.team}
                    onChange={(event) => handleAssignment(member.id, event.target.value)}
                  >
                    {TEAM_GROUPS.map((team) => (
                      <option key={team}>{team}</option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "announcements" && (
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[420px_1fr]">
          <Card className="p-6">
            <h2 className="mb-6 flex items-center gap-2 font-display text-xl font-black uppercase tracking-widest text-gold">
              <Bell size={20} />
              Broadcast
            </h2>
            <form className="space-y-5" onSubmit={handleAnnouncement}>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input name="title" required className="font-black uppercase" />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select name="priority">
                  <option>Normal</option>
                  <option>Important</option>
                  <option>Urgent</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea name="message" required rows={5} />
              </div>
              <Button variant="gold" className="w-full gap-2">
                <Send size={18} />
                Send Announcement
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <h2 className="mb-5 font-display text-xl font-black uppercase text-white">
              Recent Announcements
            </h2>
            <div className="space-y-3">
              {announcements
                .slice()
                .reverse()
                .slice(0, 6)
                .map((announcement) => (
                  <div
                    key={announcement.id}
                    className="rounded-lg border border-blue-200/10 bg-background/45 p-4"
                  >
                    <p className="text-sm font-black uppercase text-white">
                      {announcement.title}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-text-muted">
                      {announcement.date} / {announcement.priority}
                    </p>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
