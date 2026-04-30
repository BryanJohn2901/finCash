# finCash

Aplicação web de controle de finanças pessoais (React + Vite + Supabase).

## Desenvolvimento local

```bash
npm install
cp .env.example .env
# Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev
```

## Banco (Supabase)

Execute no SQL Editor do projeto, na ordem que preferir:

- `supabase/schema.sql` — tabela `transactions` e RLS
- `supabase/usuarios.sql` — tabela `usuarios` e trigger em `auth.users`

## Colocar online (Vercel + Supabase)

O app **só funciona no ar** depois que estas duas variáveis existem **no projeto da Vercel** e você faz um **novo deploy** (o Vite “injeta” `VITE_*` no build).

### Checklist rápido

1. **Supabase** → [Dashboard](https://supabase.com/dashboard) → seu projeto → **Project Settings → API**:
   - Copie **Project URL** (`https://xxxx.supabase.co`, sem `/rest/v1`).
   - Copie a chave **anon** / publicável (não use `service_role` no front).
2. **Vercel** → seu projeto → **Settings → Environment Variables**:
   - `VITE_SUPABASE_URL` = Project URL
   - `VITE_SUPABASE_ANON_KEY` = chave anon/publicável  
   Os nomes precisam ser **exatamente** esses (prefixo `VITE_`).
3. Marque **Production** (e **Preview** se quiser branch previews).
4. **Deployments** → ⋯ no último deploy → **Redeploy** (obrigatório após criar ou mudar variáveis).

Se faltar variável ou não redeployar, o site pode mostrar uma tela “Configurar variáveis” em vez do login.

### Deploy inicial

1. Conecte o repositório GitHub à Vercel (**Import Project**).
2. Framework: **Vite** (o `vercel.json` ajuda a detecção).
3. Conclua o checklist acima e use o domínio (ex.: `seu-app.vercel.app`).

## Supabase após publicar

Em **Authentication → URL Configuration**, inclua a URL de produção em:

- **Site URL** e **Redirect URLs** (ex.: `https://seu-app.vercel.app`).

Assim o login e cadastro funcionam no domínio da Vercel.
