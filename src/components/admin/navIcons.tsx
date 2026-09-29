// Ícones adicionais, usados só dentro do admin (mantidos separados de components/icons.tsx
// para não misturar o vocabulário visual da loja com o do painel administrativo).
import type { SVGProps } from "react";

function base(props: SVGProps<SVGSVGElement>) {
  return { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, ...props };
}

export function LayoutDashboardIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><rect x="3" y="3" width="8" height="10" rx="1.5" /><rect x="13" y="3" width="8" height="6" rx="1.5" /><rect x="13" y="11" width="8" height="10" rx="1.5" /><rect x="3" y="15" width="8" height="6" rx="1.5" /></svg>);
}
export function PackageNavIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8M12 13v8" /></svg>);
}
export function TagsNavIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M20.6 12.9 12.9 20.6a2 2 0 0 1-2.8 0l-6.7-6.7a2 2 0 0 1 0-2.8L11.1 3.4A2 2 0 0 1 12.5 3H19a2 2 0 0 1 2 2v6.5a2 2 0 0 1-.4 1.4Z" /><circle cx="15.5" cy="8.5" r="1.3" /></svg>);
}
export function OrdersNavIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M9 11h6M9 15h6" /></svg>);
}
export function UsersNavIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17.5" cy="9" r="2.3" /><path d="M15.5 14.2c2.5.4 4.5 2.5 4.5 5.3" /></svg>);
}
export function ChatNavIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M4 5h16v11H8l-4 4V5Z" /></svg>);
}
export function StoreNavIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M4 9V4h16v5M4 9l1.5 11h13L20 9M4 9h16" /></svg>);
}
