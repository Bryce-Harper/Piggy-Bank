export default function PiggyBank({ fillPct = 0, anim = 'idle' }) {
  return (
    <svg
      viewBox="0 0 180 155"
      width="220"
      height="190"
      style={{
        filter: 'drop-shadow(0 10px 28px rgba(236,72,153,0.35))',
        animation:
          anim === 'happy' ? 'pigHappy 0.55s ease' :
          anim === 'sad'   ? 'pigSad 0.65s ease'   :
          'pigFloat 3.2s ease-in-out infinite',
        transformOrigin: '50% 90%',
        display: 'block',
        margin: '0 auto',
      }}
    >
      {/* Coin slot */}
      <rect x="83" y="11" width="18" height="6" rx="3" fill="#be185d" />
      <rect x="87" y="7"  width="10" height="6" rx="3" fill="#9d174d" />

      {/* Ear */}
      <ellipse cx="42" cy="50" rx="15" ry="11" fill="#f9a8d4" />
      <ellipse cx="42" cy="50" rx="9"  ry="7"  fill="#fce7f3" />

      {/* Body */}
      <ellipse cx="98" cy="88" rx="62" ry="52" fill="#fbcfe8" />

      {/* Belly savings fill */}
      {fillPct > 0 && (
        <>
          <defs>
            <clipPath id="bellyClip">
              <ellipse cx="98" cy="88" rx="56" ry="46" />
            </clipPath>
          </defs>
          <rect
            x="42"
            y={88 + 46 - (fillPct / 100) * 92}
            width="112"
            height={(fillPct / 100) * 92}
            fill="#4ade80"
            opacity="0.28"
            clipPath="url(#bellyClip)"
          />
        </>
      )}

      {/* Snout */}
      <ellipse cx="151" cy="93" rx="20" ry="16" fill="#f472b6" />
      <circle cx="145" cy="91" r="4.5" fill="#be185d" opacity="0.55" />
      <circle cx="157" cy="91" r="4.5" fill="#be185d" opacity="0.55" />

      {/* Eye */}
      <circle cx="128" cy="70" r="7" fill="white" />
      <circle
        cx={anim === 'sad' ? 127 : 130}
        cy={anim === 'sad' ? 73  : 69}
        r="4"
        fill="#1e1b4b"
      />
      <circle
        cx={anim === 'sad' ? 128 : 131}
        cy={anim === 'sad' ? 72  : 68}
        r="1.5"
        fill="white"
      />

      {/* Cheek */}
      <ellipse cx="120" cy="87" rx="11" ry="7" fill="#f9a8d4" opacity="0.35" />

      {/* Mouth */}
      {anim === 'sad'
        ? <path d="M135 103 Q143 99 151 103" stroke="#be185d" strokeWidth="3" fill="none" strokeLinecap="round" />
        : <path d="M135 100 Q143 106 151 100" stroke="#be185d" strokeWidth="3" fill="none" strokeLinecap="round" />
      }

      {/* Legs */}
      {[62, 80, 100, 118].map((x, i) => (
        <rect key={i} x={x} y="130" width="16" height="20" rx="8" fill="#f472b6" />
      ))}

      {/* Tail */}
      <path
        d="M36 86 Q20 74 24 60 Q28 46 20 40"
        stroke="#f472b6" strokeWidth="4.5" fill="none" strokeLinecap="round"
      />
    </svg>
  )
}
