import { createClient } from "@supabase/supabase-js";

const viteEnv = (import.meta.env ?? {}) as Partial<ImportMetaEnv>;
const supabaseUrl = viteEnv.VITE_SUPABASE_URL ?? "";
const supabaseKey =
  viteEnv.VITE_SUPABASE_PUBLISHABLE_KEY ??
  viteEnv.VITE_SUPABASE_ANON_KEY ??
  "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
