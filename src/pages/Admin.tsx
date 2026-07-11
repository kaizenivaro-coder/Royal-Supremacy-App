import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Crown,
  Database,
  Gem,
  GripVertical,
  Image,
  LockKeyhole,
  LogOut,
  Send,
  ShieldAlert,
  Trash2,
  Trophy,
  Upload,
  UserPlus,
  XCircle,
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
import type { Announcement, Member, RankHistory, RankStatus, RpSourceType } from "../types";
import { getAdminTabFromSearch } from "../lib/appInsights";
import {
  DEFAULT_TEAM,
  groupMembersByTeam,
  softDeleteAnnouncement,
  validateAdminPortalPassword,
} from "../lib/mvpApp";
import { normalizeUsername } from "../lib/localAuth";
import { validateLocalImageUpload } from "../lib/imageUploads";
import { SquadLogoPlaceholder } from "../components/SquadLogoPlaceholder";
import {
  RANK_STATUS_OPTIONS,
  RP_SOURCE_OPTIONS,
  getLatestRankHistoryByMember,
  getMythicStarScore,
  isMythicStarRank,
} from "../lib/leaderboard";
import { ACTIVE_SEASON } from "../data/leaderboardSeed";
import { MainHeroPickerDialog } from "./Profile";
import { getTeamDropTarget, type TeamDropZone } from "../lib/teamDrag";
import { cn } from "../lib/utils";

const tabs = [
  { id: "general", icon: Database, label: "Systems" },
  { id: "members", icon: UserPlus, label: "Members & Teams" },
  { id: "rank-command", icon: Crown, label: "Rank Command" },
  { id: "leaderboard", icon: Trophy, label: "RP Command" },
  { id: "announcements", icon: Bell, label: "Announcements" },
];

type CurrentRankMap = Map<string, Pick<RankHistory, "rankStatus" | "stars">>;

type RankDraft = {
  memberId: string;
  rankStatus: RankStatus;
  stars: number;
};

type AnnouncementDraftImage = {
  src: string;
  name: string;
};

type AdminTeamDragState = {
  member: Member;
  pointerId: number;
  currentX: number;
  currentY: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
};

type AdminLockedGateProps = {
  password: string;
  accessError: string;
  onPasswordChange: (password: string) => void;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
};

export function AdminLockedGate({
  password,
  accessError,
  onPasswordChange,
  onSubmit,
}: AdminLockedGateProps) {
  return (
    <Card className="mx-auto mt-16 max-w-md p-8 text-center">
      <ShieldAlert size={48} className="mx-auto mb-6 text-gold" />
      <h1 className="font-display text-2xl font-black uppercase text-white">
        Admin Portal
      </h1>
      <p className="mt-3 text-sm font-semibold leading-6 text-text-muted">
        Enter the local MVP password to unlock roster assignment and admin tools.
      </p>
      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2 text-left">
          <Label htmlFor="admin-portal-password">Portal Password</Label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/75" />
            <Input
              id="admin-portal-password"
              name="adminPassword"
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              autoComplete="current-password"
              aria-label="Admin Portal password"
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

type UpdateMythicRanksModalProps = {
  isOpen: boolean;
  members: Member[];
  currentRanks: CurrentRankMap;
  onClose: () => void;
  onSave: (updates: RankDraft[]) => void;
};

function AdminDragMemberIdentity({ member }: { member: Member }) {
  return (
    <>
      <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-blue-200/10 bg-surface text-xs font-black uppercase text-gold">
        {member.profileImageSrc ? (
          <img
            src={member.profileImageSrc}
            alt="Profile"
            className="h-full w-full object-cover"
          />
        ) : (
          member.username.slice(0, 1)
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-white">
          {member.playerName}
        </p>
        <p className="truncate text-[10px] font-bold uppercase tracking-widest text-text-muted">
          @{member.username} / {member.currentRank}
        </p>
      </div>
    </>
  );
}

function createRankDrafts(members: Member[], currentRanks: CurrentRankMap) {
  return Object.fromEntries(
    members.map((member) => {
      const currentRank = currentRanks.get(member.id);
      return [
        member.id,
        {
          rankStatus: (currentRank?.rankStatus ?? member.currentRank ?? "Unranked") as RankStatus,
          stars: currentRank?.stars ?? 0,
        },
      ];
    }),
  ) as Record<string, { rankStatus: RankStatus; stars: number }>;
}

export function UpdateMythicRanksModal({
  isOpen,
  members,
  currentRanks,
  onClose,
  onSave,
}: UpdateMythicRanksModalProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(isOpen);
  const [drafts, setDrafts] = useState(() => createRankDrafts(members, currentRanks));

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setDrafts(createRankDrafts(members, currentRanks));
      const frame = window.requestAnimationFrame(() => setIsVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }

    setIsVisible(false);
    const timeout = window.setTimeout(() => setShouldRender(false), 220);
    return () => window.clearTimeout(timeout);
  }, [currentRanks, isOpen, members]);

  useEffect(() => {
    if (!shouldRender) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, shouldRender]);

  if (!shouldRender) return null;

  const updateRank = (memberId: string, rankStatus: RankStatus) => {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [memberId]: {
        rankStatus,
        stars: isMythicStarRank(rankStatus) ? currentDrafts[memberId]?.stars ?? 0 : 0,
      },
    }));
  };

  const updateStars = (memberId: string, stars: number) => {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [memberId]: {
        ...(currentDrafts[memberId] ?? { rankStatus: "Unranked" as RankStatus }),
        stars: Number.isFinite(stars) ? Math.max(0, Math.floor(stars)) : 0,
      },
    }));
  };

  const saveDrafts = () => {
    onSave(
      members.map((member) => ({
        memberId: member.id,
        rankStatus: drafts[member.id]?.rankStatus ?? "Unranked",
        stars: drafts[member.id]?.stars ?? 0,
      })),
    );
  };

  return (
    <div
      className={`fixed inset-0 z-[90] flex items-center justify-center bg-black/72 px-3 py-5 backdrop-blur-sm transition-opacity duration-200 ease-in-out ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Update Squad Ranks"
    >
      <div
        className={`flex h-[82vh] w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-lg border border-blue-200/20 bg-surface shadow-2xl transition-all duration-200 ease-in-out md:h-[70vh] md:w-[70vw] ${
          isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-95 opacity-0"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-gold/60"
              aria-label="Close update mythic ranks"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-black uppercase tracking-widest text-gold">
                Update Squad Ranks
              </h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                Stars count only for Mythic and above
              </p>
            </div>
          </div>
          <Crown className="hidden h-7 w-7 text-gold sm:block" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 md:p-5">
          <div className="space-y-3">
            {members.map((member) => {
              const draft = drafts[member.id] ?? {
                rankStatus: "Unranked" as RankStatus,
                stars: 0,
              };
              const showStars = isMythicStarRank(draft.rankStatus);

              return (
                <div
                  key={member.id}
                  className="grid gap-3 rounded-lg border border-blue-200/10 bg-background/55 p-3 md:grid-cols-[1fr_220px_150px]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black uppercase text-white">
                      {member.playerName}
                    </p>
                    <p className="mt-1 truncate text-[10px] font-black uppercase tracking-widest text-text-muted">
                      @{member.username}
                    </p>
                  </div>
                  <Select
                    value={draft.rankStatus}
                    onChange={(event) =>
                      updateRank(member.id, event.target.value as RankStatus)
                    }
                    aria-label={`${member.playerName} rank`}
                  >
                    {RANK_STATUS_OPTIONS.map((rank) => (
                      <option key={rank}>{rank}</option>
                    ))}
                  </Select>
                  {showStars ? (
                    <Input
                      type="number"
                      min={0}
                      value={draft.stars}
                      onChange={(event) =>
                        updateStars(member.id, Number(event.target.value))
                      }
                      aria-label={`${member.playerName} stars`}
                    />
                  ) : (
                    <div className="flex h-11 items-center rounded-lg border border-blue-200/10 bg-black/20 px-4 text-xs font-black uppercase tracking-widest text-text-muted">
                      0 Stars
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="shrink-0 border-t border-white/10 p-4 text-center">
          <Button type="button" variant="gold" className="mx-auto min-w-56 gap-2" onClick={saveDrafts}>
            <Crown size={18} />
            Save Rank Updates
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const {
    isAdmin,
    setIsAdmin,
    members,
    setMembers,
    assignMemberTeam,
    teams,
    createTeam,
    archiveTeam,
    archiveMember,
    announcements,
    setAnnouncements,
    squadLogoSrc,
    setSquadLogoSrc,
    seasons,
    rpTransactions,
    rankHistory,
    setRankHistory,
    pendingAccountRequests,
    approveAccountRequest,
    rejectAccountRequest,
    updateMythicRanks,
    addRpTransaction,
    resetSeason,
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
  const [announcementImage, setAnnouncementImage] =
    useState<AnnouncementDraftImage | null>(null);
  const [announcementImageError, setAnnouncementImageError] = useState("");
  const [isRankModalOpen, setIsRankModalOpen] = useState(false);
  const [isRegisterHeroPickerOpen, setIsRegisterHeroPickerOpen] = useState(false);
  const [registrationHeroes, setRegistrationHeroes] = useState<string[]>([]);
  const [registerCurrentRank, setRegisterCurrentRank] = useState<RankStatus>("Epic");
  const [registerHighestRank, setRegisterHighestRank] = useState<RankStatus>("Epic");
  const [leaderboardMessage, setLeaderboardMessage] = useState("");
  const [rankCommandMessage, setRankCommandMessage] = useState("");
  const [rpTransactionError, setRpTransactionError] = useState("");
  const [teamMessage, setTeamMessage] = useState("");
  const [accountRequestMessage, setAccountRequestMessage] = useState("");
  const [teamDragState, setTeamDragState] = useState<AdminTeamDragState | null>(null);
  const [teamDropTarget, setTeamDropTarget] = useState<string | null>(null);
  const teamDropRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const activeSeasonId = seasons.find((season) => season.isActive)?.id ?? ACTIVE_SEASON.id;
  const activeSeason = seasons.find((season) => season.id === activeSeasonId) ?? ACTIVE_SEASON;
  const activeMembers = members.filter((member) => member.lifecycleStatus !== "Archived");
  const archivedMembers = members.filter((member) => member.lifecycleStatus === "Archived");
  const activeTeams = teams.filter((team) => !team.archivedAt);
  const adminTeamGroups = groupMembersByTeam(activeMembers, activeTeams);
  const activeAnnouncements = announcements
    .filter((announcement) => !announcement.deletedAt)
    .sort((first, second) => {
      const dateDelta =
        new Date(second.date).getTime() - new Date(first.date).getTime();
      return dateDelta || second.id.localeCompare(first.id);
    });
  const currentRanks = getLatestRankHistoryByMember(rankHistory, activeSeasonId);

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

    const currentRank = (formData.get("currentRank") as RankStatus) || "Epic";
    const highestRank = (formData.get("highestRank") as RankStatus) || currentRank;
    const rankStars = getMythicStarScore(
      currentRank,
      Number(formData.get("rankStars") ?? 0),
    );
    const now = new Date();
    const memberId = `member_${now.getTime()}`;
    const newMember: Member = {
      id: memberId,
      username,
      playerName: (formData.get("playerName") as string).trim(),
      mlbbId: (formData.get("mlbbId") as string).trim(),
      serverId: (formData.get("serverId") as string).trim(),
      mainRole: formData.get("mainRole") as string,
      secondaryRole: formData.get("secondaryRole") as string,
      mainHeroes: registrationHeroes,
      currentRank,
      highestRank,
      team: formData.get("team") as string,
      status: "Active",
      lifecycleStatus: "Active",
      bannerId: "chou-stun",
    };

    setMembers([...members, newMember]);
    setRankHistory([
      ...rankHistory,
      {
        id: `rank_initial_${memberId}_${now.getTime()}`,
        seasonId: activeSeasonId,
        memberId,
        rankStatus: currentRank,
        stars: rankStars,
        recordedAt: now.toISOString(),
        createdAt: now.toISOString(),
      },
    ]);
    setRegistrationHeroes([]);
    setRegisterCurrentRank("Epic");
    setRegisterHighestRank("Epic");
    form.reset();
  };

  const handleAssignment = (memberId: string, teamName: string) => {
    const result = assignMemberTeam(memberId, teamName);
    setAssignmentMessage(result.ok ? "Team assignment updated." : result.error ?? "Assignment failed.");
  };

  const getAdminTeamDropZones = (): TeamDropZone[] =>
    activeTeams.flatMap((team) => {
      const node = teamDropRefs.current[team.name];
      if (!node) return [];

      const rect = node.getBoundingClientRect();
      return [
        {
          teamName: team.name,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
        },
      ];
    });

  const beginTeamDrag = (
    event: React.PointerEvent<HTMLButtonElement>,
    member: Member,
  ) => {
    if (event.button !== 0) return;

    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    setAssignmentMessage("");
    setTeamDragState({
      member,
      pointerId: event.pointerId,
      currentX: event.clientX,
      currentY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    });
    setTeamDropTarget(null);
  };

  const updateTeamDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!teamDragState || teamDragState.pointerId !== event.pointerId) return;

    event.preventDefault();
    setTeamDragState({
      ...teamDragState,
      currentX: event.clientX,
      currentY: event.clientY,
    });
    setTeamDropTarget(
      getTeamDropTarget(getAdminTeamDropZones(), {
        x: event.clientX,
        y: event.clientY,
      }),
    );
  };

  const finishTeamDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!teamDragState || teamDragState.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const targetTeam = getTeamDropTarget(getAdminTeamDropZones(), {
      x: event.clientX,
      y: event.clientY,
    });

    if (targetTeam && targetTeam !== teamDragState.member.team) {
      const result = assignMemberTeam(teamDragState.member.id, targetTeam);
      setAssignmentMessage(
        result.ok
          ? `${teamDragState.member.playerName} moved to ${targetTeam}.`
          : result.error ?? "Assignment failed.",
      );
    }

    setTeamDragState(null);
    setTeamDropTarget(null);
  };

  const cancelTeamDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!teamDragState || teamDragState.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setTeamDragState(null);
    setTeamDropTarget(null);
  };

  const handleCreateTeam = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const result = createTeam(formData.get("teamName") as string);
    setTeamMessage(result.ok ? "Team created." : result.error ?? "Could not create team.");
    if (result.ok) form.reset();
  };

  const handleArchiveTeam = (teamId: string) => {
    const team = activeTeams.find((entry) => entry.id === teamId);
    const confirmed = window.confirm(
      `Delete ${team?.name ?? "this team"}? Members assigned to it will move to Unassigned.`,
    );
    if (!confirmed) return;

    const result = archiveTeam(teamId);
    setTeamMessage(
      result.ok
        ? "Team deleted. Members moved to Unassigned."
        : result.error ?? "Could not delete team.",
    );
  };

  const handleArchiveMember = (memberId: string, playerName: string) => {
    const confirmed = window.confirm(`Archive ${playerName} and remove them from active squad views?`);
    if (!confirmed) return;

    const result = archiveMember(memberId, "Left squad");
    setAssignmentMessage(
      result.ok ? "Member archived." : result.error ?? "Could not archive member.",
    );
  };

  const handleApproveAccountRequest = (requestId: string, username: string) => {
    const result = approveAccountRequest(requestId);
    setAccountRequestMessage(
      result.ok
        ? `${username} can now log in.`
        : result.error ?? "Could not approve account.",
    );
  };

  const handleRejectAccountRequest = (requestId: string, username: string) => {
    const result = rejectAccountRequest(requestId);
    setAccountRequestMessage(
      result.ok
        ? `${username} request rejected.`
        : result.error ?? "Could not reject account.",
    );
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
      postedBy: "Royal Supremacy",
      date: new Date().toISOString().split("T")[0],
      imageSrc: announcementImage?.src,
      imageName: announcementImage?.name,
      likedBy: [],
      savedBy: [],
      comments: [],
    };

    setAnnouncements([...announcements, newAnnouncement]);
    setAnnouncementImage(null);
    setAnnouncementImageError("");
    form.reset();
  };

  const handleAnnouncementImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateLocalImageUpload(file);
    if (validationError) {
      setAnnouncementImageError(validationError);
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        setAnnouncementImage({ src: reader.result, name: file.name });
        setAnnouncementImageError("");
      }
    });
    reader.readAsDataURL(file);
  };

  const handleDeleteAnnouncement = (announcementId: string) => {
    const confirmed = window.confirm(
      "Delete this announcement from the active feed? Saved users can still see their saved copy until they unsave it.",
    );
    if (!confirmed) return;

    const result = softDeleteAnnouncement(announcements, announcementId, isAdmin);
    if (result.ok) {
      setAnnouncements(result.announcements);
    }
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

  const handleRankUpdates = (updates: RankDraft[]) => {
    const result = updateMythicRanks(updates);
    setRankCommandMessage(
      result.ok ? "Squad ranks and star history updated." : result.error ?? "Rank update failed.",
    );

    if (result.ok) {
      setIsRankModalOpen(false);
    }
  };

  const handleSeasonReset = () => {
    const confirmed = window.confirm(
      `Reset ${activeSeason.name}? Old season data will be preserved and active members will start the next season at Epic.`,
    );
    if (!confirmed) return;

    const result = resetSeason();
    setRankCommandMessage(
      result.ok ? "Season reset complete. New active season created." : result.error ?? "Season reset failed.",
    );
  };

  const handleRpTransaction = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRpTransactionError("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const result = addRpTransaction({
      memberId: formData.get("memberId") as string,
      sourceType: formData.get("sourceType") as RpSourceType,
      amount: Number(formData.get("amount")),
      description: formData.get("description") as string,
    });

    if (!result.ok) {
      setRpTransactionError(result.error ?? "Could not save RP transaction.");
      return;
    }

    setLeaderboardMessage("RP transaction saved.");
    form.reset();
  };

  if (!isAdmin) {
    return (
      <AdminLockedGate
        password={password}
        accessError={accessError}
        onPasswordChange={setPassword}
        onSubmit={unlockPortal}
      />
    );
  }

  return (
    <div className="space-y-8 pb-10 text-left">
      <UpdateMythicRanksModal
        isOpen={isRankModalOpen}
        members={activeMembers}
        currentRanks={currentRanks}
        onClose={() => setIsRankModalOpen(false)}
        onSave={handleRankUpdates}
      />
      <MainHeroPickerDialog
        isOpen={isRegisterHeroPickerOpen}
        selectedHeroes={registrationHeroes}
        onClose={() => setIsRegisterHeroPickerOpen(false)}
        onSave={(heroes) => {
          setRegistrationHeroes(heroes);
          setIsRegisterHeroPickerOpen(false);
        }}
      />
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

      <div className="max-w-full min-w-0 overflow-x-auto border-b border-white/5 pb-4">
        <div className="flex w-max max-w-none gap-3">
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
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 font-display text-xl font-black uppercase text-white">
                  <UserPlus size={20} className="text-gold" />
                  Account Requests
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-text-muted">
                  Approve new signup requests before they can enter the app.
                </p>
              </div>
              <span className="rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gold">
                {pendingAccountRequests.length} pending
              </span>
            </div>
            {accountRequestMessage && (
              <div className="mb-4 rounded-lg border border-gold/25 bg-gold/10 p-3 text-xs font-black uppercase tracking-widest text-gold">
                {accountRequestMessage}
              </div>
            )}
            <div className="space-y-3">
              {pendingAccountRequests.length > 0 ? (
                pendingAccountRequests.map((request) => (
                  <div
                    key={request.id}
                    className="grid gap-3 rounded-lg border border-blue-200/10 bg-background/45 p-4 sm:grid-cols-[1fr_auto]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-white">
                        @{request.username}
                      </p>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-text-muted">
                        Requested {new Date(request.requestedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="gold"
                        size="sm"
                        className="gap-2"
                        onClick={() => handleApproveAccountRequest(request.id, request.username)}
                      >
                        <CheckCircle2 size={14} />
                        Approve
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        className="gap-2"
                        onClick={() => handleRejectAccountRequest(request.id, request.username)}
                      >
                        <XCircle size={14} />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-blue-200/10 bg-background/35 p-5 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    No account requests waiting
                  </p>
                </div>
              )}
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
            <Button
              variant="danger"
              className="mt-6 gap-2"
              onClick={() => {
                const confirmed = window.confirm(
                  "Reset local MVP data? This restores seeded roster, announcements, tryouts, teams, RP, and rank history.",
                );
                if (confirmed) resetData();
              }}
            >
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
                <p className="text-2xl font-black text-white">{activeTeams.length}</p>
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
                  <Select
                    name="currentRank"
                    value={registerCurrentRank}
                    onChange={(event) =>
                      setRegisterCurrentRank(event.target.value as RankStatus)
                    }
                  >
                    {RANK_STATUS_OPTIONS.map((rank) => (
                      <option key={rank}>{rank}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Highest Rank</Label>
                  <Select
                    name="highestRank"
                    value={registerHighestRank}
                    onChange={(event) =>
                      setRegisterHighestRank(event.target.value as RankStatus)
                    }
                  >
                    {RANK_STATUS_OPTIONS.map((rank) => (
                      <option key={rank}>{rank}</option>
                    ))}
                  </Select>
                </div>
              </div>
              {isMythicStarRank(registerCurrentRank) && (
                <div className="space-y-2">
                  <Label>Starting Stars</Label>
                  <Input name="rankStars" type="number" min={0} defaultValue={0} />
                </div>
              )}
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
                  {activeTeams.map((team) => (
                    <option key={team.id}>{team.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Main Heroes</Label>
                <button
                  type="button"
                  onClick={() => setIsRegisterHeroPickerOpen(true)}
                  className="block w-full rounded-lg border border-blue-200/10 bg-background/45 p-4 text-left transition hover:border-gold/35 focus:outline-none focus:ring-2 focus:ring-gold/60"
                >
                  <span className="text-sm font-black uppercase text-white">
                    {registrationHeroes.length
                      ? `${registrationHeroes.length} selected`
                      : "Choose main heroes"}
                  </span>
                  {registrationHeroes.length > 0 && (
                    <span className="mt-2 block truncate text-xs font-bold text-text-muted">
                      {registrationHeroes.join(", ")}
                    </span>
                  )}
                </button>
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

          <Card className="order-first p-6 xl:col-span-2">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-black uppercase text-white">
                  Drag Team Assignment
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-text-muted">
                  Drag a member card into the desired team. This control only appears
                  inside the Admin Portal.
                </p>
              </div>
              {assignmentMessage && (
                <span className="rounded-lg border border-gold/25 bg-gold/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gold">
                  {assignmentMessage}
                </span>
              )}
            </div>

            <div className="grid min-w-0 gap-4 lg:grid-cols-2 xl:grid-cols-5">
              {activeTeams.map((team) => {
                const teamMembers = adminTeamGroups[team.name] ?? [];

                return (
                  <div
                    key={team.id}
                    ref={(node) => {
                      teamDropRefs.current[team.name] = node;
                    }}
                    className={cn(
                      "flex min-h-64 min-w-0 max-w-full flex-col rounded-lg border border-blue-200/10 bg-background/45 p-4 transition-all duration-200",
                      teamDropTarget === team.name &&
                        "border-gold/60 bg-surface-hover/80 shadow-gold ring-2 ring-gold/40",
                    )}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg border border-gold/25 bg-gold/10 text-gold">
                          <UserPlus size={18} />
                        </div>
                        <h3 className="text-sm font-black uppercase leading-tight text-white">
                          {team.name}
                        </h3>
                      </div>
                      <span className="rounded-full border border-blue-200/15 px-3 py-1 text-[10px] font-black text-gold">
                        {teamMembers.length}
                      </span>
                    </div>

                    <div className="mt-auto space-y-2">
                      {teamMembers.length > 0 ? (
                        teamMembers.map((member) => {
                          const isDragging = teamDragState?.member.id === member.id;

                          return (
                            <button
                              key={member.id}
                              type="button"
                              onPointerDown={(event) => beginTeamDrag(event, member)}
                              onPointerMove={updateTeamDrag}
                              onPointerUp={finishTeamDrag}
                              onPointerCancel={cancelTeamDrag}
                              className={cn(
                                "flex w-full cursor-grab touch-none items-center gap-3 rounded-lg border border-blue-200/10 bg-surface/70 p-3 text-left transition hover:border-gold/35 hover:bg-surface-hover active:cursor-grabbing",
                                isDragging && "scale-[0.99] opacity-35",
                              )}
                              aria-label={`Drag ${member.playerName} to a team in Admin Portal`}
                            >
                              <GripVertical className="h-4 w-4 shrink-0 text-text-muted" />
                              <AdminDragMemberIdentity member={member} />
                            </button>
                          );
                        })
                      ) : (
                        <div className="rounded-lg border border-dashed border-blue-200/10 bg-background/35 p-4 text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                            No members assigned
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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
              {activeMembers.map((member) => (
                <div
                  key={member.id}
                  className="grid gap-3 rounded-lg border border-blue-200/10 bg-background/45 p-4 md:grid-cols-[1fr_220px_120px]"
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
                    {activeTeams.map((team) => (
                      <option key={team.id}>{team.name}</option>
                    ))}
                  </Select>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => handleArchiveMember(member.id, member.playerName)}
                  >
                    Archive
                  </Button>
                </div>
              ))}
            </div>
            {archivedMembers.length > 0 && (
              <div className="mt-6 rounded-lg border border-blue-200/10 bg-background/35 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                  Archived Members
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {archivedMembers.map((member) => member.playerName).join(", ")}
                </p>
              </div>
            )}
          </Card>

          {teamDragState && (
            <div
              className="pointer-events-none fixed z-[120] flex items-center gap-3 rounded-lg border border-gold/45 bg-background/95 p-3 text-left shadow-[0_24px_70px_rgba(0,0,0,0.55),0_0_24px_rgba(242,196,83,0.18)]"
              style={{
                left: teamDragState.currentX - teamDragState.offsetX,
                top: teamDragState.currentY - teamDragState.offsetY,
                width: teamDragState.width,
                minHeight: teamDragState.height,
              }}
            >
              <GripVertical className="h-4 w-4 shrink-0 text-gold" />
              <AdminDragMemberIdentity member={teamDragState.member} />
            </div>
          )}

          <Card className="p-6 xl:col-span-2">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-black uppercase text-white">
                  Team Management
                </h2>
                <p className="mt-2 text-sm font-semibold text-text-muted">
                  Create future squads and delete empty or inactive teams.
                </p>
              </div>
              {teamMessage && (
                <span className="text-[10px] font-black uppercase tracking-widest text-gold">
                  {teamMessage}
                </span>
              )}
            </div>
            <form className="grid gap-3 md:grid-cols-[1fr_180px]" onSubmit={handleCreateTeam}>
              <Input name="teamName" aria-label="New team name" />
              <Button type="submit" variant="gold">
                Create Team
              </Button>
            </form>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {activeTeams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-blue-200/10 bg-background/45 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black uppercase text-white">
                      {team.name}
                    </p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-text-muted">
                      {members.filter((member) => member.team === team.name).length} members
                    </p>
                  </div>
                  {team.name !== DEFAULT_TEAM && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => handleArchiveTeam(team.id)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "rank-command" && (
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[420px_1fr]">
          <Card className="p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 font-display text-xl font-black uppercase tracking-widest text-gold">
                  <Crown size={20} />
                  Rank Command
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-text-muted">
                  Save daily squad ranks and preserve history by MLBB season.
                </p>
              </div>
            </div>
            {(leaderboardMessage || rankCommandMessage) && (
              <div className="mb-5 rounded-lg border border-gold/25 bg-gold/10 p-3 text-xs font-black uppercase tracking-widest text-gold">
                {rankCommandMessage || leaderboardMessage}
              </div>
            )}
            <div className="grid gap-3">
              <Button
                type="button"
                variant="gold"
                className="w-full gap-2"
                onClick={() => setIsRankModalOpen(true)}
              >
                <Crown size={18} />
                Update Squad Ranks
              </Button>
              <div className="rounded-lg border border-blue-200/10 bg-background/45 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                  Rank Records
                </p>
                <p className="mt-1 text-2xl font-black text-white">{rankHistory.length}</p>
              </div>
              <div className="rounded-lg border border-blue-200/10 bg-background/45 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                  Active Season
                </p>
                <p className="mt-1 text-xl font-black text-white">{activeSeason.name}</p>
              </div>
              <Button
                type="button"
                variant="danger"
                className="w-full gap-2"
                onClick={handleSeasonReset}
              >
                <Trash2 size={18} />
                Reset Season
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-xl font-black uppercase text-white">
              Season Archive
            </h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-text-muted">
              Old seasons remain stored locally. Profile charts and admin history can select
              previous seasons after resets.
            </p>
            <div className="mt-5 space-y-3">
              {seasons.map((season) => (
                <div
                  key={season.id}
                  className="rounded-lg border border-blue-200/10 bg-background/45 p-4"
                >
                  <p className="text-sm font-black uppercase text-white">{season.name}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-text-muted">
                    {season.isActive ? "Active" : `Closed ${season.endDate ?? ""}`}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "leaderboard" && (
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[420px_1fr]">
          <Card className="p-6">
            <h2 className="mb-6 flex items-center gap-2 font-display text-xl font-black uppercase tracking-widest text-gold">
              <Gem size={20} />
              Add RP Gain / Loss
            </h2>
            <form className="space-y-5" onSubmit={handleRpTransaction}>
              <div className="space-y-2">
                <Label>Member</Label>
                <Select name="memberId" required defaultValue={activeMembers[0]?.id}>
                  {activeMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.playerName}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>RP Source</Label>
                  <Select name="sourceType" required defaultValue="Manual Adjustments">
                    {RP_SOURCE_OPTIONS.map((source) => (
                      <option key={source}>{source}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input name="amount" type="number" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea name="description" rows={3} />
              </div>
              {rpTransactionError && (
                <div className="rounded-lg border border-danger/25 bg-danger/10 p-3 text-xs font-black uppercase tracking-widest text-danger">
                  {rpTransactionError}
                </div>
              )}
              <Button variant="gold" className="w-full gap-2">
                <Gem size={18} />
                Save RP Transaction
              </Button>
            </form>
          </Card>

          <Card className="p-6 xl:col-span-2">
            <h2 className="font-display text-xl font-black uppercase text-white">
              Royal Points Sources
            </h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-text-muted">
              Source management is staged for the next MVP step. Current transactions already support Royal FunFest, Customs, Supreme Titles, Active Points, Mythic Stars, Manual Adjustments, and new member starting average.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-blue-200/10 bg-background/45 p-4">
                <p className="text-2xl font-black text-white">{rpTransactions.length}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                  RP Transactions
                </p>
              </div>
              <div className="rounded-lg border border-blue-200/10 bg-background/45 p-4">
                <p className="text-2xl font-black text-white">{activeMembers.length}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                  Members
                </p>
              </div>
              <div className="rounded-lg border border-blue-200/10 bg-background/45 p-4">
                <p className="truncate text-lg font-black text-white">
                  {seasons.find((season) => season.id === activeSeasonId)?.name ?? "MVP"}
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                  Active Season
                </p>
              </div>
              <div className="rounded-lg border border-blue-200/10 bg-background/45 p-4">
                <p className="text-2xl font-black text-white">Local</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                  Storage Mode
                </p>
              </div>
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
              <div className="space-y-3">
                <Label>Announcement Image</Label>
                <label
                  htmlFor="adminAnnouncementImage"
                  className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-blue-200/20 bg-background/45 p-4 text-center transition hover:border-gold/40 hover:bg-background/70"
                >
                  {announcementImage ? (
                    <img
                      src={announcementImage.src}
                      alt={announcementImage.name}
                      className="max-h-48 w-full rounded-lg object-cover"
                    />
                  ) : (
                    <>
                      <Image size={28} className="mb-3 text-gold" />
                      <span className="text-xs font-black uppercase tracking-widest text-white">
                        Upload feed image
                      </span>
                      <span className="mt-1 text-xs font-semibold text-text-muted">
                        PNG, JPG, WebP, or GIF under 2 MB
                      </span>
                    </>
                  )}
                </label>
                <input
                  id="adminAnnouncementImage"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="sr-only"
                  onChange={handleAnnouncementImageUpload}
                />
                {announcementImage && (
                  <button
                    type="button"
                    onClick={() => setAnnouncementImage(null)}
                    className="text-[10px] font-black uppercase tracking-widest text-text-muted transition hover:text-danger"
                  >
                    Remove selected image
                  </button>
                )}
                {announcementImageError && (
                  <div className="rounded-lg border border-danger/25 bg-danger/10 p-3 text-xs font-black uppercase tracking-widest text-danger">
                    {announcementImageError}
                  </div>
                )}
              </div>
              <Button variant="gold" className="w-full gap-2">
                <Send size={18} />
                Send Announcement
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <h2 className="mb-5 font-display text-xl font-black uppercase text-white">
              Active Announcements
            </h2>
            <div className="space-y-3">
              {activeAnnouncements
                .slice(0, 6)
                .map((announcement) => (
                  <div
                    key={announcement.id}
                    className="grid gap-3 rounded-lg border border-blue-200/10 bg-background/45 p-4 sm:grid-cols-[72px_1fr_auto]"
                  >
                    <div className="h-16 w-full overflow-hidden rounded-lg border border-blue-200/10 bg-black sm:w-[72px]">
                      {announcement.imageSrc ? (
                        <img
                          src={announcement.imageSrc}
                          alt={announcement.imageName || announcement.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-gold">
                          <Image size={20} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black uppercase text-white">
                        {announcement.title}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-text-muted">
                        {announcement.date} / {announcement.priority}
                      </p>
                      <p className="mt-2 line-clamp-2 text-xs font-medium leading-5 text-text-muted">
                        {announcement.message}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      className="gap-2 self-start"
                      onClick={() => handleDeleteAnnouncement(announcement.id)}
                    >
                      <Trash2 size={14} />
                      Delete
                    </Button>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
