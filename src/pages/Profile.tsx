import React, { useState, useEffect } from "react";
import { useAppStore } from "../data/store";
import {
  Card,
  PageHeader,
  Button,
  Input,
  Select,
  Label,
  Badge,
} from "../components/ui";
import { User, Shield, Gamepad2, Globe, Save } from "lucide-react";
import { Member } from "../types";
import { cn } from "../lib/utils";
import { HeroIcon } from "../components/HeroIcon";

// Assuming "member_001" is our current logged-in user for this demo
const CURRENT_USER_ID = "member_001";

export default function Profile() {
  const { members, setMembers } = useAppStore();
  const [userProfile, setUserProfile] = useState<Member | undefined>(undefined);
  const [formData, setFormData] = useState<Partial<Member>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const profile = members.find((m) => m.id === CURRENT_USER_ID);
    if (profile) {
      setUserProfile(profile);
      setFormData(profile);
    }
  }, [members]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Auto format the prefix requirement (King / Queen)
    if (
      !value.toLowerCase().startsWith("king ") &&
      !value.toLowerCase().startsWith("queen ") &&
      value.length > 0
    ) {
      // If they type a clear title, swap it, else default to King
      if (value.toLowerCase().startsWith("king")) {
        value = "King " + value.substring(4).trim();
      } else if (value.toLowerCase().startsWith("queen")) {
        value = "Queen " + value.substring(5).trim();
      } else {
        value = "King " + value;
      }
    }

    setFormData((prev) => ({ ...prev, playerName: value }));
  };

  const handleHeroesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const heroesArray = e.target.value
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean);
    setFormData((prev) => ({ ...prev, mainHeroes: heroesArray }));
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      if (userProfile && formData.playerName) {
        // Enforce the prefix one final time before saving
        let finalName = formData.playerName;
        if (
          !finalName.toLowerCase().startsWith("king ") &&
          !finalName.toLowerCase().startsWith("queen ")
        ) {
          finalName = "King " + finalName;
        }

        const updatedMembers = members.map((m) =>
          m.id === CURRENT_USER_ID
            ? ({ ...m, ...formData, playerName: finalName } as Member)
            : m,
        );

        setMembers(updatedMembers);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
      setIsSaving(false);
    }, 600);
  };

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted">
        Loading profile data...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 text-left">
      <PageHeader
        title="Operator Profile"
        description="Manage your combat identity, preferred assets, and regional identifiers."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card Summary */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-8 border-gold/20 flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-gold to-purple-royal" />
            <div className="w-24 h-24 rounded-2xl bg-surface-hover border border-white/10 flex items-center justify-center text-4xl font-black text-white mb-6 shadow-xl relative z-10 group-hover:border-gold/50 transition-colors">
              {formData.playerName?.substring(0, 1).toUpperCase() || "?"}
            </div>
            <h2 className="text-2xl font-display font-black text-white uppercase tracking-tight mb-2">
              {formData.playerName}
            </h2>
            <div className="text-[10px] font-black text-gold uppercase tracking-[0.2em] mb-4">
              {formData.mlbbId} ({formData.serverId})
            </div>

            <div className="flex gap-2 mb-6">
              <Badge variant="purple" className="px-3">
                {formData.team}
              </Badge>
              <Badge variant="success" className="px-3">
                {formData.status}
              </Badge>
            </div>

            <div className="w-full grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
              <div className="text-center">
                <p className="text-[10px] font-black uppercase text-text-muted tracking-widest mb-1">
                  Rank
                </p>
                <p className="font-black text-white text-sm">
                  {formData.currentRank}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase text-text-muted tracking-widest mb-1">
                  Peak
                </p>
                <p className="font-black text-purple-light text-sm">
                  {formData.highestRank}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-white/5 space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="text-gold w-5 h-5" />
              <span className="font-black uppercase tracking-widest text-xs text-white">
                Royal Credits
              </span>
            </div>
            <div className="text-4xl font-black text-white">
              {userProfile.royalPoints}
            </div>
            <p className="text-[10px] uppercase font-bold text-text-muted tracking-widest">
              Awarded for combat excellence
            </p>
          </Card>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          <Card className="p-8 border-white/5 relative overflow-hidden">
            <h3 className="text-xl font-black mb-6 font-display uppercase tracking-widest text-gold flex items-center gap-2">
              <User className="w-5 h-5" /> Identity Configuration
            </h3>

            <form onSubmit={handleSave} className="space-y-6">
              {showSuccess && (
                <div className="p-4 rounded-lg bg-success/10 border border-success/30 text-success text-xs font-black uppercase tracking-widest flex items-center justify-center">
                  Profile settings updated successfully
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label>Operator Handle (Must begin with King or Queen)</Label>
                  <Input
                    name="playerName"
                    value={formData.playerName || ""}
                    onChange={handleNameChange}
                    required
                    className="uppercase font-black text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label>MLBB ID</Label>
                  <Input
                    name="mlbbId"
                    value={formData.mlbbId || ""}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Server / Zone ID</Label>
                  <Input
                    name="serverId"
                    value={formData.serverId || ""}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                <div className="space-y-2">
                  <Label>Primary Tactical Role</Label>
                  <Select
                    name="mainRole"
                    value={formData.mainRole || ""}
                    onChange={handleInputChange}
                  >
                    <option>Gold Lane</option>
                    <option>EXP Lane</option>
                    <option>Mid Lane</option>
                    <option>Jungle</option>
                    <option>Roam</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Secondary Flex Role</Label>
                  <Select
                    name="secondaryRole"
                    value={formData.secondaryRole || ""}
                    onChange={handleInputChange}
                  >
                    <option>Gold Lane</option>
                    <option>EXP Lane</option>
                    <option>Mid Lane</option>
                    <option>Jungle</option>
                    <option>Roam</option>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-white/5">
                <Label>Signature Heroes (Comma separated)</Label>
                <Input
                  name="mainHeroes"
                  value={formData.mainHeroes?.join(", ") || ""}
                  onChange={handleHeroesChange}
                  placeholder="Chou, Paquito, Benedetta..."
                />
                <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase mt-1">
                  Used for internal tactical drafting
                </p>
                {formData.mainHeroes && formData.mainHeroes.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-4">
                    {formData.mainHeroes.map((hero) => (
                      <div
                        key={hero}
                        className="flex flex-col items-center gap-2"
                      >
                        <HeroIcon
                          heroName={hero}
                          className="w-12 h-12 rounded-full border-2 border-white/10"
                        />
                        <span className="text-[9px] font-black uppercase text-text-muted">
                          {hero}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-white/5 flex gap-4">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 font-black uppercase tracking-widest h-14 gap-2"
                >
                  {isSaving ? "Synchronizing..." : "Save Configuration"}
                  <Save size={18} />
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
