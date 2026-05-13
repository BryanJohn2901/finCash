import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));

// Lê .env.local manualmente
const envPath = join(__dir, '..', '.env.local');
const env = readFileSync(envPath, 'utf8');
const dbUrl = env.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim();

if (!dbUrl) {
  console.error('DATABASE_URL não encontrado em .env.local');
  process.exit(1);
}

const migration = `
-- 1. Adicionar colunas novas na tabela existente
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'outros',
  ADD COLUMN IF NOT EXISTS date date NOT NULL DEFAULT current_date;

-- 2. Índice para busca por data
CREATE INDEX IF NOT EXISTS transactions_user_date_idx
  ON public.transactions (user_id, date DESC);

-- 3. Tabela de metas de orçamento
CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  category text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  month text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, category, month)
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own budgets" ON public.budgets;

CREATE POLICY "Users manage own budgets"
  ON public.budgets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
`;

const { Client } = pg;
const client = new Client({ connectionString: dbUrl });

try {
  console.log('Conectando ao Supabase...');
  await client.connect();
  console.log('Rodando migração...');
  await client.query(migration);
  console.log('✅ Migração concluída com sucesso!');

  // Verificar colunas
  const res = await client.query(`
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_name = 'transactions' AND table_schema = 'public'
    ORDER BY ordinal_position;
  `);
  console.log('\nColunas da tabela transactions:');
  res.rows.forEach(r => console.log(` - ${r.column_name} (${r.data_type})`));

  const bres = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_name = 'budgets' AND table_schema = 'public';
  `);
  console.log(`\nTabela budgets: ${bres.rows.length > 0 ? '✅ criada' : '❌ não encontrada'}`);
} catch (err) {
  console.error('❌ Erro na migração:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
