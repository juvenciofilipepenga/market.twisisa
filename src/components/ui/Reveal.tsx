import type { CSSProperties, ElementType, ReactNode } from "react";
import { useInView } from "@/lib/useInView";

interface RevealProps {
  as?: ElementType;
  variant?: "up" | "scale" | "fade";
  /** Atraso em ms — usar para escalonar itens de uma lista. */
  delay?: number;
  className?: string;
  children: ReactNode;
}

// Faz o conteúdo surgir quando entra no ecrã (só opacity/transform, barato em telemóveis fracos).
// As regras vivem em index.css (.reveal) e são desligadas com prefers-reduced-motion.
export function Reveal({ as, variant = "up", delay = 0, className = "", children }: RevealProps) {
  const Tag: ElementType = as ?? "div";
  const [ref, inView] = useInView<HTMLElement>();
  return (
    <Tag
      ref={ref}
      className={`reveal reveal-${variant} ${inView ? "is-in" : ""} ${className}`.trim()}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
