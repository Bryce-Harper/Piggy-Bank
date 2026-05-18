import { useState, useMemo, useCallback, useRef } from 'react'
import PiggyBank from './PiggyBank.jsx'
import Coin from './Coin.jsx'
import { useLocalStorage } from './useLocalStorage.js'

// ─── Constants ───────────────────────────────────────────────────────────────
const CATEGORIES = {
  income:  ['Job / Work', 'Allowance', 'Gifts', 'Selling Stuff', 'Freelance', 'Other Income'],
  expense: ['Food & Drinks', 'Entertainment', 'Clothes', 'Transportation', 'School', 'Subscriptions', 'Health', 'Other'],
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

const today = () => new Date().toISOString().split('T')[0]

let coinId = 0

// ─── Global styles injected once ─────────────────────────────────────────────
const STYLES = `
  @keyframes pigFloat {
    0%,100% { transform: translateY(0) rotate(-1.5deg); }
    50%      { transform: translateY(-9px) rotate(1.5deg); }
  }
  @keyframes pigHappy {
    0%   { transform: rotate(0deg) scale(1); }
    18%  { transform: rotate(-9deg) scale(1.09); }
    38%  { transform: rotate(9deg) scale(1.12); }
    58%  { transform: rotate(-4deg) scale(1.05); }
    78%  { transform: rotate(3deg) scale(1.02); }
    100% { transform: rotate(0deg) scale(1); }
  }
  @keyframes pigSad {
    0%   { transform: rotate(0deg); }
    18%  { transform: rotate(5deg) scale(0.96); }
    36%  { transform: rotate(-5deg) scale(0.95); }
    55%  { transform: rotate(3deg) scale(0.97); }
    75%  { transform: rotate(-2deg); }
    100% { transform: rotate(0deg); }
  }
  @keyframes coinDrop {
    0%   { transform: translateX(-50%) translateY(-60px) scale(0.3) rotate(-25deg); opacity: 0; }
    35%  { opacity: 1; transform: translateX(-50%) translateY(-8px) scale(1.15) rotate(12deg); }
    65%  { transform: translateX(-50%) translateY(2px) scale(0.88) rotate(-6deg); opacity: 1; }
    82%  { transform: translateX(-50%) translateY(-6px) scale(1.02); opacity: 0.8; }
    100% { transform: translateX(-50%) translateY(0) scale(0); opacity: 0; }
  }
  @keyframes coinFall {
    0%   { transform: translateX(-50%) translateY(0) scale(1) rotate(0deg); opacity: 1; }
    28%  { transform: translateX(-50%) translateY(24px) scale(1.1) rotate(18deg); opacity: 1; }
    60%  { transform: translateX(-50%) translateY(60px) scale(0.85) rotate(-12deg); opacity: 0.6; }
    100% { transform: translateX(-50%) translateY(100px) scale(0.2) rotate(35deg); opacity: 0; }
  }
  @keyframes slideUp {
    from { transform: translateY(24px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes sheetUp {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }
`

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({ emoji, label, amount, count, borderColor, textColor, subColor }) {
  return (
    <div style={{
      background: 'white', borderRadius: 18, padding: '16px 14px',
      border: `2px solid ${borderColor}`,
      boxShadow: `0 4px 16px ${borderColor}55`,
      flex: 1,
    }}>
      <div style={{ fontSize: 10, color: textColor, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, fontWeight: 800 }}>
        {emoji} {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 900, color: textColor }}>{fmt(amount)}</div>
      <div style={{ fontSize: 11, color: subColor, marginTop: 4, fontWeight: 600 }}>
        {count} item{count !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

function SpendBar({ cat, amt, total }) {
  const pct = total > 0 ? (amt / total) * 100 : 0
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{cat}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#ec4899' }}>{fmt(amt)}</span>
      </div>
      <div style={{ background: '#fce7f3', borderRadius: 99, height: 7 }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: 'linear-gradient(90deg, #ec4899, #f472b6)',
          borderRadius: 99, transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  )
}

function EntryRow({ entry, onDelete }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', marginBottom: 8,
      background: 'white', borderRadius: 16,
      border: `1.5px solid ${entry.type === 'income' ? '#bbf7d0' : '#fecaca'}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 13, flexShrink: 0,
        background: entry.type === 'income' ? '#dcfce7' : '#fee2e2',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
      }}>
        {entry.type === 'income' ? '💵' : '💸'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entry.note || entry.category}
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, fontWeight: 600 }}>
          {entry.category} · {entry.date}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: entry.type === 'income' ? '#16a34a' : '#dc2626' }}>
          {entry.type === 'income' ? '+' : '-'}{fmt(entry.amount)}
        </div>
        <button
          onClick={() => onDelete(entry.id)}
          style={{
            background: 'none', border: 'none', color: '#d1d5db',
            cursor: 'pointer', fontSize: 11, padding: 0, marginTop: 3,
            fontFamily: 'Nunito, sans-serif', fontWeight: 600,
          }}
        >
          remove
        </button>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', background: '#f9fafb',
  border: '1.5px solid #e5e7eb', borderRadius: 12,
  color: '#1f2937', padding: '13px 14px', fontSize: 15,
  fontFamily: 'Nunito, sans-serif', fontWeight: 600,
  marginBottom: 10, outline: 'none', appearance: 'none',
  WebkitAppearance: 'none', display: 'block',
}

// ─── Add Entry Sheet ──────────────────────────────────────────────────────────
function AddSheet({ onClose, onAdd }) {
  const [form, setForm] = useState({
    type: 'income', category: 'Job / Work', amount: '', note: '', date: today(),
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleTypeChange = (t) => {
    setForm(f => ({ ...f, type: t, category: CATEGORIES[t][0] }))
  }

  const handleSubmit = () => {
    const amt = parseFloat(form.amount)
    if (!amt || amt <= 0) return
    onAdd({ ...form, amount: amt, id: Date.now() })
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'flex-end',
        zIndex: 300, animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '24px 24px 0 0',
          padding: `24px 20px calc(24px + var(--safe-bottom))`,
          width: '100%', maxWidth: 480, margin: '0 auto',
          boxShadow: '0 -8px 40px rgba(236,72,153,0.15)',
          animation: 'sheetUp 0.3s cubic-bezier(.2,1,.4,1)',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {/* Handle */}
        <div style={{ width: 40, height: 4, background: '#e5e7eb', borderRadius: 99, margin: '0 auto 18px' }} />
        <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 900, color: '#1f2937', marginBottom: 20 }}>
          Add Entry
        </div>

        {/* Type toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {['income', 'expense'].map(t => (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              style={{
                flex: 1,
                background: form.type === t ? (t === 'income' ? '#dcfce7' : '#fee2e2') : '#f9fafb',
                border: `2px solid ${form.type === t ? (t === 'income' ? '#4ade80' : '#f87171') : '#e5e7eb'}`,
                borderRadius: 12, padding: '12px 0', fontSize: 14,
                color: form.type === t ? (t === 'income' ? '#166534' : '#991b1b') : '#6b7280',
                cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 800,
                transition: 'all 0.15s',
              }}
            >
              {t === 'income' ? '💵 Income' : '💸 Expense'}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, fontWeight: 800, color: '#9ca3af' }}>$</span>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={form.amount}
            onChange={e => set('amount', e.target.value)}
            style={{ ...inputStyle, paddingLeft: 28, marginBottom: 0 }}
          />
        </div>

        {/* Category */}
        <select
          value={form.category}
          onChange={e => set('category', e.target.value)}
          style={inputStyle}
        >
          {CATEGORIES[form.type].map(c => <option key={c}>{c}</option>)}
        </select>

        {/* Note */}
        <input
          type="text"
          placeholder="Note (e.g. Friday shift)"
          value={form.note}
          onChange={e => set('note', e.target.value)}
          style={inputStyle}
        />

        {/* Date */}
        <input
          type="date"
          value={form.date}
          onChange={e => set('date', e.target.value)}
          style={inputStyle}
        />

        <button
          onClick={handleSubmit}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #ec4899, #f472b6)',
            border: 'none', borderRadius: 14, color: 'white',
            padding: '15px 0', fontSize: 16, cursor: 'pointer',
            fontFamily: 'Nunito, sans-serif', fontWeight: 900,
            boxShadow: '0 4px 18px rgba(236,72,153,0.45)',
            marginTop: 4, letterSpacing: 0.3,
          }}
        >
          {form.type === 'income' ? '💰 Feed the Piggy!' : '💸 Record Expense'}
        </button>
      </div>
    </div>
  )
}

// ─── Home Tab ─────────────────────────────────────────────────────────────────
function HomeTab({ filtered, totals, fillPct, spendByCategory, coins, pigAnim, onAddPress }) {
  return (
    <div style={{ animation: 'slideUp 0.3s ease', paddingBottom: 20 }}>
      {/* Piggy stage */}
      <div style={{
        position: 'relative', margin: '20px auto 4px',
        width: 240, height: 215,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {coins.map(c => <Coin key={c.id} type={c.type} onDone={c.onDone} />)}
        <PiggyBank fillPct={fillPct} anim={pigAnim} />
      </div>

      {/* Net badge */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{
          display: 'inline-block',
          background: totals.net >= 0 ? '#dcfce7' : '#fee2e2',
          borderRadius: 99, padding: '6px 20px',
          fontSize: 13, fontWeight: 800,
          color: totals.net >= 0 ? '#166534' : '#991b1b',
          border: `1.5px solid ${totals.net >= 0 ? '#86efac' : '#fca5a5'}`,
        }}>
          {totals.net >= 0 ? '💰 ' : '😬 '}{fmt(totals.net)} saved this month
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <StatCard
          emoji="💵" label="Earned" amount={totals.income}
          count={filtered.filter(e => e.type === 'income').length}
          borderColor="#bbf7d0" textColor="#166534" subColor="#86efac"
        />
        <StatCard
          emoji="💸" label="Spent" amount={totals.expense}
          count={filtered.filter(e => e.type === 'expense').length}
          borderColor="#fecaca" textColor="#991b1b" subColor="#fca5a5"
        />
      </div>

      {/* Savings rate bar */}
      {totals.income > 0 && (
        <div style={{
          background: 'white', borderRadius: 18, padding: '14px 16px',
          border: '1px solid #fce7f3', marginBottom: 12,
          boxShadow: '0 2px 10px rgba(236,72,153,0.07)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#9ca3af', letterSpacing: 1.5, textTransform: 'uppercase' }}>Savings Rate</span>
            <span style={{ fontSize: 14, fontWeight: 900, color: totals.net >= 0 ? '#16a34a' : '#dc2626' }}>
              {Math.round((totals.net / totals.income) * 100)}%
            </span>
          </div>
          <div style={{ background: '#fce7f3', borderRadius: 99, height: 9, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.max(0, Math.min(100, (totals.net / totals.income) * 100))}%`,
              background: totals.net >= 0
                ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                : 'linear-gradient(90deg, #f87171, #ef4444)',
              borderRadius: 99, transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      )}

      {/* Spending breakdown */}
      {spendByCategory.length > 0 && (
        <div style={{
          background: 'white', borderRadius: 18, padding: '16px',
          border: '1px solid #fce7f3',
          boxShadow: '0 2px 10px rgba(236,72,153,0.07)',
          marginBottom: 12,
        }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: '#ec4899', textTransform: 'uppercase', fontWeight: 800, marginBottom: 14 }}>
            Where It Went
          </div>
          {spendByCategory.map(([cat, amt]) => (
            <SpendBar key={cat} cat={cat} amt={amt} total={totals.expense} />
          ))}

          {/* Tip */}
          <div style={{
            background: '#fff7ed', borderRadius: 12, padding: '10px 12px',
            marginTop: 10, border: '1px solid #fed7aa',
          }}>
            <span style={{ fontSize: 12, color: '#9a3412', fontWeight: 700 }}>
              💡 {spendByCategory[0][0]} is your top spend — cutting 20% saves {fmt(spendByCategory[0][1] * 0.2)} this month!
            </span>
          </div>
        </div>
      )}

      {totals.income === 0 && totals.expense === 0 && (
        <div style={{ textAlign: 'center', color: '#c084fc', padding: '16px 0', fontSize: 15, fontWeight: 700 }}>
          Tap <strong style={{ color: '#ec4899' }}>+</strong> to add your first entry!
        </div>
      )}
    </div>
  )
}

// ─── Log Tab ──────────────────────────────────────────────────────────────────
function LogTab({ filtered, monthLabel, onDelete, onAddPress }) {
  return (
    <div style={{ animation: 'slideUp 0.3s ease', paddingBottom: 20 }}>
      <button
        onClick={onAddPress}
        style={{
          width: '100%', marginTop: 16, marginBottom: 14,
          background: 'linear-gradient(135deg, #ec4899, #f472b6)',
          border: 'none', borderRadius: 16, color: 'white',
          padding: '15px 0', fontSize: 15, cursor: 'pointer',
          fontFamily: 'Nunito, sans-serif', fontWeight: 900,
          boxShadow: '0 4px 18px rgba(236,72,153,0.4)',
          letterSpacing: 0.3,
        }}
      >
        + Add Income or Expense
      </button>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#c084fc', padding: '36px 0', fontSize: 15, fontWeight: 700 }}>
          Nothing logged for {monthLabel} yet!
        </div>
      ) : (
        filtered.map(e => <EntryRow key={e.id} entry={e} onDelete={onDelete} />)
      )}
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [entries, setEntries] = useLocalStorage('piggybank-entries', [])
  const [tab, setTab] = useState('home')
  const [showSheet, setShowSheet] = useState(false)
  const [coins, setCoins] = useState([])
  const [pigAnim, setPigAnim] = useState('idle')

  const now = new Date()
  const [filterMonth, setFilterMonth] = useLocalStorage(
    'piggybank-month',
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  )

  const filtered = useMemo(() =>
    entries
      .filter(e => e.date.startsWith(filterMonth))
      .sort((a, b) => b.date.localeCompare(a.date)),
    [entries, filterMonth]
  )

  const totals = useMemo(() => {
    const income  = filtered.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0)
    const expense = filtered.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0)
    return { income, expense, net: income - expense }
  }, [filtered])

  const fillPct = useMemo(() =>
    totals.income === 0 ? 0 : Math.max(0, Math.min(100, (totals.net / totals.income) * 100)),
    [totals]
  )

  const spendByCategory = useMemo(() => {
    const map = {}
    filtered.filter(e => e.type === 'expense').forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [filtered])

  const fireCoin = useCallback((type) => {
    const id = ++coinId
    const onDone = () => setCoins(prev => prev.filter(c => c.id !== id))
    setCoins(prev => [...prev, { id, type, onDone }])
    setPigAnim(type === 'income' ? 'happy' : 'sad')
    setTimeout(() => setPigAnim('idle'), 750)
  }, [])

  const handleAdd = useCallback((entry) => {
    setEntries(prev => [...prev, entry])
    fireCoin(entry.type)
    setTab('home')
  }, [fireCoin, setEntries])

  const handleDelete = useCallback((id) => {
    setEntries(prev => prev.filter(e => e.id !== id))
  }, [setEntries])

  const [yr, mo] = filterMonth.split('-')
  const monthLabel = `${MONTH_NAMES[+mo - 1]} ${yr}`

  return (
    <>
      <style>{STYLES}</style>

      <div style={{
        minHeight: '-webkit-fill-available',
        background: 'linear-gradient(160deg, #fff0f8 0%, #fce7f3 45%, #f5f0ff 100%)',
        display: 'flex', flexDirection: 'column',
        overflowX: 'hidden',
      }}>
        {/* ── Header ── */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(236,72,153,0.92), rgba(244,114,182,0.88))',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: `calc(var(--safe-top) + 16px) 20px 14px`,
          position: 'sticky', top: 0, zIndex: 100,
          borderBottom: '1px solid rgba(249,168,212,0.35)',
          boxShadow: '0 4px 20px rgba(236,72,153,0.2)',
        }}>
          <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: 4, color: '#fce7f3', textTransform: 'uppercase', opacity: 0.85, fontWeight: 800 }}>
                My Piggy Bank
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'white', letterSpacing: -0.5, fontFamily: "'Playfair Display', serif" }}>
                {monthLabel}
              </div>
            </div>
            <input
              type="month"
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: 10, color: 'white', padding: '7px 11px',
                fontSize: 12, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 700,
              }}
            />
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ maxWidth: 480, width: '100%', margin: '0 auto', padding: '0 16px' }}>
          <div style={{
            display: 'flex', gap: 4,
            margin: '14px 0 0',
            background: 'rgba(236,72,153,0.1)',
            borderRadius: 14, padding: 4,
          }}>
            {[['home', '🐷 Bank'], ['log', '📝 Log']].map(([t, label]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1, background: tab === t ? 'white' : 'transparent',
                  border: 'none', borderRadius: 10,
                  color: tab === t ? '#ec4899' : '#c084fc',
                  padding: '9px 0', fontSize: 13, cursor: 'pointer',
                  fontFamily: 'Nunito, sans-serif',
                  fontWeight: tab === t ? 900 : 700,
                  boxShadow: tab === t ? '0 2px 10px rgba(236,72,153,0.18)' : 'none',
                  transition: 'all 0.18s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{
          flex: 1, maxWidth: 480, width: '100%',
          margin: '0 auto', padding: '0 16px',
          overflowY: 'auto',
        }}>
          {tab === 'home' && (
            <HomeTab
              filtered={filtered}
              totals={totals}
              fillPct={fillPct}
              spendByCategory={spendByCategory}
              coins={coins}
              pigAnim={pigAnim}
              onAddPress={() => setShowSheet(true)}
            />
          )}
          {tab === 'log' && (
            <LogTab
              filtered={filtered}
              monthLabel={monthLabel}
              onDelete={handleDelete}
              onAddPress={() => setShowSheet(true)}
            />
          )}
        </div>

        {/* ── FAB (home tab only) ── */}
        {tab === 'home' && (
          <button
            onClick={() => setShowSheet(true)}
            style={{
              position: 'fixed',
              bottom: `calc(28px + var(--safe-bottom))`,
              right: 24,
              width: 58, height: 58, borderRadius: '50%',
              background: 'linear-gradient(135deg, #ec4899, #f472b6)',
              border: 'none', color: 'white', fontSize: 30,
              cursor: 'pointer',
              boxShadow: '0 4px 22px rgba(236,72,153,0.65)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 150, fontFamily: 'Nunito, sans-serif',
              transition: 'transform 0.15s',
            }}
            onTouchStart={e => e.currentTarget.style.transform = 'scale(0.93)'}
            onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            +
          </button>
        )}

        {/* ── Add Sheet ── */}
        {showSheet && (
          <AddSheet
            onClose={() => setShowSheet(false)}
            onAdd={handleAdd}
          />
        )}
      </div>
    </>
  )
}
