import type { ReactNode } from "react";
import type { ChatAttachment } from "@/lib/types";
import type { ChatRole, LocalMessage } from "./useChatSession";
import { BotIcon, ClockIcon, DoubleCheckIcon, FileIcon, HeadsetIcon, RetryIcon, SingleCheckIcon } from "./ChatIcons";

function InlineText({ text }: { text: string }) {
  // Markdown pequeno e seguro, sem HTML injectado: **negrito**, *itálico*, ~~rasurado~~, `código` e links.
  const pattern = /(\*\*[^*]+\*\*|(?<!\*)\*[^*]+\*(?!\*)|~~[^~]+~~|`[^`]+`|https?:\/\/[^\s]+)/g;
  const parts = text.split(pattern);
  const nodes: ReactNode[] = parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
    if (part.startsWith("~~") && part.endsWith("~~") && part.length > 4) return <del key={i}>{part.slice(2, -2)}</del>;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) return <code key={i} className="rounded bg-black/10 px-1 py-0.5 font-mono text-[.92em]">{part.slice(1, -1)}</code>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
    if (/^https?:\/\//.test(part)) return <a key={i} href={part} target="_blank" rel="noreferrer" className="break-all underline underline-offset-2">{part}</a>;
    return part;
  });
  return <>{nodes}</>;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Attachment({ attachment, preview, fileName, mine, pt, onOpen }: {
  attachment: ChatAttachment;
  preview: string | undefined;
  fileName: string | undefined;
  mine: boolean;
  pt: boolean;
  onOpen: () => void;
}) {
  const isImage = attachment.mimeType.startsWith("image/");
  if (isImage) {
    const url = preview || attachment.url;
    if (!url) return null;
    const label = pt ? "Ver imagem" : "View image";
    return (
      <button type="button" onClick={onOpen} aria-label={label} title={label} className="chat-image-attachment mt-2 block w-full overflow-hidden rounded-xl">
        <img src={url} alt={pt ? "Imagem enviada na conversa" : "Image sent in the conversation"} loading="lazy" className="max-h-64 w-full max-w-full object-contain" />
      </button>
    );
  }
  const label = pt ? "Ver documento" : "View document";
  return (
    <button type="button" onClick={onOpen} aria-label={label} title={label} className={`mt-2 flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs ${mine ? "border-white/25 bg-black/10" : "border-border bg-elevated"}`}>
      <FileIcon width={20} height={20} />
      <span className="min-w-0 flex-1 truncate">{fileName ?? (pt ? "Documento PDF" : "PDF document")}</span>
      <span className="shrink-0 opacity-70">{formatBytes(attachment.sizeBytes)}</span>
    </button>
  );
}

// Estado de uma mensagem enviada: a enviar (relógio), enviada (um visto), vista (dois vistos coloridos), falhou (tentar de novo).
function DeliveryState({ message, mine, pt, onRetry }: { message: LocalMessage; mine: boolean; pt: boolean; onRetry: () => void }) {
  if (message.localState === "pending") {
    const label = pt ? "A enviar" : "Sending";
    return <span role="img" aria-label={label} title={label}><ClockIcon width={13} height={13} /></span>;
  }
  if (message.localState === "failed") {
    const label = pt ? "Falhou. Tocar para tentar de novo" : "Failed. Tap to retry";
    return (
      <button type="button" onClick={onRetry} aria-label={label} title={label} className="inline-flex items-center gap-1 font-semibold underline">
        <RetryIcon width={13} height={13} />
        <span>{pt ? "Falhou" : "Failed"}</span>
      </button>
    );
  }
  if (message.readAt) {
    const label = pt ? "Visto" : "Seen";
    return <span role="img" aria-label={label} title={label} className={mine ? "text-[#8be9ff]" : "text-info"}><DoubleCheckIcon width={15} height={15} /></span>;
  }
  const label = pt ? "Enviado" : "Sent";
  return <span role="img" aria-label={label} title={label}><SingleCheckIcon width={14} height={14} /></span>;
}

export function MessageBubble({ message, viewer, locale, assistantName, onOpenAttachment, onRetry, actions }: {
  message: LocalMessage;
  viewer: ChatRole;
  locale: string;
  assistantName: string;
  onOpenAttachment: (attachmentId: string) => void;
  onRetry: (message: LocalMessage) => void;
  actions?: ReactNode;
}) {
  const pt = locale === "pt";
  const ownType = viewer === "customer" ? "CUSTOMER" : "ADMIN";
  const mine = message.senderType === ownType;
  const isBot = message.senderType === "BOT";
  // Cliente: as suas à direita, tudo o resto à esquerda. Admin: as do cliente à esquerda; as suas e as da IA à direita.
  const alignRight = viewer === "customer" ? message.senderType === "CUSTOMER" : message.senderType !== "CUSTOMER";
  const showState = mine || (viewer === "admin" && isBot);
  const time = new Intl.DateTimeFormat(pt ? "pt-PT" : "en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(message.createdAt));

  let label: ReactNode = null;
  if (!mine && isBot) label = <span className="inline-flex items-center gap-1"><BotIcon width={13} height={13} />{viewer === "customer" ? assistantName : (pt ? "IA" : "AI")}</span>;
  else if (!mine && message.senderType === "ADMIN") label = <span className="inline-flex items-center gap-1"><HeadsetIcon width={13} height={13} />{pt ? "Equipa" : "Team"}</span>;

  const bubbleStyle = alignRight && !mine ? { borderBottomLeftRadius: "1rem", borderBottomRightRadius: ".35rem" } : undefined;
  return (
    <div className={`chat-message-row group flex ${alignRight ? "justify-end" : "justify-start"}`}>
      <div className="flex max-w-[86%] items-end gap-1">
        {alignRight && actions}
        <div style={bubbleStyle} className={`chat-bubble min-w-[5rem] rounded-2xl px-3.5 py-2.5 text-sm ${mine ? "chat-bubble-mine" : "chat-bubble-other"}`}>
          {label && <p className="mb-1 text-[11px] font-semibold opacity-75">{label}</p>}
          {message.content && <div className="chat-message-content"><InlineText text={message.content} /></div>}
          {message.attachments?.map((attachment) => (
            <Attachment key={attachment.id} attachment={attachment} preview={message.localPreview} fileName={message.localFileName} mine={mine} pt={pt} onOpen={() => onOpenAttachment(attachment.id)} />
          ))}
          <div className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] ${mine ? "text-white/75" : "text-ink-faint"}`}>
            <time dateTime={message.createdAt}>{time}</time>
            {showState && <DeliveryState message={message} mine={mine} pt={pt} onRetry={() => onRetry(message)} />}
          </div>
        </div>
        {!alignRight && actions}
      </div>
    </div>
  );
}
