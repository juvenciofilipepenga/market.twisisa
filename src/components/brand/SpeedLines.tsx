// As linhas de velocidade à esquerda do carrinho do logótipo, usadas como motivo da marca.
// Decorativo: aria-hidden. A animação de entrada vive em index.css (.speed-line).
export function SpeedLines({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 160 70" fill="currentColor" className={className}>
      <rect className="speed-line" x="0" y="0" width="120" height="9" rx="4.5" />
      <rect className="speed-line" x="22" y="20" width="110" height="9" rx="4.5" />
      <rect className="speed-line" x="8" y="40" width="96" height="9" rx="4.5" />
      <rect className="speed-line" x="34" y="60" width="80" height="9" rx="4.5" />
    </svg>
  );
}
