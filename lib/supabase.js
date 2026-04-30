import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const url = typeof rawUrl === 'string' ? rawUrl.trim() : '';
const key = typeof rawKey === 'string' ? rawKey.trim() : '';

export const isSupabaseConfigured = Boolean(url && key);

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.warn(
    '[finCash] Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (Vercel: Environment Variables + Redeploy).'
  );
}

export const supabase = isSupabaseConfigured ? createClient(url, key) : null;
