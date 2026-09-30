import type { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  icon?: ReactNode;
  /** Imagem de destaque (ex.: mascote). Se existir, substitui o ícone. */
  image?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, image, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border px-6 py-10 text-center">
      {image ? <img src={image} alt="" loading="lazy" className="mb-1 h-28 w-auto max-w-[8rem] object-contain opacity-35 grayscale-[0.85]" /> : icon && <div className="text-ink-faint">{icon}</div>}
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description && <p className="max-w-xs text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
