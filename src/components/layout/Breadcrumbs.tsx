import { Link } from "react-router-dom";

export interface Crumb { name: string; to: string }

// Trilho de navegação com ligações <a href> reais (o último item é a página actual, sem ligação).
export function Breadcrumbs({ trail, current }: { trail: Crumb[]; current: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 text-sm text-ink-muted">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {trail.map((c) => (
          <li key={c.to} className="flex items-center gap-1.5">
            <Link to={c.to} className="hover:text-ink hover:underline">{c.name}</Link>
            <span aria-hidden="true">/</span>
          </li>
        ))}
        <li aria-current="page" className="min-w-0 truncate font-medium text-ink">{current}</li>
      </ol>
    </nav>
  );
}
