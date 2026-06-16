import type {
  Announcement,
  Member,
  Notification,
  RankHistory,
  RpTransaction,
  Season,
  Team,
  Tryout,
} from "../types";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

export const SUPABASE_APP_STATE_ID = "royal-supremacy";

export type RemoteAppState = {
  members: Member[];
  announcements: Announcement[];
  tryouts: Tryout[];
  notifications: Notification[];
  squadLogoSrc: string;
  seasons: Season[];
  teams: Team[];
  rpTransactions: RpTransaction[];
  rankHistory: RankHistory[];
};

export function normalizeRemoteAppState(value: unknown): RemoteAppState | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as Partial<RemoteAppState>;
  if (!Array.isArray(data.members)) {
    return null;
  }

  return {
    members: data.members,
    announcements: Array.isArray(data.announcements) ? data.announcements : [],
    tryouts: Array.isArray(data.tryouts) ? data.tryouts : [],
    notifications: Array.isArray(data.notifications) ? data.notifications : [],
    squadLogoSrc: typeof data.squadLogoSrc === "string" ? data.squadLogoSrc : "",
    seasons: Array.isArray(data.seasons) ? data.seasons : [],
    teams: Array.isArray(data.teams) ? data.teams : [],
    rpTransactions: Array.isArray(data.rpTransactions) ? data.rpTransactions : [],
    rankHistory: Array.isArray(data.rankHistory) ? data.rankHistory : [],
  };
}

export async function loadRemoteAppState() {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("mvp_app_state")
    .select("data")
    .eq("id", SUPABASE_APP_STATE_ID)
    .maybeSingle();

  if (error) {
    console.warn("Supabase app state load failed", error.message);
    return null;
  }

  return normalizeRemoteAppState(data?.data);
}

export async function saveRemoteAppState(state: RemoteAppState) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const { error } = await supabase.from("mvp_app_state").upsert({
    id: SUPABASE_APP_STATE_ID,
    data: state,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.warn("Supabase app state save failed", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
