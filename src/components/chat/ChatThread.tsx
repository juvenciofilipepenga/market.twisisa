import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { XIcon } from "../icons";
import { FileIcon, PaperclipIcon, RetryIcon, SendIcon } from "./ChatIcons";
import { MediaViewer, type ViewerItem } from "./MediaViewer";
import { MessageBubble } from "./MessageBubble";
import type { ChatRole, ChatSession, LocalMessage } from "./useChatSession";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const NEAR_BOTTOM_PX = 140;

function formatDay(date: Date, pt: boolean): string {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const day = new Date(date); day.setHours(0, 0, 0, 0);
  if (day.getTime() === today.getTime()) return pt ? "Hoje" : "Today";
  if (day.getTime() === yesterday.getTime()) return pt ? "Ontem" : "Yesterday";
  return new Intl.DateTimeFormat(pt ? "pt-PT" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: day.getFullYear() !== today.getFullYear() ? "numeric" : undefined }).format(date);
}

function extensionOf(mimeType: string): string {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "application/pdf") return "pdf";
  return "bin";
}

const iconButton = "press flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors disabled:cursor-not-allowed disabled:opacity-40";

export function ChatThread({ session, role, locale, assistantName, placeholder, closedNotice, renderMessageActions, emptyState }: {
  session: ChatSession;
  role: ChatRole;
  locale: string;
  assistantName: string;
  placeholder: string;
  closedNotice: ReactNode;
  renderMessageActions?: (message: LocalMessage) => ReactNode;
  emptyState?: ReactNode;
}) {
  const pt = locale === "pt";
  const { messages, status, peerTyping, aiThinking, loaded, loadError, send, retry, notifyTyping, refresh } = session;
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [staged, setStaged] = useState<File | null>(null);
  const [stagedPreview, setStagedPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const viewerItems = useMemo<ViewerItem[]>(() => {
    const items: ViewerItem[] = [];
    for (const message of messages) {
      for (const attachment of message.attachments ?? []) {
        const isImage = attachment.mimeType.startsWith("image/");
        const url = isImage ? (message.localPreview ?? attachment.url) : attachment.url;
        if (!url) continue;
        const fallback = `${isImage ? (pt ? "imagem" : "image") : (pt ? "documento" : "document")}.${extensionOf(attachment.mimeType)}`;
        items.push({ id: attachment.id, url, kind: isImage ? "image" : "pdf", name: message.localFileName ?? fallback });
      }
    }
    return items;
  }, [messages, pt]);

  const grouped = useMemo(() => {
    const result: Array<{ type: "day"; key: string; label: string } | { type: "message"; key: string; message: LocalMessage }> = [];
    let lastDay = "";
    for (const message of messages) {
      const date = new Date(message.createdAt);
      const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (dayKey !== lastDay) { result.push({ type: "day", key: `day-${dayKey}`, label: formatDay(date, pt) }); lastDay = dayKey; }
      result.push({ type: "message", key: message.id, message });
    }
    return result;
  }, [messages, pt]);

  const typingLabel = peerTyping
    ? (role === "customer" ? (pt ? "Equipa a escrever" : "Team is typing") : (pt ? "Cliente a escrever" : "Customer is typing"))
    : role === "customer" && aiThinking ? (pt ? `${assistantName} a escrever` : `${assistantName} is typing`) : null;

  useEffect(() => {
    const element = listRef.current;
    if (!element) return;
    const last = messages[messages.length - 1];
    if (stickToBottom.current || last?.localState) element.scrollTop = element.scrollHeight;
  }, [messages, typingLabel, loaded]);

  useEffect(() => {
    const element = textRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 128)}px`;
  }, [text]);

  useEffect(() => {
    if (!staged || !staged.type.startsWith("image/")) { setStagedPreview(null); return; }
    const url = URL.createObjectURL(staged);
    setStagedPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [staged]);

  function stage(file: File | undefined) {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) { setFileError(pt ? "Só imagens (JPG, PNG, WebP) e PDF." : "Only images (JPG, PNG, WebP) and PDF."); return; }
    if (file.size > MAX_FILE_BYTES) { setFileError(pt ? "O ficheiro excede 10 MB." : "The file exceeds 10 MB."); return; }
    setFileError(null);
    setStaged(file);
  }

  function submit() {
    if (!text.trim() && !staged) return;
    const value = text;
    const file = staged ?? undefined;
    setText("");
    setStaged(null);
    setFileError(null);
    stickToBottom.current = true;
    void send(value, file);
    textRef.current?.focus();
  }

  const canSend = Boolean(text.trim() || staged);
  const closed = status === "CLOSED";
  const viewerLabels = pt
    ? { close: "Fechar", download: "Transferir", zoomIn: "Aumentar", zoomOut: "Diminuir", previous: "Anterior", next: "Seguinte", downloadFailed: "Não foi possível transferir o ficheiro." }
    : { close: "Close", download: "Download", zoomIn: "Zoom in", zoomOut: "Zoom out", previous: "Previous", next: "Next", downloadFailed: "Could not download the file." };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={listRef}
        onScroll={(event) => { const el = event.currentTarget; stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX; }}
        className="chat-messages min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-4"
      >
        {!loaded && !loadError && <p className="py-4 text-center text-xs text-ink-faint">{pt ? "A carregar…" : "Loading…"}</p>}
        {loadError && (
          <div className="flex flex-col items-center gap-2 py-5 text-center">
            <p className="text-xs text-danger">{pt ? "Não foi possível carregar a conversa." : "Could not load the conversation."}</p>
            <button type="button" onClick={() => void refresh()} className={`${iconButton} border border-border text-ink-muted hover:bg-elevated`} aria-label={pt ? "Tentar de novo" : "Try again"} title={pt ? "Tentar de novo" : "Try again"}><RetryIcon width={18} height={18} /></button>
          </div>
        )}
        {loaded && messages.length === 0 && emptyState}
        {grouped.map((item) => item.type === "day"
          ? <div key={item.key} className="chat-day-divider"><span>{item.label}</span></div>
          : <MessageBubble
              key={item.key}
              message={item.message}
              viewer={role}
              locale={locale}
              assistantName={assistantName}
              onOpenAttachment={(id) => { const index = viewerItems.findIndex((entry) => entry.id === id); if (index >= 0) setViewerIndex(index); }}
              onRetry={(message) => void retry(message)}
              actions={renderMessageActions?.(item.message)}
            />)}
        {typingLabel && (
          <div className="flex justify-start">
            <div className="chat-typing rounded-2xl px-4 py-3" aria-live="polite"><span></span><span></span><span></span><em>{typingLabel}</em></div>
          </div>
        )}
      </div>

      {closed ? (
        <div className="shrink-0 border-t border-border p-3">{closedNotice}</div>
      ) : (
        <form className="chat-composer shrink-0 border-t border-border p-3" onSubmit={(event) => { event.preventDefault(); submit(); }}>
          {staged && (
            <div className="mb-2 flex items-center gap-2 rounded-xl border border-border bg-elevated p-2">
              {stagedPreview
                ? <img src={stagedPreview} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface text-ink-muted"><FileIcon width={22} height={22} /></span>}
              <span className="min-w-0 flex-1 truncate text-xs text-ink-muted">{staged.name}</span>
              <button type="button" onClick={() => setStaged(null)} className={`${iconButton} h-9 w-9 text-ink-muted hover:bg-surface`} aria-label={pt ? "Remover anexo" : "Remove attachment"} title={pt ? "Remover anexo" : "Remove attachment"}><XIcon width={18} height={18} /></button>
            </div>
          )}
          {fileError && <p role="alert" className="mb-2 text-xs text-danger">{fileError}</p>}
          <div className="flex items-end gap-2">
            <button type="button" onClick={() => fileInput.current?.click()} className={`${iconButton} text-ink-muted hover:bg-elevated`} aria-label={pt ? "Anexar ficheiro" : "Attach file"} title={pt ? "Anexar ficheiro" : "Attach file"}><PaperclipIcon width={21} height={21} /></button>
            <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="hidden" onChange={(event) => { stage(event.target.files?.[0]); event.target.value = ""; }} />
            <textarea
              ref={textRef}
              rows={1}
              value={text}
              onChange={(event) => { setText(event.target.value); notifyTyping(event.target.value); }}
              onKeyDown={(event) => {
                const coarse = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
                if (event.key === "Enter" && !event.shiftKey && !coarse) { event.preventDefault(); submit(); }
              }}
              onPaste={(event) => { const file = event.clipboardData.files[0]; if (file && file.type.startsWith("image/")) { event.preventDefault(); stage(file); } }}
              placeholder={placeholder}
              aria-label={placeholder}
              className="max-h-32 min-w-0 flex-1 resize-none rounded-xl border border-border bg-elevated px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
            <button type="submit" disabled={!canSend} className={`${iconButton} bg-primary text-white hover:bg-primary-hover`} aria-label={pt ? "Enviar" : "Send"} title={pt ? "Enviar" : "Send"}><SendIcon width={20} height={20} /></button>
          </div>
        </form>
      )}

      {viewerIndex !== null && (
        <MediaViewer items={viewerItems} index={Math.min(viewerIndex, Math.max(0, viewerItems.length - 1))} onClose={() => setViewerIndex(null)} onIndex={setViewerIndex} labels={viewerLabels} />
      )}
    </div>
  );
}
