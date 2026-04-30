import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const url = typeof rawUrl === 'string' ? rawUrl.trim() : '';
const key = typeof rawKey === 'string' ? rawKey.trim() : '';

/** Só cria o client com URL e chave válidas; evita createClient('') que quebra o bundle inteiro. */
export const isSupabaseConfigured = Boolean(url && key);

if (!isSupabaseConfigured) {
  console.warn(
    '[finCash] Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (Vercel: Environment Variables + Redeploy).'
  );
}

export const supabase = isSupabaseConfigured ? createClient(url, key) : null;
