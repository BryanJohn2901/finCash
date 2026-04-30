import { createClient } from '@supabase/supabase-js';

function stripQuotes(s) {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1).trim();
  }
  return t;
}

/** Aceita Project URL completa ou só o host (ex. xxx.supabase.co). */
function normalizeSupabaseUrl(raw) {
  if (typeof raw !== 'string') return '';
  let t = stripQuotes(raw.replace(/\uFEFF/g, ''));
  if (!t) return '';
  if (/^https?:\/\//i.test(t)) return t.replace(/\/+$/, '');
  if (/\.supabase\.co/i.test(t)) {
    const host = t.replace(/^\/+/, '').replace(/\/+$/, '');
    return `https://${host}`;
  }
  return t;
}

function isValidHttpUrl(s) {
  if (!s) return false;
  try {
    const u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    return Boolean(u.hostname?.trim());
  } catch {
    return false;
  }
}

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const url = normalizeSupabaseUrl(typeof rawUrl === 'string' ? rawUrl : '');
const key = typeof rawKey === 'string' ? stripQuotes(rawKey) : '';

const urlOk = isValidHttpUrl(url);
export const isSupabaseConfigured = Boolean(urlOk && key);

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.warn(
    '[finCash] Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (Vercel: Environment Variables + Redeploy).'
  );
}

export const supabase = isSupabaseConfigured ? createClient(url, key) : null;
