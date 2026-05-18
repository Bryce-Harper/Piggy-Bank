import { useEffect } from 'react'

export default function Coin({ type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 950)
    return () => clearTimeout(t)
  }, [onDone])

  const isIncome = type === 'income'

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: isIncome ? '4%' : '74%',
        transform: 'translateX(-50%)',
        width: 26,
        height: 26,
        borderRadius: '50%',
        background: isIncome
          ? 'radial-gradient(circle at 35% 35%, #ffe566, #e09800)'
          : 'radial-gradient(circle at 35% 35%, #d1d5db, #6b7280)',
        border: isIncome ? '2.5px solid #b45309' : '2.5px solid #4b5563',
        boxShadow: isIncome ? '0 2px 10px rgba(245,158,11,0.6)' : '0 2px 8px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: '900',
        color: isIncome ? '#78350f' : '#374151',
        pointerEvents: 'none',
        zIndex: 30,
        animation: isIncome
          ? 'coinDrop 0.9s cubic-bezier(.3,1.4,.5,1) forwards'
          : 'coinFall 0.9s cubic-bezier(.4,0,.8,1.3) forwards',
      }}
    >
      $
    </div>
  )
}
