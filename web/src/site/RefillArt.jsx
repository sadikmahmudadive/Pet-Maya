// Illustration for the "Auto-refill. 5% off." promo card: an open delivery box with a food bag and a medicine bottle in
// it, a refill-cycle badge on the front and a 5% sticker. Drawn with the site's colour tokens only, so it reads in the
// light theme (gold on a pale yellow tile) and the dark theme (light gold on a dark tile) without separate artwork.
export default function RefillArt({ className = '', style }) {
  return (
    <svg
      className={`refill-art ${className}`.trim()}
      style={{ width: 150, height: 130, flex: 'none', overflow: 'visible', ...style }}
      viewBox="0 0 160 140"
      role="img"
      aria-label="A delivery box with pet food and medicine, set to refill automatically"
    >
      <title>Auto-refill delivery box</title>

      {/* ground shadow */}
      <ellipse cx="80" cy="128" rx="50" ry="6" fill="var(--ink)" opacity="0.12" />

      {/* back flaps of the open box */}
      <path d="M30 56 L16 30 L64 22 L72 52 Z" fill="var(--yellow-ink)" fillOpacity="0.16" stroke="var(--yellow-ink)" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M130 56 L144 30 L96 22 L88 52 Z" fill="var(--yellow-ink)" fillOpacity="0.16" stroke="var(--yellow-ink)" strokeWidth="2.2" strokeLinejoin="round" />

      {/* things in the box */}
      <g transform="rotate(-7 60 52)">
        <rect x="42" y="20" width="36" height="48" rx="7" fill="var(--teal)" fillOpacity="0.28" stroke="var(--teal)" strokeWidth="2.2" />
        <path d="M42 32 H78" stroke="var(--teal)" strokeWidth="2" opacity="0.7" />
        {/* paw print on the food bag */}
        <g fill="var(--teal)">
          <ellipse cx="60" cy="53" rx="6.5" ry="5.2" />
          <circle cx="50.5" cy="44.5" r="2.6" />
          <circle cx="56" cy="40.5" r="2.6" />
          <circle cx="64" cy="40.5" r="2.6" />
          <circle cx="69.5" cy="44.5" r="2.6" />
        </g>
      </g>
      <g className="refill-bob">
        <rect x="88" y="26" width="24" height="42" rx="6" fill="var(--surface)" stroke="var(--teal)" strokeWidth="2.2" />
        <rect x="86" y="18" width="28" height="12" rx="4" fill="var(--teal)" />
        <rect x="93" y="38" width="14" height="16" rx="3" fill="var(--teal)" fillOpacity="0.22" />
        <path d="M100 41 V51 M95 46 H105" stroke="var(--teal)" strokeWidth="2.4" strokeLinecap="round" />
      </g>

      {/* front of the box with a strip of tape */}
      <path d="M26 56 H134 V114 a9 9 0 0 1 -9 9 H35 a9 9 0 0 1 -9 -9 Z" fill="var(--yellow-ink)" fillOpacity="0.3" stroke="var(--yellow-ink)" strokeWidth="2.6" strokeLinejoin="round" />
      <rect x="73" y="56" width="14" height="24" fill="var(--yellow-ink)" fillOpacity="0.5" />

      {/* refill badge: two arrows chasing each other */}
      <circle cx="80" cy="95" r="22" fill="var(--surface)" stroke="var(--yellow-ink)" strokeWidth="2.4" />
      {/* position and size sit on the outer group; only the inner one turns (a CSS rotation would replace a transform
          attribute on the same element and throw the arrows out of place) */}
      <g transform="translate(64 79) scale(1.333)">
        <g className="refill-spin" fill="none" stroke="var(--teal)" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M8 16H3v5" />
        </g>
      </g>

      {/* 5% off sticker */}
      <g transform="rotate(12 130 30)">
        <circle cx="130" cy="30" r="17" fill="var(--yellow-ink)" />
        <circle cx="130" cy="30" r="13.5" fill="none" stroke="var(--surface)" strokeWidth="1.2" strokeDasharray="2.5 2.5" opacity="0.7" />
        <text x="130" y="35" textAnchor="middle" fontSize="13.5" fontWeight="700" fill="var(--surface)" style={{ fontFamily: 'var(--sans, system-ui, sans-serif)' }}>5%</text>
      </g>

      {/* sparkles */}
      <g stroke="var(--yellow-ink)" strokeWidth="2.2" strokeLinecap="round" opacity="0.75">
        <path d="M18 70 V80 M13 75 H23" />
        <path d="M146 78 V84 M143 81 H149" />
      </g>
    </svg>
  );
}
