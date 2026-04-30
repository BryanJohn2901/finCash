import React from 'react';

export default function EnvMissing() {
  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ maxWidth: 440 }}>
        <div className="auth-logo" aria-hidden>
          ⚙️
        </div>
        <h1 className="auth-title" style={{ fontSize: '1.25rem' }}>
          Configurar variáveis
        </h1>
        <p className="auth-sub" style={{ textAlign: 'left', lineHeight: 1.6 }}>
          O app precisa das credenciais do Supabase no deploy. Sem elas, a página fica em branco ou quebra ao
          carregar o cliente.
        </p>
        <ol
          style={{
            margin: '0 0 1.25rem 0',
            paddingLeft: '1.2rem',
            color: '#cbd5e1',
            fontSize: '14px',
            lineHeight: 1.7,
            textAlign: 'left',
          }}
        >
          <li>
            No <strong style={{ color: '#f1f5f9' }}>Vercel</strong> → seu projeto → <strong>Settings</strong> →{' '}
            <strong>Environment Variables</strong>.
          </li>
          <li>
            Adicione <code style={{ color: '#86efac' }}>VITE_SUPABASE_URL</code> (URL do projeto, ex.:{' '}
            <code>https://xxxx.supabase.co</code>).
          </li>
          <li>
            Adicione <code style={{ color: '#86efac' }}>VITE_SUPABASE_ANON_KEY</code> (chave <em>publicável</em> do
            Supabase, não a secret).
          </li>
          <li>
            Marque os ambientes <strong>Production</strong> (e Preview, se quiser) e salve.
          </li>
          <li>
            Faça um <strong>Redeploy</strong> (Deployments → três pontos → Redeploy) para o build injetar as
            variáveis.
          </li>
        </ol>
        <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', textAlign: 'left' }}>
          Em desenvolvimento local, use um arquivo <code style={{ color: '#cbd5e1' }}>.env</code> com os mesmos nomes
          (veja <code style={{ color: '#cbd5e1' }}>.env.example</code>).
        </p>
      </div>
    </div>
  );
}
