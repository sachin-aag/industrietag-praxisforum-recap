/** The sunrise arc borrowed from Gamechangerz, set on Schetter blue. Purely decorative. */
export function Horizon({ id = "hz" }: { id?: string }) {
  return (
    <svg className="horizon" viewBox="0 0 1440 360" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-stroke`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#18A0F5" stopOpacity="0" />
          <stop offset="0.18" stopColor="#18A0F5" />
          <stop offset="0.38" stopColor="#8A24DF" />
          <stop offset="0.5" stopColor="#FFC926" />
          <stop offset="0.62" stopColor="#E2307F" />
          <stop offset="0.82" stopColor="#18A0F5" />
          <stop offset="1" stopColor="#18A0F5" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-sun`} cx="0.5" cy="1" r="0.6">
          <stop offset="0" stopColor="#FFC926" stopOpacity="0.55" />
          <stop offset="0.35" stopColor="#FF7A3D" stopOpacity="0.25" />
          <stop offset="1" stopColor="#8A24DF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-earth`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#1A2F6B" />
          <stop offset="1" stopColor="#121F4A" />
        </linearGradient>
        <filter id={`${id}-blur`} x="-10%" y="-50%" width="120%" height="200%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      <ellipse className="horizon-sun" cx="720" cy="150" rx="620" ry="150" fill={`url(#${id}-sun)`} />
      <path d="M-120 360 Q720 60 1560 360 Z" fill={`url(#${id}-earth)`} />
      <path
        className="horizon-glow"
        d="M-120 360 Q720 60 1560 360"
        fill="none"
        stroke={`url(#${id}-stroke)`}
        strokeWidth="14"
        filter={`url(#${id}-blur)`}
      />
      <path d="M-120 360 Q720 60 1560 360" fill="none" stroke={`url(#${id}-stroke)`} strokeWidth="2.5" />
    </svg>
  );
}
