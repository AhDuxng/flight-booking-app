import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

const clientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
};

export const supabase = createClient(
  env.supabaseUrl,
  env.supabaseServiceRoleKey,
  clientOptions
);