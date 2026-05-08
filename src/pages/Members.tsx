import { useState } from "react";
import { useAppStore } from "../data/store";
import { Card, PageHeader, Badge, Input, Select, Button } from "../components/ui";
import { Search, SlidersHorizontal, Shield, Trophy, Activity, Target, X } from "lucide-react";
import { HeroIcon } from "../components/HeroIcon";
import { filterMembers, uniqueMemberValues } from "../lib/appInsights";

export default function Members() {
  const { members } = useAppStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [teamFilter, setTeamFilter] = useState("All");

  const roles = uniqueMemberValues(members, (member) => [
    member.mainRole,
    member.secondaryRole,
  ]);
  const statuses = uniqueMemberValues(members, (member) => member.status);
  const teams = uniqueMemberValues(members, (member) => member.team);
  const filteredMembers = filterMembers(members, {
    query: searchTerm,
    role: roleFilter,
    status: statusFilter,
    team: teamFilter,
  });
  const activeFilters = [roleFilter, statusFilter, teamFilter].filter(
    (value) => value !== "All",
  ).length;
  const resetFilters = () => {
    setSearchTerm("");
    setRoleFilter("All");
    setStatusFilter("All");
    setTeamFilter("All");
  };

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title="Royal Roster"
        description="Elite specialized operators of Royal Supremacy."
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5 group-focus-within:text-gold transition-colors" />
          <Input
            placeholder="Search roster..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12"
          />
        </div>
        <button
          onClick={() => setFiltersOpen((open) => !open)}
          className="flex items-center justify-center gap-2 bg-surface border border-white/10 rounded-xl px-5 h-12 text-text-white hover:bg-surface-hover hover:border-gold/30 transition shadow-lg"
        >
          <SlidersHorizontal size={18} className="text-gold" />
          <span className="font-bold text-sm uppercase tracking-widest">
            Filters{activeFilters > 0 ? ` (${activeFilters})` : ""}
          </span>
        </button>
        </div>

        {filtersOpen && (
          <Card className="p-4 grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-4 gap-3 items-end">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1.5 block">
                Role
              </label>
              <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option>All</option>
                {roles.map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1.5 block">
                Status
              </label>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option>All</option>
                {statuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1.5 block">
                Team
              </label>
              <Select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
                <option>All</option>
                {teams.map((team) => (
                  <option key={team}>{team}</option>
                ))}
              </Select>
            </div>
            <Button
              variant="ghost"
              onClick={resetFilters}
              className="gap-2 h-11"
              disabled={!searchTerm && activeFilters === 0}
            >
              <X size={16} />
              Reset
            </Button>
          </Card>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-text-muted">
          <span>
            Showing <span className="text-gold">{filteredMembers.length}</span> of{" "}
            {members.length} operators
          </span>
          {(searchTerm || activeFilters > 0) && (
            <span className="uppercase tracking-widest">
              Search and filters active
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredMembers.map((member) => (
          <Card
            key={member.id}
            className="group relative overflow-hidden p-0 flex flex-col hover:-translate-y-1 transition-all duration-300 border-white/5 hover:border-gold/30"
          >
            {/* Card Header Background */}
            <div className="h-24 bg-gradient-to-br from-purple-royal/20 via-surface to-background relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,var(--color-purple-royal),transparent_70%)] opacity-30" />
              <div className="absolute top-4 right-4">
                <Badge
                  variant={
                    member.status === "Active"
                      ? "success"
                      : member.status === "Inactive"
                        ? "default"
                        : member.status === "Trial"
                          ? "warning"
                          : "danger"
                  }
                >
                  {member.status}
                </Badge>
              </div>
            </div>

            <div className="px-6 -mt-12 pb-6 flex-1 flex flex-col relative z-10">
              {/* Avatar & Basic Info */}
              <div className="flex items-end gap-4 mb-6">
                <div className="w-24 h-24 rounded-2xl bg-surface border-4 border-background shadow-2xl flex items-center justify-center text-3xl font-black text-gold overflow-hidden relative group-hover:scale-105 transition-transform">
                  {member.playerName.substring(0, 2).toUpperCase()}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                </div>
                <div className="mb-2">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-1 group-hover:gold-gradient-text transition-all">
                    {member.playerName}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                    <Shield size={12} className="text-purple-light" />
                    {member.team}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col items-center text-center">
                  <Activity size={14} className="text-purple-light mb-1" />
                  <span className="text-[10px] font-bold text-text-muted uppercase">
                    Role
                  </span>
                  <span className="text-xs font-black text-white truncate w-full">
                    {member.mainRole}
                  </span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col items-center text-center">
                  <Target size={14} className="text-gold mb-1" />
                  <span className="text-[10px] font-bold text-text-muted uppercase">
                    Rank
                  </span>
                  <span className="text-xs font-black text-white truncate w-full leading-tight">
                    {member.currentRank}
                  </span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col items-center text-center">
                  <Trophy size={14} className="text-success mb-1" />
                  <span className="text-[10px] font-bold text-text-muted uppercase">
                    Win Rate
                  </span>
                  <span className="text-xs font-black text-white">82%</span>
                </div>
              </div>

              {/* Heroes */}
              <div className="mb-6">
                <div className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <div className="h-px flex-1 bg-white/5" />
                  Specialties
                  <div className="h-px flex-1 bg-white/5" />
                </div>
                <div className="flex gap-2 flex-wrap justify-center">
                  {member.mainHeroes.map((hero) => (
                    <div key={hero} className="flex flex-col items-center">
                      <HeroIcon
                        heroName={hero}
                        className="w-10 h-10 rounded-full border border-white/20 mb-1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-white/5 flex justify-between items-center mt-auto">
                <div>
                  <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-0.5">
                    Royal Points
                  </div>
                  <div className="font-display font-black text-2xl text-gold drop-shadow-gold">
                    {member.royalPoints}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-0.5">
                    Attendance
                  </div>
                  <div className="font-black text-white text-lg">
                    {member.attendanceRate}%
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <Card className="p-20 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-text-muted mb-4 border border-white/10">
            <Search size={40} strokeWidth={1} />
          </div>
          <h3 className="text-2xl font-black uppercase text-white mb-2">
            No Operators Found
          </h3>
          <p className="text-text-muted max-w-sm font-medium">
            We couldn't find any member matching your encryption keys. Try a
            different query.
          </p>
        </Card>
      )}
    </div>
  );
}
