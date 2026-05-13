'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatBRL(n) {
  return `R$ ${Number(n).toFixed(2).replace('.', ',')}`;
}

function formatBRLShort(n) {
  const v = Number(n);
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1).replace('.', ',')}k`;
  return formatBRL(v);
}

// ─── Categories ───────────────────────────────────────────────────────────────

const EXPENSE_CATS = [
  { id: 'alimentacao', label: 'Alimentação', icon: '🍔' },
  { id: 'transporte', label: 'Transporte', icon: '🚗' },
  { id: 'moradia', label: 'Moradia', icon: '🏠' },
  { id: 'saude', label: 'Saúde', icon: '💊' },
  { id: 'educacao', label: 'Educação', icon: '📚' },
  { id: 'lazer', label: 'Lazer', icon: '🎮' },
  { id: 'vestuario', label: 'Vestuário', icon: '👕' },
  { id: 'contas', label: 'Contas', icon: '💡' },
  { id: 'assinaturas', label: 'Assinaturas', icon: '💳' },
  { id: 'outros', label: 'Outros', icon: '📦' },
];

const INCOME_CATS = [
  { id: 'salario', label: 'Salário', icon: '💼' },
  { id: 'freelance', label: 'Freelance', icon: '💻' },
  { id: 'investimentos', label: 'Investimentos', icon: '📈' },
  { id: 'bonificacao', label: 'Bonificação', icon: '🎁' },
  { id: 'outros', label: 'Outros', icon: '💰' },
];

const CHART_COLORS = [
  '#4ade80', '#fb7185', '#60a5fa', '#fbbf24', '#a78bfa',
  '#34d399', '#f97316', '#e879f9', '#38bdf8', '#94a3b8',
];

function getCat(id, type) {
  const list = type === 'income' ? INCOME_CATS : EXPENSE_CATS;
  return list.find(c => c.id === id) || { id, label: id, icon: '📦' };
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getTodayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getMonthOptions() {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const raw = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');
    return { value, label: raw.charAt(0).toUpperCase() + raw.slice(1) };
  });
}

// ─── Chart tooltips ───────────────────────────────────────────────────────────

function PieTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: p } = payload[0];
  const total = p?.total || 1;
  return (
    <div style={{ background: 'rgba(12,16,24,0.97)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
      <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#f8fafc' }}>{name}</p>
      <p style={{ margin: '0 0 2px', color: '#fb7185' }}>{formatBRL(value)}</p>
      <p style={{ margin: 0, color: '#94a3b8', fontSize: 11 }}>{((value / total) * 100).toFixed(1)}% do total</p>
    </div>
  );
}

function BarTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(12,16,24,0.97)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
      <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#f8fafc' }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ margin: '2px 0', color: p.color }}>{p.name}: {formatBRL(p.value)}</p>
      ))}
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

const iconBtnStyle = {
  background: 'none', border: 'none', color: 'var(--fin-muted)',
  cursor: 'pointer', padding: '4px 6px', fontSize: '14px',
  lineHeight: 1, borderRadius: 6, transition: 'background 0.15s',
};

function CatBadge({ id, type }) {
  const c = getCat(id, type);
  const isIncome = type === 'income';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, padding: '2px 7px', borderRadius: 999,
      background: isIncome ? 'rgba(74,222,128,0.1)' : 'rgba(251,113,133,0.1)',
      color: isIncome ? 'var(--fin-success)' : 'var(--fin-danger)',
      border: `1px solid ${isIncome ? 'rgba(74,222,128,0.2)' : 'rgba(251,113,133,0.2)'}`,
      whiteSpace: 'nowrap',
    }}>
      {c.icon} {c.label}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FinanceApp() {
  const { user, signOut } = useAuth();

  // Data
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);

  // Navigation
  const [activeNav, setActiveNav] = useState('home');

  // Transaction form
  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [formId, setFormId] = useState(null);
  const [formType, setFormType] = useState('expense');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('outros');
  const [formDate, setFormDate] = useState(getTodayISO());
  const [saving, setSaving] = useState(false);

  // Budget form
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetCat, setBudgetCat] = useState('alimentacao');
  const [budgetValue, setBudgetValue] = useState('');

  const monthOptions = useMemo(() => getMonthOptions(), []);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const loadTransactions = useCallback(async () => {
    if (!user || !supabase) return;
    setListLoading(true);
    setListError(null);
    const { data, error } = await supabase
      .from('transactions')
      .select('id, amount, description, type, category, date, created_at')
      .order('date', { ascending: false });
    setListLoading(false);
    if (error) { setListError(error.message); return; }
    setTransactions((data || []).map(row => ({
      id: row.id,
      amount: Number(row.amount),
      description: row.description,
      type: row.type,
      category: row.category || 'outros',
      date: row.date || row.created_at?.slice(0, 10) || getTodayISO(),
      dateLabel: new Date((row.date || row.created_at?.slice(0, 10) || getTodayISO()) + 'T12:00:00')
        .toLocaleDateString('pt-BR'),
    })));
  }, [user]);

  const loadBudgets = useCallback(async () => {
    if (!user || !supabase) return;
    const { data } = await supabase.from('budgets').select('id, category, amount, month');
    setBudgets(data || []);
  }, [user]);

  useEffect(() => {
    loadTransactions();
    loadBudgets();
  }, [loadTransactions, loadBudgets]);

  // ── Derived data ──────────────────────────────────────────────────────────

  const filtered = useMemo(() =>
    selectedMonth === 'all'
      ? transactions
      : transactions.filter(t => t.date?.startsWith(selectedMonth)),
    [transactions, selectedMonth]
  );

  const income = useMemo(() =>
    filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [filtered]
  );
  const expenses = useMemo(() =>
    filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [filtered]
  );
  const balance = income - expenses;
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : null;

  const expByCat = useMemo(() => {
    const map = {};
    filtered.filter(t => t.type === 'expense').forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map)
      .map(([id, value]) => ({ id, name: getCat(id, 'expense').label, value, total }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const monthlyChart = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const ms = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const raw = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      const label = raw.charAt(0).toUpperCase() + raw.slice(1);
      const mx = transactions.filter(t => t.date?.startsWith(ms));
      return {
        month: label,
        Ganhos: mx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        Gastos: mx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      };
    }),
    [transactions]
  );

  const budgetProgress = useMemo(() => {
    const month = selectedMonth === 'all' ? getCurrentMonth() : selectedMonth;
    return budgets
      .filter(b => b.month === month)
      .map(b => {
        const spent = transactions
          .filter(t => t.type === 'expense' && t.category === b.category && t.date?.startsWith(month))
          .reduce((s, t) => s + t.amount, 0);
        return {
          ...b,
          cat: getCat(b.category, 'expense'),
          spent,
          pct: Math.min((spent / b.amount) * 100, 100),
          over: spent > b.amount,
        };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [budgets, transactions, selectedMonth]);

  const displayList = useMemo(() => {
    if (activeNav === 'gains') return filtered.filter(t => t.type === 'income');
    if (activeNav === 'expenses') return filtered.filter(t => t.type === 'expense');
    return filtered;
  }, [filtered, activeNav]);

  // ── Actions ───────────────────────────────────────────────────────────────

  function openAddForm(type) {
    setFormMode('add'); setFormId(null); setFormType(type);
    setFormAmount(''); setFormDescription('');
    setFormCategory(type === 'income' ? 'salario' : 'alimentacao');
    setFormDate(getTodayISO());
    setShowFormModal(true);
  }

  function openEditForm(t) {
    setFormMode('edit'); setFormId(t.id); setFormType(t.type);
    setFormAmount(String(t.amount)); setFormDescription(t.description);
    setFormCategory(t.category); setFormDate(t.date || getTodayISO());
    setShowFormModal(true);
  }

  async function saveTransaction() {
    if (!formAmount || parseFloat(formAmount) <= 0 || !user || !supabase) return;
    setSaving(true); setListError(null);
    const payload = {
      amount: parseFloat(formAmount),
      description: formDescription.trim() || (formType === 'income' ? 'Ganho' : 'Gasto'),
      type: formType, category: formCategory, date: formDate,
    };
    const { error } = formMode === 'edit' && formId
      ? await supabase.from('transactions').update(payload).eq('id', formId)
      : await supabase.from('transactions').insert({ ...payload, user_id: user.id });
    setSaving(false);
    if (error) { setListError(error.message); return; }
    setShowFormModal(false);
    await loadTransactions();
  }

  async function deleteTransaction(id) {
    if (!supabase) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) { setListError(error.message); return; }
    await loadTransactions();
  }

  async function saveBudget() {
    if (!budgetValue || parseFloat(budgetValue) <= 0 || !user || !supabase) return;
    setSaving(true);
    const month = selectedMonth === 'all' ? getCurrentMonth() : selectedMonth;
    const { error } = await supabase.from('budgets').upsert(
      { user_id: user.id, category: budgetCat, amount: parseFloat(budgetValue), month },
      { onConflict: 'user_id,category,month' }
    );
    setSaving(false);
    if (!error) { setShowBudgetModal(false); setBudgetValue(''); await loadBudgets(); }
  }

  async function deleteBudget(id) {
    if (!supabase) return;
    await supabase.from('budgets').delete().eq('id', id);
    await loadBudgets();
  }

  // ── Sub-components (defined here to access parent state) ──────────────────

  function TxRow({ t }) {
    return (
      <li style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, padding: '12px 0', borderBottom: '1px solid var(--fin-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <span style={{
            width: 38, height: 38, borderRadius: 10, display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0,
            background: t.type === 'income' ? 'var(--fin-green-soft)' : 'var(--fin-red-soft)',
          }}>
            {getCat(t.category, t.type).icon}
          </span>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t.description}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--fin-muted)' }}>{t.dateLabel}</span>
              <CatBadge id={t.category} type={t.type} />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: t.type === 'income' ? 'var(--fin-success)' : 'var(--fin-danger)' }}>
            {t.type === 'income' ? '+' : '-'}{formatBRL(t.amount)}
          </span>
          <button type="button" onClick={() => openEditForm(t)} title="Editar" style={iconBtnStyle}>✏️</button>
          <button type="button" onClick={() => deleteTransaction(t.id)} title="Excluir" style={iconBtnStyle}>✕</button>
        </div>
      </li>
    );
  }

  function SummaryCards({ showSavings = false }) {
    const cols = showSavings ? 'repeat(auto-fit, minmax(190px, 1fr))' : 'repeat(auto-fit, minmax(210px, 1fr))';
    return (
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 16, marginBottom: 28 }}>
        <div className="fin-card-metric fin-metric--income">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--fin-muted)', fontWeight: 500 }}>Total de Ganhos</span>
            <span style={{ color: 'var(--fin-success)', fontSize: 18 }}>↑</span>
          </div>
          <p className="fin-amount" style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 700, color: 'var(--fin-success)' }}>
            {formatBRL(income)}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--fin-muted)' }}>
            {filtered.filter(t => t.type === 'income').length} transações
          </p>
        </div>

        <div className="fin-card-metric fin-metric--expense">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--fin-muted)', fontWeight: 500 }}>Total de Gastos</span>
            <span style={{ color: 'var(--fin-danger)', fontSize: 18 }}>↓</span>
          </div>
          <p className="fin-amount" style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 700, color: 'var(--fin-danger)' }}>
            {formatBRL(expenses)}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--fin-muted)' }}>
            {filtered.filter(t => t.type === 'expense').length} transações
          </p>
        </div>

        <div className="fin-card-metric fin-metric--balance">
          <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--fin-muted)', fontWeight: 500 }}>Saldo</p>
          <p className="fin-amount" style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 700, color: balance >= 0 ? 'var(--fin-success)' : 'var(--fin-danger)' }}>
            {formatBRL(balance)}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--fin-muted)' }}>
            {balance >= 0 ? 'Resultado positivo' : 'Resultado negativo'}
          </p>
        </div>

        {showSavings && (
          <div className="fin-card-metric" style={{ boxShadow: 'inset 0 3px 0 #a78bfa' }}>
            <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--fin-muted)', fontWeight: 500 }}>Taxa de Poupança</p>
            <p className="fin-amount" style={{
              margin: '0 0 4px', fontSize: 26, fontWeight: 700,
              color: savingsRate === null ? 'var(--fin-muted)' : savingsRate >= 20 ? 'var(--fin-success)' : savingsRate >= 0 ? '#fbbf24' : 'var(--fin-danger)',
            }}>
              {savingsRate === null ? '—' : `${savingsRate.toFixed(1)}%`}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--fin-muted)' }}>
              {savingsRate === null ? 'Sem ganhos' : savingsRate >= 20 ? 'Excelente!' : savingsRate >= 10 ? 'Bom' : savingsRate >= 0 ? 'Pode melhorar' : 'Atenção!'}
            </p>
          </div>
        )}
      </div>
    );
  }

  const emailDisplay = user?.email?.length > 32 ? `${user.email.slice(0, 30)}…` : user?.email;
  const navItems = [
    { id: 'home', label: 'Início' },
    { id: 'gains', label: 'Ganhos' },
    { id: 'expenses', label: 'Gastos' },
    { id: 'reports', label: 'Relatórios' },
    { id: 'settings', label: 'Configurações' },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fin-dashboard">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="fin-header">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div className="fin-brand">
            <span className="fin-brand__mark" aria-hidden>👛</span>
            <span className="fin-brand__text">finCash</span>
          </div>

          <nav className="fin-nav-scroll" style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center', minWidth: 0 }}>
            {navItems.map(item => (
              <button key={item.id} type="button"
                className={`fin-nav-link${activeNav === item.id ? ' fin-nav-link--active' : ''}`}
                onClick={() => setActiveNav(item.id)}>
                {item.label}
              </button>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <span style={{
              width: 34, height: 34, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, background: 'linear-gradient(145deg,rgba(148,163,184,0.2),rgba(71,85,105,0.15))',
              border: '1px solid rgba(148,163,184,0.25)', flexShrink: 0,
            }} aria-hidden>👤</span>
            <span style={{ fontSize: 13, color: 'var(--fin-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }} title={user?.email}>
              {emailDisplay}
            </span>
          </div>
        </div>

        {/* Month filter bar */}
        {activeNav !== 'settings' && (
          <div style={{ borderTop: '1px solid var(--fin-border)', background: 'rgba(6,8,12,0.5)', display: 'flex', overflowX: 'auto', padding: '8px 20px', gap: 6, scrollbarWidth: 'none' }}>
            {[{ value: 'all', label: 'Tudo' }, ...monthOptions].map(m => (
              <button key={m.value} type="button" onClick={() => setSelectedMonth(m.value)} style={{
                padding: '5px 14px', borderRadius: 999, border: 'none', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'inherit',
                background: selectedMonth === m.value ? 'var(--fin-green-soft)' : 'transparent',
                color: selectedMonth === m.value ? 'var(--fin-success)' : 'var(--fin-muted)',
                boxShadow: selectedMonth === m.value ? 'inset 0 0 0 1px rgba(74,222,128,0.2)' : 'none',
                transition: 'all 0.15s',
              }}>
                {m.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px 80px' }}>

        {listError && (
          <div style={{ fontSize: 13, color: 'var(--fin-danger)', background: 'var(--fin-red-soft)', border: '1px solid rgba(239,68,68,0.35)', padding: '12px 14px', borderRadius: 10, marginBottom: 20 }}>
            {listError}
          </div>
        )}

        {/* ══ SETTINGS ════════════════════════════════════════════════════ */}
        {activeNav === 'settings' && (
          <div style={{ maxWidth: 560 }}>
            <h1 style={{ margin: '0 0 24px', fontSize: 24, fontWeight: 700 }}>Configurações</h1>

            <section className="fin-card-metric" style={{ marginBottom: 20 }}>
              <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--fin-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Conta</p>
              <p style={{ margin: '0 0 16px', fontSize: 15 }}>{user?.email}</p>
              <button type="button" onClick={signOut} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid rgba(251,113,133,0.3)', background: 'rgba(251,113,133,0.07)', color: '#fda4af', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }}>
                Sair da conta
              </button>
            </section>

            <section className="fin-card-metric">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 700 }}>Metas de gastos</p>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--fin-muted)' }}>Limites mensais por categoria</p>
                </div>
                <button type="button" onClick={() => { setBudgetCat('alimentacao'); setBudgetValue(''); setShowBudgetModal(true); }} className="fin-btn-gain" style={{ padding: '8px 14px', fontSize: 13 }}>
                  + Nova meta
                </button>
              </div>

              {budgets.length === 0 ? (
                <p style={{ color: 'var(--fin-muted)', fontSize: 14, margin: 0 }}>Nenhuma meta definida ainda.</p>
              ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {budgets.map(b => {
                    const cat = getCat(b.category, 'expense');
                    return (
                      <li key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--fin-border)' }}>
                        <div>
                          <span style={{ fontSize: 14 }}>{cat.icon} {cat.label}</span>
                          <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--fin-muted)' }}>{b.month}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 600, color: 'var(--fin-muted)', fontSize: 14 }}>{formatBRL(b.amount)}</span>
                          <button type="button" onClick={() => deleteBudget(b.id)} style={iconBtnStyle}>✕</button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        )}

        {/* ══ HOME ════════════════════════════════════════════════════════ */}
        {activeNav === 'home' && (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
              <div>
                <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(22px,4vw,28px)', fontWeight: 700 }}>Dashboard</h1>
                <p style={{ margin: 0, fontSize: 15, color: 'var(--fin-muted)' }}>Controle suas finanças pessoais</p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <button type="button" disabled={listLoading} onClick={() => openAddForm('income')} className="fin-btn-gain">+ Ganho</button>
                <button type="button" disabled={listLoading} onClick={() => openAddForm('expense')} className="fin-btn-expense">+ Gasto</button>
              </div>
            </div>

            <SummaryCards showSavings />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, alignItems: 'start' }}>
              <section>
                <h2 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600 }}>Ações rápidas</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button type="button" onClick={() => openAddForm('income')} className="fin-btn-outline fin-btn-outline--gain">💼 Registrar Ganho</button>
                  <button type="button" onClick={() => openAddForm('expense')} className="fin-btn-outline fin-btn-outline--expense">💸 Registrar Gasto</button>
                  <button type="button" onClick={() => setActiveNav('reports')} className="fin-btn-outline fin-btn-outline--neutral">📊 Ver Relatórios</button>
                  <button type="button" onClick={() => setActiveNav('settings')} className="fin-btn-outline fin-btn-outline--neutral">🎯 Gerenciar Metas</button>
                </div>
              </section>

              <section className="fin-card-metric" style={{ margin: 0 }}>
                <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Transações recentes</h2>
                {listLoading ? (
                  <p style={{ color: 'var(--fin-muted)', textAlign: 'center', padding: '24px 0' }}>Carregando…</p>
                ) : filtered.length === 0 ? (
                  <p style={{ color: 'var(--fin-muted)', textAlign: 'center', padding: '24px 0', margin: 0 }}>Nenhuma transação neste período.</p>
                ) : (
                  <>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                      {filtered.slice(0, 6).map(t => <TxRow key={t.id} t={t} />)}
                    </ul>
                    {filtered.length > 6 && (
                      <button type="button" onClick={() => setActiveNav('gains')} style={{ marginTop: 12, background: 'none', border: 'none', color: 'var(--fin-success)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '4px 0', fontFamily: 'inherit' }}>
                        Ver todas ({filtered.length})
                      </button>
                    )}
                  </>
                )}
              </section>
            </div>
          </>
        )}

        {/* ══ GANHOS / GASTOS ═════════════════════════════════════════════ */}
        {(activeNav === 'gains' || activeNav === 'expenses') && (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
              <div>
                <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(22px,4vw,28px)', fontWeight: 700 }}>
                  {activeNav === 'gains' ? 'Ganhos' : 'Gastos'}
                </h1>
                <p style={{ margin: 0, fontSize: 15, color: 'var(--fin-muted)' }}>
                  {displayList.length} movimentação(s) no período
                </p>
              </div>
              <button type="button"
                onClick={() => openAddForm(activeNav === 'gains' ? 'income' : 'expense')}
                className={activeNav === 'gains' ? 'fin-btn-gain' : 'fin-btn-expense'}>
                + Registrar {activeNav === 'gains' ? 'ganho' : 'gasto'}
              </button>
            </div>

            <SummaryCards />

            {/* Budget progress (gastos only) */}
            {activeNav === 'expenses' && budgetProgress.length > 0 && (
              <section className="fin-card-metric" style={{ marginBottom: 24 }}>
                <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Progresso das metas</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {budgetProgress.map(b => (
                    <div key={b.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{b.cat.icon} {b.cat.label}</span>
                        <span style={{ fontSize: 12, color: b.over ? 'var(--fin-danger)' : 'var(--fin-muted)' }}>
                          {formatBRL(b.spent)} / {formatBRL(b.amount)}{b.over ? ' ⚠️' : ''}
                        </span>
                      </div>
                      <div style={{ height: 6, borderRadius: 999, background: 'rgba(148,163,184,0.12)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 999, width: `${b.pct}%`, transition: 'width 0.5s ease',
                          background: b.over ? '#f43f5e' : b.pct > 80 ? '#fbbf24' : '#4ade80',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="fin-card-metric">
              <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>
                {activeNav === 'gains' ? 'Seus ganhos' : 'Seus gastos'}
              </h2>
              {listLoading ? (
                <p style={{ color: 'var(--fin-muted)', textAlign: 'center' }}>Carregando…</p>
              ) : displayList.length === 0 ? (
                <p style={{ color: 'var(--fin-muted)', margin: 0 }}>Nenhuma movimentação neste período.</p>
              ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {displayList.map(t => <TxRow key={t.id} t={t} />)}
                </ul>
              )}
            </section>
          </>
        )}

        {/* ══ RELATÓRIOS ══════════════════════════════════════════════════ */}
        {activeNav === 'reports' && (
          <>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(22px,4vw,28px)', fontWeight: 700 }}>Relatórios</h1>
              <p style={{ margin: 0, fontSize: 15, color: 'var(--fin-muted)' }}>Visão analítica das suas finanças</p>
            </div>

            <SummaryCards showSavings />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 24 }}>

              {/* Bar chart */}
              <div className="fin-card-metric">
                <p style={{ margin: '0 0 20px', fontSize: 13, fontWeight: 600, color: 'var(--fin-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Ganhos vs Gastos — últimos 6 meses
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyChart} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={formatBRLShort} width={64} />
                    <ReTooltip content={<BarTip />} cursor={{ fill: 'rgba(148,163,184,0.06)' }} />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }} />
                    <Bar dataKey="Ganhos" fill="#4ade80" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Gastos" fill="#fb7185" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie chart */}
              <div className="fin-card-metric">
                <p style={{ margin: '0 0 20px', fontSize: 13, fontWeight: 600, color: 'var(--fin-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Gastos por categoria
                </p>
                {expByCat.length === 0 ? (
                  <p style={{ color: 'var(--fin-muted)', textAlign: 'center', padding: '48px 0', margin: 0 }}>
                    Sem gastos neste período.
                  </p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={expByCat} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3}>
                          {expByCat.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />
                          ))}
                        </Pie>
                        <ReTooltip content={<PieTip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {expByCat.map((c, i) => (
                        <li key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 10, height: 10, borderRadius: 3, background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                            {getCat(c.id, 'expense').icon} {c.name}
                          </span>
                          <span style={{ color: 'var(--fin-muted)', fontWeight: 600 }}>
                            {formatBRL(c.value)}{' '}
                            <span style={{ opacity: 0.55, fontSize: 11 }}>({((c.value / expenses) * 100).toFixed(0)}%)</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>

            {/* Budget overview */}
            {budgetProgress.length > 0 && (
              <div className="fin-card-metric">
                <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 600, color: 'var(--fin-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Metas do período
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                  {budgetProgress.map(b => (
                    <div key={b.id} style={{ padding: 14, borderRadius: 10, background: 'rgba(0,0,0,0.22)', border: '1px solid var(--fin-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{b.cat.icon} {b.cat.label}</span>
                        <span style={{ fontSize: 12, color: b.over ? 'var(--fin-danger)' : 'var(--fin-muted)' }}>{b.pct.toFixed(0)}%</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 999, background: 'rgba(148,163,184,0.12)', overflow: 'hidden', marginBottom: 6 }}>
                        <div style={{ height: '100%', borderRadius: 999, width: `${b.pct}%`, background: b.over ? '#f43f5e' : b.pct > 80 ? '#fbbf24' : '#4ade80' }} />
                      </div>
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--fin-muted)' }}>
                        {formatBRL(b.spent)} de {formatBRL(b.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ══ TRANSACTION MODAL ═══════════════════════════════════════════════ */}
      {showFormModal && (
        <div className="fin-modal-backdrop" role="presentation"
          onClick={e => e.target === e.currentTarget && !saving && setShowFormModal(false)}>
          <div className="fin-modal fin-dashboard" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <h2 id="modal-title" style={{ margin: '0 0 18px', fontSize: 18, fontWeight: 700 }}>
              {formMode === 'edit' ? 'Editar transação' : formType === 'income' ? 'Novo ganho' : 'Novo gasto'}
            </h2>

            {formMode === 'add' && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 16, padding: 4, borderRadius: 10, background: 'rgba(0,0,0,0.35)', border: '1px solid var(--fin-border)' }}>
                {['income', 'expense'].map(tp => (
                  <button key={tp} type="button"
                    onClick={() => { setFormType(tp); setFormCategory(tp === 'income' ? 'salario' : 'alimentacao'); }}
                    style={{
                      flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.15s',
                      background: formType === tp ? (tp === 'income' ? 'rgba(74,222,128,0.15)' : 'rgba(251,113,133,0.15)') : 'transparent',
                      color: formType === tp ? (tp === 'income' ? 'var(--fin-success)' : 'var(--fin-danger)') : 'var(--fin-muted)',
                      boxShadow: formType === tp ? `inset 0 0 0 1px ${tp === 'income' ? 'rgba(74,222,128,0.3)' : 'rgba(251,113,133,0.3)'}` : 'none',
                    }}>
                    {tp === 'income' ? '↑ Ganho' : '↓ Gasto'}
                  </button>
                ))}
              </div>
            )}

            <label className="fin-field-label">Valor (R$)</label>
            <input type="number" placeholder="0,00" value={formAmount} onChange={e => setFormAmount(e.target.value)}
              disabled={saving} step="0.01" min="0" className="fin-input" style={{ marginBottom: 14 }} autoFocus />

            <label className="fin-field-label">Descrição</label>
            <input type="text"
              placeholder={formType === 'income' ? 'Ex: Salário maio…' : 'Ex: Supermercado…'}
              value={formDescription} onChange={e => setFormDescription(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveTransaction()}
              disabled={saving} className="fin-input" style={{ marginBottom: 14 }} />

            <label className="fin-field-label">Categoria</label>
            <select value={formCategory} onChange={e => setFormCategory(e.target.value)}
              disabled={saving} className="fin-input fin-select" style={{ marginBottom: 14 }}>
              {(formType === 'income' ? INCOME_CATS : EXPENSE_CATS).map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
              ))}
            </select>

            <label className="fin-field-label">Data</label>
            <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
              disabled={saving} className="fin-input" style={{ marginBottom: 20, colorScheme: 'dark' }} />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" disabled={saving} onClick={() => setShowFormModal(false)}
                style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--fin-border)', background: 'transparent', color: 'var(--fin-muted)', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>
                Cancelar
              </button>
              <button type="button" disabled={saving || !formAmount} onClick={saveTransaction}
                className={formType === 'income' ? 'fin-btn-gain' : 'fin-btn-expense'}>
                {saving ? 'Salvando…' : formMode === 'edit' ? 'Salvar alterações' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ BUDGET MODAL ════════════════════════════════════════════════════ */}
      {showBudgetModal && (
        <div className="fin-modal-backdrop" role="presentation"
          onClick={e => e.target === e.currentTarget && !saving && setShowBudgetModal(false)}>
          <div className="fin-modal fin-dashboard" role="dialog" aria-modal="true">
            <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700 }}>Nova meta de gasto</h2>
            <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--fin-muted)' }}>
              Defina um limite mensal para esta categoria.
            </p>

            <label className="fin-field-label">Categoria</label>
            <select value={budgetCat} onChange={e => setBudgetCat(e.target.value)}
              className="fin-input fin-select" style={{ marginBottom: 14 }}>
              {EXPENSE_CATS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>

            <label className="fin-field-label">Limite mensal (R$)</label>
            <input type="number" placeholder="Ex: 800,00" value={budgetValue}
              onChange={e => setBudgetValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveBudget()}
              disabled={saving} step="0.01" min="0" className="fin-input" style={{ marginBottom: 20 }} autoFocus />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" disabled={saving} onClick={() => setShowBudgetModal(false)}
                style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--fin-border)', background: 'transparent', color: 'var(--fin-muted)', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>
                Cancelar
              </button>
              <button type="button" disabled={saving || !budgetValue} onClick={saveBudget} className="fin-btn-gain">
                {saving ? 'Salvando…' : 'Salvar meta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
