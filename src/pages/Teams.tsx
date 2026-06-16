import { useMemo, useState } from "react";
import { Shield, UserCircle, Users, X } from "lucide-react";
import { useAppStore } from "../data/store";
import { Badge, Card, PageHeader } from "../components/ui";
import { getActiveMembers, groupMembersByTeam } from "../lib/mvpApp";
import type { Member } from "../types";

export default function Teams() {
  const { members, teams } = useAppStore();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const activeMembers = useMemo(() => getActiveMembers(members), [members]);
  const activeTeams = useMemo(
    () => teams.filter((team) => !team.archivedAt),
    [teams],
  );
  const groupedMembers = useMemo(
    () => groupMembersByTeam(activeMembers, activeTeams),
    [activeMembers, activeTeams],
  );

  return (
    <div className="space-y-8 pb-10 text-left">
      <PageHeader
        title="Teams"
        description="One roster, five MVP groups. Admin Portal controls assignments."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        {activeTeams.map((team) => {
          const teamMembers = groupedMembers[team.name] ?? [];

          return (
            <Card key={team.id} className="flex min-h-64 flex-col p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg border border-gold/25 bg-gold/10 text-gold">
                    <Shield size={18} />
                  </div>
                  <h2 className="text-base font-black uppercase leading-tight text-white">
                    {team.name}
                  </h2>
                </div>
                <Badge variant={team.name === "Unassigned" ? "gold" : "purple"}>
                  {teamMembers.length}
                </Badge>
              </div>

              <div className="mt-auto space-y-2">
                {teamMembers.length > 0 ? (
                  teamMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => setSelectedMember(member)}
                      className="flex w-full items-center gap-3 rounded-lg border border-blue-200/10 bg-background/45 p-3 text-left transition hover:border-gold/30 hover:bg-surface-hover"
                    >
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
                          @{member.username} / {member.mainRole}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-blue-200/10 bg-background/35 p-4 text-center">
                    <Users className="mx-auto mb-2 h-5 w-5 text-text-muted/50" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                      No members assigned
                    </p>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {selectedMember && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-lg border border-gold/20 bg-surface p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-lg border border-gold/30 bg-gold/10 text-gold">
                  {selectedMember.profileImageSrc ? (
                    <img
                      src={selectedMember.profileImageSrc}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserCircle size={24} />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase text-white">
                    {selectedMember.playerName}
                  </h3>
                  <p className="text-xs font-bold text-gold">@{selectedMember.username}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="grid h-9 w-9 place-items-center rounded-lg border border-blue-200/10 text-text-muted transition hover:border-gold/30 hover:text-white"
                aria-label="Close player details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                ["Team", selectedMember.team],
                ["Status", selectedMember.status],
                ["Current Rank", selectedMember.currentRank],
                ["Highest Rank", selectedMember.highestRank],
                ["MLBB ID", selectedMember.mlbbId],
                ["Server", selectedMember.serverId],
                ["Primary Role", selectedMember.mainRole],
                ["Secondary Role", selectedMember.secondaryRole],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-blue-200/10 bg-background/50 p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">
                    {label}
                  </p>
                  <p className="mt-1 truncate text-sm font-black text-white">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-blue-200/10 bg-background/50 p-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">
                Signature Heroes
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedMember.mainHeroes.map((hero) => (
                  <Badge key={hero} variant="purple">
                    {hero}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
