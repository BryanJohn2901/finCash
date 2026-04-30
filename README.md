# finCash

Aplicação web de controle de finanças pessoais (**Next.js** + Supabase).

## Desenvolvimento local

```bash
npm install
cp .env.example .env.local
# Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Abre em [http://localhost:3000](http://localhost:3000).

## Banco (Supabase)

No SQL Editor do projeto:

- `supabase/schema.sql` — tabela `transactions` e RLS
- `supabase/usuarios.sql` — tabela `usuarios` e trigger em `auth.users`

## Colocar online (Vercel + Supabase)

1. **Supabase** → [Dashboard](https://supabase.com/dashboard) → **Project Settings → API**:
   - **Project URL** e chave **anon** / publicável.
2. **Vercel** → projeto → **Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
   (Antes, com Vite, usava-se o prefixo `VITE_` — agora use **sempre** `NEXT_PUBLIC_`.)
3. Marque **Production** (e **Preview** se quiser).
4. **Redeploy** após criar ou alterar variáveis.

O app mostra uma tela de instruções se faltar configuração.

## Supabase Auth após publicar

**Authentication → URL Configuration** → inclua a URL de produção (ex.: `https://seu-app.vercel.app`) em **Site URL** e **Redirect URLs**.

## Scripts

| Comando   | Descrição        |
|----------|------------------|
| `npm run dev`   | Desenvolvimento  |
| `npm run build` | Build produção   |
| `npm run start` | Servir build local |
| `npm run lint`  | ESLint           |
