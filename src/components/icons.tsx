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
export function WalletIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a2 2 0 0 1 2 2v2" /><path d="M4 7.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8H6.5A2.5 2.5 0 0 1 4 6.5" /><circle cx="16.5" cy="14" r="1.2" /></svg>);
}
export function ChatIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-3.9A8 8 0 1 1 20 12Z" /><path d="M9 12h.01M12 12h.01M15 12h.01" /></svg>);
}

// --- Rodapé e navegação ---
export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="m3 11 9-8 9 8" /><path d="M5 10v10h5v-6h4v6h5V10" /></svg>);
}
export function GridIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>);
}
export function LogInIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" /></svg>);
}
export function UserPlusIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><circle cx="9" cy="8" r="4" /><path d="M2 20c0-3.6 3.1-6 7-6s7 2.4 7 6M19 8v6M16 11h6" /></svg>);
}
export function DocumentIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></svg>);
}
export function ShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M12 3 4 6v6c0 4.5 3.2 7.8 8 9 4.8-1.2 8-4.5 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></svg>);
}
export function CookieIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M12 3a9 9 0 1 0 9 9 4 4 0 0 1-4-4 4 4 0 0 1-5-5Z" /><path d="M8.5 11h.01M12 16h.01M15.5 13h.01" /></svg>);
}
export function ArrowUpRightIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M7 17 17 7M8 7h9v9" /></svg>);
}
export function ArrowUpIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M12 19V5M5 12l7-7 7 7" /></svg>);
}
export function ArrowRightIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M5 12h14M12 5l7 7-7 7" /></svg>);
}
export function SparkIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="M19 16v4M17 18h4" /></svg>);
}
export function PinIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>);
}
export function MailIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>);
}
export function PhoneIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>);
}

// --- Perfil / partilha ---
export function ShareIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><circle cx="18" cy="5" r="2.6" /><circle cx="6" cy="12" r="2.6" /><circle cx="18" cy="19" r="2.6" /><path d="m8.3 10.8 7.4-4.4M8.3 13.2l7.4 4.4" /></svg>);
}
export function LinkIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" /><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" /></svg>);
}
export function GiftIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8M12 8v13" /><path d="M12 8c-1.5-4-6-4-6-1.5C6 8 9 8 12 8Zm0 0c1.5-4 6-4 6-1.5C18 8 15 8 12 8Z" /></svg>);
}
