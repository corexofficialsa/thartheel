export function QuranStandIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 420 360" className={className} role="img" aria-label="An open Qur'an resting on a rehal stand">
      <defs>
        <radialGradient id="qs-glow" cx="50%" cy="38%" r="60%">
          <stop offset="0%" stopColor="#d9b96a" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#d9b96a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="qs-page-left" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbf8f1" />
          <stop offset="100%" stopColor="#ece2c8" />
        </linearGradient>
        <linearGradient id="qs-page-right" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fbf8f1" />
          <stop offset="100%" stopColor="#ece2c8" />
        </linearGradient>
        <linearGradient id="qs-wood" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e3c079" />
          <stop offset="100%" stopColor="#a9812f" />
        </linearGradient>
      </defs>

      <ellipse cx="210" cy="150" rx="190" ry="170" fill="url(#qs-glow)" />
      <ellipse cx="210" cy="322" rx="110" ry="10" fill="#000000" opacity="0.22" />

      <g stroke="url(#qs-wood)" strokeWidth="13" strokeLinecap="round" fill="none">
        <path d="M212 178 L92 316" />
        <path d="M212 178 L332 316" />
        <path d="M150 316 L274 178" opacity="0.55" />
      </g>
      <rect x="150" y="192" width="124" height="11" rx="5.5" fill="url(#qs-wood)" />

      <path
        d="M212 112 L118 133 L108 196 L212 189 Z"
        fill="url(#qs-page-left)"
        stroke="#d8c9a3"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M212 112 L306 133 L316 196 L212 189 Z"
        fill="url(#qs-page-right)"
        stroke="#d8c9a3"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M212 112 L196 118 L200 184 L212 189 Z" fill="#000000" opacity="0.06" />
      <path d="M212 112 L228 118 L224 184 L212 189 Z" fill="#000000" opacity="0.06" />
      <rect x="209" y="110" width="6" height="80" rx="3" fill="#c9a24f" />

      <path d="M211 150 L219 150 L221 244 L215 258 L209 244 Z" fill="#c9a24f" opacity="0.9" />
    </svg>
  );
}
