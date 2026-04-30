import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';

function formatBRL(n) {
  return `R$ ${Number(n).toFixed(2).replace('.', ',')}`;
}

export default function FinanceApp() {
  const { user, signOut } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [formType, setFormType] = useState('expense');
  const [showFormModal, setShowFormModal] = useState(false);
  const [activeNav, setActiveNav] = useState('home');
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadTransactions = useCallback(async () => {
    if (!user) return;
    setListLoading(true);
    setListError(null);
    const { data, error } = await supabase
      .from('transactions')
      .select('id, amount, description, type, created_at')
      .order('created_at', { ascending: false });

    setListLoading(false);
    if (error) {
      setListError(error.message);
      return;
    }
    setTransactions(
      (data || []).map((row) => ({
        id: row.id,
        amount: Number(row.amount),
        description: row.description,
        type: row.type,
        date: new Date(row.created_at).toLocaleDateString('pt-BR'),
      }))
    );
  }, [user]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const income = useMemo(
    () => transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [transactions]
  );
  const expenses = useMemo(
    () => transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [transactions]
  );
  const balance = income - expenses;

  const filteredForNav = useMemo(() => {
    if (activeNav === 'gains') return transactions.filter((t) => t.type === 'income');
    if (activeNav === 'expenses') return transactions.filter((t) => t.type === 'expense');
    return transactions;
  }, [transactions, activeNav]);

  const displayList =
    activeNav === 'home'
      ? showAllTransactions
        ? transactions
        : transactions.slice(0, 5)
      : filteredForNav;

  const openForm = (type) => {
    setFormType(type);
    setAmount('');
    setDescription('');
    setShowFormModal(true);
  };

  const addTransaction = async () => {
    if (!amount || parseFloat(amount) <= 0 || !user) return;
    setSaving(true);
    setListError(null);
    const type = formType;
    const desc = description || (type === 'income' ? 'Ganho' : 'Gasto');
    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      amount: parseFloat(amount),
      description: desc,
      type,
    });
    setSaving(false);
    if (error) {
      setListError(error.message);
      return;
    }
    setShowFormModal(false);
    await loadTransactions();
  };

  const deleteTransaction = async (id) => {
    setListError(null);
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) {
      setListError(error.message);
      return;
    }
    await loadTransactions();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') addTransaction();
  };

  const emailDisplay =
    user?.email && user.email.length > 32 ? `${user.email.slice(0, 30)}…` : user?.email;

  const navItems = [
    { id: 'home', label: 'Início' },
    { id: 'gains', label: 'Ganhos' },
    { id: 'expenses', label: 'Gastos' },
    { id: 'reports', label: 'Relatórios' },
    { id: 'settings', label: 'Configurações' },
  ];

  const pageTitle =
    activeNav === 'home'
      ? 'Dashboard Financeiro'
      : activeNav === 'gains'
        ? 'Ganhos'
        : activeNav === 'expenses'
          ? 'Gastos'
          : activeNav === 'reports'
            ? 'Relatórios'
            : 'Configurações';

  const pageSubtitle =
    activeNav === 'home'
      ? 'Bem-vindo ao seu controle de finanças pessoais'
      : activeNav === 'reports'
        ? 'Visão geral dos seus números'
        : activeNav === 'settings'
          ? 'Conta e sessão'
          : 'Lista filtrada das suas movimentações';

  return (
    <div className="fin-dashboard">
      <header className="fin-header">
        <div
          style={{
            maxWidth: 1120,
            margin: '0 auto',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div className="fin-brand">
            <span className="fin-brand__mark" aria-hidden>
              👛
            </span>
            <span className="fin-brand__text">finCash</span>
          </div>

          <nav className="fin-nav-scroll" style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, justifyContent: 'center', minWidth: 0 }}>
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`fin-nav-link ${activeNav === item.id ? 'fin-nav-link--active' : ''}`}
                onClick={() => setActiveNav(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '15px',
                background: 'linear-gradient(145deg, rgba(148,163,184,0.2), rgba(71,85,105,0.15))',
                border: '1px solid rgba(148,163,184,0.25)',
              }}
              aria-hidden
            >
              👤
            </span>
            <span
              style={{
                fontSize: '13px',
                color: 'var(--fin-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 200,
              }}
              title={user?.email}
            >
              {emailDisplay}
            </span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '24px 20px 48px' }}>
        {listError && (
          <div
            style={{
              fontSize: '13px',
              color: 'var(--fin-danger)',
              background: 'var(--fin-red-soft)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              padding: '12px 14px',
              borderRadius: 10,
              marginBottom: '20px',
            }}
          >
            {listError}
          </div>
        )}

        {activeNav === 'settings' ? (
          <section className="fin-card-metric" style={{ maxWidth: 480 }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600' }}>Configurações</h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--fin-muted)' }}>{user?.email}</p>
            <button
              type="button"
              onClick={() => signOut()}
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                border: '1px solid var(--fin-border)',
                background: 'var(--fin-surface2)',
                color: 'var(--fin-text)',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Sair da conta
            </button>
          </section>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '16px',
                marginBottom: '28px',
              }}
            >
              <div>
                <h1 style={{ margin: '0 0 6px 0', fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: '700', color: 'var(--fin-text)' }}>
                  {pageTitle}
                </h1>
                <p style={{ margin: 0, fontSize: '15px', color: 'var(--fin-muted)' }}>{pageSubtitle}</p>
              </div>
              {activeNav === 'home' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  <button
                    type="button"
                    disabled={listLoading}
                    onClick={() => openForm('income')}
                    className="fin-btn-gain"
                  >
                    + Adicionar Ganho
                  </button>
                  <button
                    type="button"
                    disabled={listLoading}
                    onClick={() => openForm('expense')}
                    className="fin-btn-expense"
                  >
                    + Adicionar Gasto
                  </button>
                </div>
              )}
              {(activeNav === 'gains' || activeNav === 'expenses') && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => openForm(activeNav === 'gains' ? 'income' : 'expense')}
                    className={activeNav === 'gains' ? 'fin-btn-gain' : 'fin-btn-expense'}
                  >
                    + Registrar {activeNav === 'gains' ? 'ganho' : 'gasto'}
                  </button>
                </div>
              )}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
                marginBottom: '28px',
              }}
            >
              <div className="fin-card-metric fin-metric--income">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--fin-muted)', fontWeight: '500' }}>Total de Ganhos</span>
                  <span style={{ color: 'var(--fin-success)', fontSize: '18px' }}>↑</span>
                </div>
                <p className="fin-amount" style={{ margin: 0, fontSize: '26px', fontWeight: '700', color: 'var(--fin-success)' }}>
                  {formatBRL(income)}
                </p>
              </div>
              <div className="fin-card-metric fin-metric--expense">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--fin-muted)', fontWeight: '500' }}>Total de Gastos</span>
                  <span style={{ color: 'var(--fin-danger)', fontSize: '18px' }}>↓</span>
                </div>
                <p className="fin-amount" style={{ margin: 0, fontSize: '26px', fontWeight: '700', color: 'var(--fin-danger)' }}>
                  {formatBRL(expenses)}
                </p>
              </div>
              <div className="fin-card-metric fin-metric--balance">
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--fin-muted)', fontWeight: '500' }}>Saldo Total</p>
                <p
                  className="fin-amount"
                  style={{
                    margin: '0 0 6px 0',
                    fontSize: '26px',
                    fontWeight: '700',
                    color: balance >= 0 ? 'var(--fin-success)' : 'var(--fin-danger)',
                  }}
                >
                  {formatBRL(balance)}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--fin-muted)' }}>
                  {balance >= 0 ? 'Resultado positivo' : 'Resultado negativo'}
                </p>
              </div>
            </div>

            {activeNav === 'reports' && (
              <div className="fin-card-metric" style={{ marginBottom: '28px' }}>
                <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: 'var(--fin-muted)' }}>
                  Este é um resumo rápido. Os totais acima refletem todas as transações registradas.
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--fin-text)', fontSize: '14px', lineHeight: 1.7 }}>
                  <li>
                    Você tem <strong style={{ color: 'var(--fin-success)' }}>{formatBRL(income)}</strong> em ganhos.
                  </li>
                  <li>
                    E <strong style={{ color: 'var(--fin-danger)' }}>{formatBRL(expenses)}</strong> em gastos.
                  </li>
                  <li>
                    Saldo líquido:{' '}
                    <strong style={{ color: balance >= 0 ? 'var(--fin-success)' : 'var(--fin-danger)' }}>{formatBRL(balance)}</strong>.
                  </li>
                </ul>
              </div>
            )}

            {activeNav === 'home' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '24px',
                  alignItems: 'start',
                }}
              >
                <section>
                  <h2 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: '600', color: 'var(--fin-text)' }}>
                    Ações rápidas
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button type="button" onClick={() => openForm('income')} className="fin-btn-outline fin-btn-outline--gain">
                      Registrar Ganho
                    </button>
                    <button type="button" onClick={() => openForm('expense')} className="fin-btn-outline fin-btn-outline--expense">
                      Registrar Gasto
                    </button>
                    <button type="button" onClick={() => setActiveNav('reports')} className="fin-btn-outline fin-btn-outline--neutral">
                      Ver Relatórios
                    </button>
                  </div>
                </section>

                <section className="fin-card-metric" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Transações recentes</h2>
                    {transactions.length > 5 && (
                      <button
                        type="button"
                        onClick={() => setShowAllTransactions(!showAllTransactions)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--fin-success)',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          padding: '4px 0',
                        }}
                      >
                        {showAllTransactions ? 'Mostrar menos' : 'Ver tudo'}
                      </button>
                    )}
                  </div>
                  {listLoading ? (
                    <p style={{ color: 'var(--fin-muted)', textAlign: 'center', padding: '24px 0' }}>Carregando…</p>
                  ) : displayList.length === 0 ? (
                    <p style={{ color: 'var(--fin-muted)', textAlign: 'center', padding: '24px 0', margin: 0 }}>
                      Nenhuma transação ainda.
                    </p>
                  ) : (
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {displayList.map((t) => (
                        <li
                          key={t.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            paddingBottom: '12px',
                            borderBottom: '1px solid var(--fin-border)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                            <span
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 8,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '16px',
                                flexShrink: 0,
                                background: t.type === 'income' ? 'var(--fin-green-soft)' : 'var(--fin-red-soft)',
                                color: t.type === 'income' ? 'var(--fin-success)' : 'var(--fin-danger)',
                              }}
                            >
                              {t.type === 'income' ? '↑' : '↓'}
                            </span>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: 'var(--fin-text)' }}>{t.description}</p>
                              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--fin-muted)' }}>{t.date}</p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <span
                              style={{
                                fontWeight: '700',
                                fontSize: '14px',
                                color: t.type === 'income' ? 'var(--fin-success)' : 'var(--fin-danger)',
                              }}
                            >
                              {t.type === 'income' ? '+' : '-'}
                              {formatBRL(t.amount)}
                            </span>
                            <button
                              type="button"
                              onClick={() => deleteTransaction(t.id)}
                              title="Excluir"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--fin-muted)',
                                cursor: 'pointer',
                                padding: '4px 8px',
                                fontSize: '16px',
                                lineHeight: 1,
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            )}

            {(activeNav === 'gains' || activeNav === 'expenses') && (
              <section className="fin-card-metric">
                <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
                  {activeNav === 'gains' ? 'Seus ganhos' : 'Seus gastos'}
                </h2>
                {listLoading ? (
                  <p style={{ color: 'var(--fin-muted)', textAlign: 'center' }}>Carregando…</p>
                ) : filteredForNav.length === 0 ? (
                  <p style={{ color: 'var(--fin-muted)', margin: 0 }}>Nada aqui ainda.</p>
                ) : (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredForNav.map((t) => (
                      <li
                        key={t.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 0',
                          borderBottom: '1px solid var(--fin-border)',
                        }}
                      >
                        <div>
                          <p style={{ margin: 0, fontWeight: '600' }}>{t.description}</p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--fin-muted)' }}>{t.date}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '700', color: t.type === 'income' ? 'var(--fin-success)' : 'var(--fin-danger)' }}>
                            {t.type === 'income' ? '+' : '-'}
                            {formatBRL(t.amount)}
                          </span>
                          <button type="button" onClick={() => deleteTransaction(t.id)} style={{ background: 'none', border: 'none', color: 'var(--fin-muted)', cursor: 'pointer' }}>
                            ✕
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </>
        )}
      </main>

      {showFormModal && (
        <div className="fin-modal-backdrop" role="presentation" onClick={(e) => e.target === e.currentTarget && !saving && setShowFormModal(false)}>
          <div className="fin-modal fin-dashboard" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <h2 id="modal-title" style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: 'var(--fin-text)' }}>
              {formType === 'income' ? 'Novo ganho' : 'Novo gasto'}
            </h2>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--fin-muted)', marginBottom: '6px' }}>Valor (R$)</label>
            <input
              type="number"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={saving}
              step="0.01"
              min="0"
              className="fin-input"
              style={{ marginBottom: '14px' }}
            />
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--fin-muted)', marginBottom: '6px' }}>Descrição (opcional)</label>
            <input
              type="text"
              placeholder={formType === 'income' ? 'Ex.: Trabalho, mesada…' : 'Ex.: Supermercado, conta…'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={saving}
              className="fin-input"
              style={{ marginBottom: '18px' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                disabled={saving}
                onClick={() => setShowFormModal(false)}
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: '1px solid var(--fin-border)',
                  background: 'transparent',
                  color: 'var(--fin-muted)',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={addTransaction}
                className={formType === 'income' ? 'fin-btn-gain' : 'fin-btn-expense'}
              >
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
