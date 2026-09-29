// Ícones SVG desenhados à mão (stroke, 24x24) para não depender de nenhuma biblioteca de ícones.
// Mantidos deliberadamente ao mínimo: só os usados pela interface (não polui com um set inteiro).
import type { SVGProps } from "react";

function base(props: SVGProps<SVGSVGElement>) {
  return { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, ...props };
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>);
}
export function BellIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M9.5 20a2.5 2.5 0 0 0 5 0" /></svg>);
}
export function CartIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><circle cx="9" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" /><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6" /></svg>);
}
export function GlobeIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z" /></svg>);
}
export function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="m15 18-6-6 6-6" /></svg>);
}
export function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="m9 18 6-6-6-6" /></svg>);
}
export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M12 5v14M5 12h14" /></svg>);
}
export function MinusIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M5 12h14" /></svg>);
}
export function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M4 7h16M9 7V4h6v3m-8 0 1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" /></svg>);
}
export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M20 6 9 17l-5-5" /></svg>);
}
export function XIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M18 6 6 18M6 6l12 12" /></svg>);
}
export function BoxIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8M12 13v8" /></svg>);
}
export function TagIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M20.6 12.9 12.9 20.6a2 2 0 0 1-2.8 0l-6.7-6.7a2 2 0 0 1 0-2.8L11.1 3.4A2 2 0 0 1 12.5 3H19a2 2 0 0 1 2 2v6.5a2 2 0 0 1-.4 1.4Z" /><circle cx="15.5" cy="8.5" r="1.3" /></svg>);
}
export function ClipboardIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M9 11h6M9 15h6" /></svg>);
}
export function LogOutIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>);
}
export function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>);
}
