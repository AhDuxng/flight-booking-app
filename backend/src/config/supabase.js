import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

const clientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
};

export const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, clientOptions);

export const supabaseRead =
  env.supabaseReadUrl && env.supabaseReadServiceRoleKey
    ? createClient(env.supabaseReadUrl, env.supabaseReadServiceRoleKey, clientOptions)
    : supabase;
