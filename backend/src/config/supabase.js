import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Khởi tạo Supabase client sử dụng Service Role Key để thực hiện thao tác DB phía Backend
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export default supabase;
