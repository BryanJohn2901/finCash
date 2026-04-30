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

## Deploy na Vercel

1. Conecte o repositório GitHub à Vercel (**Import Project**).
2. Framework: **Vite** (a Vercel detecta pelo `vercel.json`).
3. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL` — URL do projeto (ex.: `https://xxxx.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY` — chave **publicável / anon** do Supabase (nunca a chave secreta no front-end).
4. Faça o deploy. Use o domínio gerado (ex.: `seu-app.vercel.app`).

## Supabase após publicar

Em **Authentication → URL Configuration**, inclua a URL de produção em:

- **Site URL** e **Redirect URLs** (ex.: `https://seu-app.vercel.app`).

Assim o login e cadastro funcionam no domínio da Vercel.
