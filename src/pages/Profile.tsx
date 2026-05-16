import React, { useEffect, useState } from "react";
import { Image, KeyRound, Mail, Save, User } from "lucide-react";
import { useAppStore } from "../data/store";
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
  PageHeader,
  Select,
} from "../components/ui";
import type { Member } from "../types";
import { PROFILE_BANNERS, getProfileBanner } from "../lib/mvpApp";
import { HeroIcon } from "../components/HeroIcon";

export default function Profile() {
  const { members, setMembers, authUser, connectEmail, changePassword } =
    useAppStore();
  const userProfile =
    members.find((member) => member.username === authUser?.username) ?? members[0];
  const [formData, setFormData] = useState<Partial<Member>>(userProfile ?? {});
  const [accountEmail, setAccountEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [accountError, setAccountError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setFormData(userProfile ?? {});
  }, [userProfile]);

  useEffect(() => {
    setAccountEmail(authUser?.email ?? "");
  }, [authUser?.email]);

  const selectedBanner = getProfileBanner(formData.bannerId);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleHeroesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const heroesArray = event.target.value
      .split(",")
      .map((hero) => hero.trim())
      .filter(Boolean);
    setFormData((previous) => ({ ...previous, mainHeroes: heroesArray }));
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userProfile) return;

    setIsSaving(true);
    setAccountError("");

    const nextEmail = accountEmail.trim();
    const currentEmail = authUser?.email ?? "";

    if (nextEmail && nextEmail !== currentEmail) {
      const result = await connectEmail(nextEmail);
      if (!result.ok) {
        setAccountError(result.error ?? "Could not connect email.");
        setIsSaving(false);
        return;
      }
    }

    if (newPassword) {
      const result = await changePassword(newPassword);
      if (!result.ok) {
        setAccountError(result.error ?? "Could not update password.");
        setIsSaving(false);
        return;
      }
      setNewPassword("");
    }

    const updatedMembers = members.map((member) =>
      member.id === userProfile.id ? ({ ...member, ...formData } as Member) : member,
    );

    setMembers(updatedMembers);
    setShowSuccess(true);
    setIsSaving(false);
    window.setTimeout(() => setShowSuccess(false), 3000);
  };

  if (!userProfile) {
    return (
      <div className="flex h-64 items-center justify-center text-text-muted">
        Loading profile data...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 text-left">
      <PageHeader
        title="My Profile"
        description="Manage your squad identity, account access, and profile banner."
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card className="overflow-hidden p-0">
            <div
              className="h-36 border-b border-blue-200/10"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(3,7,18,0.12), rgba(3,7,18,0.86)), url(${selectedBanner.src})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
              }}
            />
            <div className="p-6 text-center">
              <div className="mx-auto -mt-14 grid h-24 w-24 place-items-center rounded-lg border border-gold/30 bg-background text-4xl font-black text-white shadow-2xl">
                {formData.playerName?.substring(0, 1).toUpperCase() || "?"}
              </div>
              <h2 className="mt-5 text-2xl font-black uppercase text-white">
                {formData.playerName}
              </h2>
              <p className="mt-1 text-xs font-black text-gold">
                @{formData.username}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Badge variant="purple">{formData.team}</Badge>
                <Badge variant="success">{formData.status}</Badge>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/5 pt-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    Rank
                  </p>
                  <p className="mt-1 text-sm font-black text-white">
                    {formData.currentRank}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    Peak
                  </p>
                  <p className="mt-1 text-sm font-black text-purple-light">
                    {formData.highestRank}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <Image className="h-5 w-5 text-gold" />
              <h3 className="text-xs font-black uppercase tracking-widest text-white">
                Profile Banner
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {PROFILE_BANNERS.map((banner) => (
                <button
                  key={banner.id}
                  type="button"
                  onClick={() =>
                    setFormData((previous) => ({ ...previous, bannerId: banner.id }))
                  }
                  className={`overflow-hidden rounded-lg border text-left transition ${
                    formData.bannerId === banner.id
                      ? "border-gold shadow-gold"
                      : "border-blue-200/10 hover:border-gold/35"
                  }`}
                >
                  <img src={banner.src} alt="" className="h-16 w-full object-cover" />
                  <div className="p-2 text-[9px] font-black uppercase tracking-widest text-white">
                    {banner.name}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="p-6 md:p-8">
            <h3 className="mb-6 flex items-center gap-2 font-display text-xl font-black uppercase tracking-widest text-gold">
              <User className="h-5 w-5" />
              Identity Configuration
            </h3>

            <form onSubmit={handleSave} className="space-y-6">
              {showSuccess && (
                <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-center text-xs font-black uppercase tracking-widest text-success">
                  Profile settings updated
                </div>
              )}
              {accountError && (
                <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-center text-xs font-black uppercase tracking-widest text-danger">
                  {accountError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 border-b border-white/5 pb-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Royal Account Username</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/75" />
                    <Input
                      value={authUser?.username ?? ""}
                      readOnly
                      autoCapitalize="none"
                      spellCheck={false}
                      className="pl-11 font-black lowercase text-gold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Connected Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/75" />
                    <Input
                      type="email"
                      value={accountEmail}
                      onChange={(event) => setAccountEmail(event.target.value)}
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      className="pl-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>New Password</Label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/75" />
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      autoComplete="new-password"
                      className="pl-11"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Operator Handle</Label>
                  <Input
                    name="playerName"
                    value={formData.playerName || ""}
                    onChange={handleInputChange}
                    required
                    className="font-black uppercase"
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

              <div className="space-y-4 border-t border-white/5 pt-6">
                <Label>Signature Heroes (Comma separated)</Label>
                <Input
                  name="mainHeroes"
                  value={formData.mainHeroes?.join(", ") || ""}
                  onChange={handleHeroesChange}
                />
                {formData.mainHeroes && formData.mainHeroes.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {formData.mainHeroes.map((hero) => (
                      <div key={hero} className="flex flex-col items-center gap-2">
                        <HeroIcon
                          heroName={hero}
                          className="h-12 w-12 rounded-full border-2 border-white/10"
                        />
                        <span className="text-[9px] font-black uppercase text-text-muted">
                          {hero}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-white/5 pt-6">
                <Button
                  type="submit"
                  variant="gold"
                  disabled={isSaving}
                  className="h-14 w-full gap-2 font-black uppercase tracking-widest"
                >
                  {isSaving ? "Saving..." : "Save Profile"}
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
