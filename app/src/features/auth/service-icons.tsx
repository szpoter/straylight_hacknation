// Ikony ekranów eZUS i login.gov.pl odrysowane ze zrzutów (do podmiany na grafiki od zespołu).
// Kolor z currentColor, rozmiar ustawia CSS.

type IconProps = { className?: string };

/** Telefon w obrysie: „Aplikacja mobilna ZUS” i „Aplikacja mObywatel”. */
export function PhoneOutlineIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 26 44" fill="none" aria-hidden="true">
      <rect x="1.6" y="1.6" width="22.8" height="40.8" rx="5" stroke="currentColor" strokeWidth="2.6" />
      <path d="M9.5 6.2h7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M9.5 36.6h7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

/** login.gov.pl: otwarta tarcza ze strzałką wchodzącą od lewej. */
export function LoginGovIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 38 43" fill="none" aria-hidden="true">
      <path
        d="M3 13.5V9.6L24.5 2.2M3 29.5v3.6l17.5 8.2 15.3-9.8V10.2L24.5 5.8"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3 21.5h19M16.5 15.5l6 6-6 6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 10 18" fill="none" aria-hidden="true">
      <path d="M1.6 1.6 8.4 9l-6.8 7.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowBackIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 16" fill="none" aria-hidden="true">
      <path d="M19 8H2M8 1.5 1.5 8 8 14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Zegar z kropkowanym łukiem: „Kod straci ważność za …”. */
export function TimerIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2.2a9.8 9.8 0 1 1-9.8 9.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M2.6 8.6h0M4.4 5.6h0M7.2 3.4h0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M12 7.2V12H8.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LockIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 18" fill="none" aria-hidden="true">
      <rect x="1.5" y="7.5" width="13" height="9" rx="1.8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.5 7.5V5a3.5 3.5 0 0 1 7 0v2.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

/** Bankowość elektroniczna: budynek z kolumnami. */
export function BankIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 34" fill="currentColor" aria-hidden="true">
      <path d="M16 1 1.5 9.6v2.2h29V9.6L16 1Zm0 4.6a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" fillRule="evenodd" />
      <rect x="4" y="14" width="2.8" height="11" rx="0.6" />
      <rect x="10.4" y="14" width="2.8" height="11" rx="0.6" />
      <rect x="18.8" y="14" width="2.8" height="11" rx="0.6" />
      <rect x="25.2" y="14" width="2.8" height="11" rx="0.6" />
      <rect x="2.5" y="27" width="27" height="2.4" rx="0.6" />
      <rect x="1" y="31" width="30" height="2.4" rx="0.6" />
    </svg>
  );
}

/** E-dowód: zakręcone „e” z warstwami. */
export function EDowodIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <path d="M31.5 25.5A15.5 15.5 0 1 1 32 15.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M27.4 23.6A11 11 0 1 1 28 15.8H12" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M22.8 21.4A6.4 6.4 0 1 1 23.4 15.8" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

/** Profil zaufany: tarcza z profilem twarzy i kropkami. */
export function TrustedProfileIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 30 33" aria-hidden="true">
      <path d="M15 1.5 2 6v11.2C2 25 8 30 15 31.8 22 30 28 25 28 17.2V6L15 1.5Z" fill="currentColor" />
      <path
        d="M9.4 9.2c2.4-.6 4.2.6 4.6 2.6.3 1.4-.3 2.5.3 3.4l1.6 2.3-1.7.7.2 2.2c.1 1.5-1 2.4-2.6 2.2l-1.6-.2.2 3"
        fill="none"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g fill="#fff">
        <circle cx="19.5" cy="9.5" r="1.2" />
        <circle cx="23" cy="12" r="1.2" />
        <circle cx="19.5" cy="13.8" r="1.2" />
        <circle cx="23" cy="16.6" r="1.2" />
        <circle cx="19.8" cy="18.6" r="1.2" />
        <circle cx="22.4" cy="21.4" r="1.2" />
      </g>
    </svg>
  );
}

function Star({ x, y }: { x: number; y: number }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(1.3)`}
      d="M0-2.6.62-.85 2.47-.8 1-.33 1.53 1.47 0 .42-1.53 1.47-1-.33-2.47-.8-.62-.85Z"
    />
  );
}

/** eID: krąg dwunastu gwiazdek. */
export function EuStarsIcon({ className }: IconProps) {
  const stars = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    // Zaokrąglenie do setnych: serwer i przeglądarka liczą sin/cos tak samo dopiero po nim
    return { x: Math.round((16 + 12 * Math.sin(angle)) * 100) / 100, y: Math.round((16 - 12 * Math.cos(angle)) * 100) / 100 };
  });
  return (
    <svg className={className} viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      {stars.map((star, i) => (
        <Star key={i} x={star.x} y={star.y} />
      ))}
    </svg>
  );
}
