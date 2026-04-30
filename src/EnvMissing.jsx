import React from 'react';

const linkStyle = {
  color: '#86efac',
  fontWeight: 600,
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
};

export default function EnvMissing() {
  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <div className="auth-logo" aria-hidden>
          ⚙️
        </div>
        <h1 className="auth-title" style={{ fontSize: '1.25rem' }}>
          Falta configurar o Supabase na Vercel
        </h1>
        <p className="auth-sub" style={{ textAlign: 'left', lineHeight: 1.65 }}>
          O front usa variáveis <code style={{ color: '#cbd5e1' }}>VITE_*</code> no <strong>momento do build</strong>.
          Sem elas, o login não aparece — você está vendo esta tela em vez disso.
        </p>

        <div
          style={{
            padding: '14px 16px',
            borderRadius: 12,
            marginBottom: '1.25rem',
            background: 'rgba(251, 191, 36, 0.08)',
            border: '1px solid rgba(251, 191, 36, 0.25)',
            fontSize: '13px',
            color: '#fde68a',
            textAlign: 'left',
            lineHeight: 1.55,
          }}
        >
          <strong style={{ color: '#fef3c7' }}>Se já criou as variáveis:</strong> falta quase sempre um{' '}
          <strong>Redeploy</strong>. Variáveis novas só entram no bundle depois de um build novo.
        </div>

        <p style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 700, color: '#94a3b8', textAlign: 'left' }}>
          Onde pegar URL e chave (anon / publicável)
        </p>
        <ol
          style={{
            margin: '0 0 1.35rem 0',
            paddingLeft: '1.2rem',
            color: '#cbd5e1',
            fontSize: '14px',
            lineHeight: 1.75,
            textAlign: 'left',
          }}
        >
          <li>
            Abra o{' '}
            <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" style={linkStyle}>
              painel do Supabase
            </a>{' '}
            → seu projeto → <strong style={{ color: '#f1f5f9' }}>Project Settings</strong> →{' '}
            <strong style={{ color: '#f1f5f9' }}>API</strong>.
          </li>
          <li>
            Copie <strong style={{ color: '#f1f5f9' }}>Project URL</strong> (formato{' '}
            <code style={{ color: '#94a3b8' }}>https://xxxxx.supabase.co</code>, sem{' '}
            <code style={{ color: '#94a3b8' }}>/rest/v1</code>).
          </li>
          <li>
            Copie a chave <strong style={{ color: '#f1f5f9' }}>anon public</strong> / publishable (não use a{' '}
            <code style={{ color: '#94a3b8' }}>service_role</code> no front).
          </li>
        </ol>

        <p style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 700, color: '#94a3b8', textAlign: 'left' }}>
          Onde colar na Vercel
        </p>
        <ol
          style={{
            margin: '0 0 1.25rem 0',
            paddingLeft: '1.2rem',
            color: '#cbd5e1',
            fontSize: '14px',
            lineHeight: 1.75,
            textAlign: 'left',
          }}
        >
          <li>
            <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" style={linkStyle}>
              Vercel Dashboard
            </a>{' '}
            → seu projeto <strong style={{ color: '#f1f5f9' }}>finCash</strong> →{' '}
            <strong style={{ color: '#f1f5f9' }}>Settings</strong> →{' '}
            <strong style={{ color: '#f1f5f9' }}>Environment Variables</strong>.
          </li>
          <li>
            Crie <strong style={{ color: '#86efac' }}>exatamente</strong> estes nomes (com prefixo{' '}
            <code style={{ color: '#94a3b8' }}>VITE_</code>):
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '1.2rem' }}>
              <li>
                <code style={{ color: '#86efac' }}>VITE_SUPABASE_URL</code> → cole a Project URL
              </li>
              <li>
                <code style={{ color: '#86efac' }}>VITE_SUPABASE_ANON_KEY</code> → cole a chave anon/publicável
              </li>
            </ul>
          </li>
          <li>
            Marque <strong style={{ color: '#f1f5f9' }}>Production</strong> (e <strong>Preview</strong> se quiser
            previews). Salve.
          </li>
          <li>
            <strong style={{ color: '#f1f5f9' }}>Deployments</strong> → último deploy → ⋯ →{' '}
            <strong style={{ color: '#f1f5f9' }}>Redeploy</strong> (marque “Use existing Build Cache” só se der erro;
            em dúvida redeploy sem cache).
          </li>
        </ol>

        <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#94a3b8', textAlign: 'left', lineHeight: 1.55 }}>
          Depois que o deploy terminar com sucesso, atualize o site: esta mensagem some e o{' '}
          <strong style={{ color: '#e2e8f0' }}>login do finCash</strong> aparece.
        </p>

        <p style={{ margin: 0, fontSize: '13px', color: '#64748b', textAlign: 'left', lineHeight: 1.55 }}>
          Login local: arquivo <code style={{ color: '#94a3b8' }}>.env</code> na raiz (copie de{' '}
          <code style={{ color: '#94a3b8' }}>.env.example</code>). Supabase Auth em produção: em{' '}
          <strong style={{ color: '#94a3b8' }}>Authentication → URL Configuration</strong>, inclua a URL da Vercel em{' '}
          <strong>Site URL</strong> e <strong>Redirect URLs</strong>.
        </p>
      </div>
    </div>
  );
}
