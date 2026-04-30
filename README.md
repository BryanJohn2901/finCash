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

## Problemas comuns

- **`ERR_NAME_NOT_RESOLVED` / Failed to fetch** ao logar: o `NEXT_PUBLIC_SUPABASE_URL` está errado. No Supabase use **só o valor do campo “Project URL”** em **Settings → API** (não monte a URL na mão a partir do ID; um caractere diferente quebra o DNS).
- **Aviso de hidratação** no `body` com `cz-shortcut-listen`: costuma ser **extensão do navegador**; o layout usa `suppressHydrationWarning` para ignorar isso.
- **“No user after sign in”** em `inspector.*.js`: em geral vem de **extensão** (ex.: inspeção), não do app.
