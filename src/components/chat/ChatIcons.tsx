// Ícones só do chat (mesmo estilo de ../icons.tsx: SVG 24x24 a traço). Os botões do chat usam só ícones,
// por isso cada um leva sempre aria-label e title no sítio onde é usado.
import type { SVGProps } from "react";

function base(props: SVGProps<SVGSVGElement>) {
  return { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, ...props };
}

export function SendIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7Z" /></svg>);
}
export function PaperclipIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="m21.4 11.6-8.5 8.5a5.5 5.5 0 0 1-7.8-7.8l8.5-8.5a3.7 3.7 0 0 1 5.2 5.2l-8.5 8.5a1.8 1.8 0 0 1-2.6-2.6l7.8-7.8" /></svg>);
}
export function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);
}
export function SingleCheckIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>);
}
export function DoubleCheckIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M18 6 7 17l-5-5" /><path d="m22 10-7.5 7.5L13 16" /></svg>);
}
export function RetryIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>);
}
export function ZoomInIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3M11 8v6M8 11h6" /></svg>);
}
export function ZoomOutIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3M8 11h6" /></svg>);
}
export function BotIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><rect x="4" y="8" width="16" height="12" rx="3" /><path d="M12 8V5M9 13v1.5M15 13v1.5M9.5 17.5h5" /><circle cx="12" cy="3.8" r="1" /></svg>);
}
export function HeadsetIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="14" width="4" height="6" rx="1.5" /><rect x="17" y="14" width="4" height="6" rx="1.5" /><path d="M19 20c0 1.5-2 2-5 2" /></svg>);
}
export function CheckCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><circle cx="12" cy="12" r="9" /><path d="m8 12.5 3 3 5-6" /></svg>);
}
export function BookIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" /><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20" /></svg>);
}
export function PencilIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></svg>);
}
export function FileIcon(props: SVGProps<SVGSVGElement>) {
  return (<svg {...base(props)}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" /><path d="M14 3v5h5" /></svg>);
}
