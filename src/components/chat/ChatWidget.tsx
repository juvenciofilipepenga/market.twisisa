import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/LocaleContext";
import { api } from "@/lib/api";
import { getSocket, disconnectSocket } from "@/lib/socket";
import type { ChatMenuOption, ChatMessage, Conversation } from "@/lib/types";
import { OPEN_CHAT_EVENT } from "@/lib/chatBus";
import { chatFabRule, chatPanelBlocked } from "@/lib/chatRules";
import { img } from "@/lib/images";
import { Button } from "../ui/Button";
import { XIcon, PlusIcon } from "../icons";

type LocalMessage = ChatMessage & { localState?: "pending" | "failed"; localPreview?: string; localFileName?: string };
function ClockIcon() { return <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" aria-label="A enviar"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2" strokeLinecap="round"/></svg>; }
function CheckMark() { return <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m3 8 3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function formatDay(date: Date, locale: string) {
  const today = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
  const d = new Date(date); d.setHours(0,0,0,0);
  if (d.getTime() === today.getTime()) return locale === "pt" ? "Hoje" : "Today";
  if (d.getTime() === yesterday.getTime()) return locale === "pt" ? "Ontem" : "Yesterday";
  return new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined }).format(date);
}
function InlineText({ text, mine }: { text: string; mine: boolean }) {
  // Markdown pequeno e seguro, sem HTML injectado: **negrito**, *itálico*, ~~rasurado~~, `código` e links.
  const pattern = /(\*\*[^*]+\*\*|(?<!\*)\*[^*]+\*(?!\*)|~~[^~]+~~|`[^`]+`|https?:\/\/[^\s]+)/g;
  const parts = text.split(pattern);
  const nodes: ReactNode[] = parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} className="font-bold">{part.slice(2,-2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={i}>{part.slice(1,-1)}</em>;
    if (part.startsWith("~~") && part.endsWith("~~")) return <del key={i}>{part.slice(2,-2)}</del>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={i} className={`rounded px-1 py-0.5 font-mono text-[.92em] ${mine ? "bg-black/15" : "bg-black/10"}`}>{part.slice(1,-1)}</code>;
    if (/^https?:\/\//.test(part)) return <a key={i} href={part} target="_blank" rel="noreferrer" className="underline underline-offset-2 break-all">{part}</a>;
    return part;
  });
  return <>{nodes.map((node, i) => typeof node === "string" ? node.split("\n").flatMap((line, j, arr) => j < arr.length-1 ? [line, <br key={`${i}-${j}`} />] : [line]) : node)}</>;
}
function Attachment({ attachment, localPreview, localFileName, mine }: { attachment: NonNullable<ChatMessage["attachments"]>[number]; localPreview?: string; localFileName?: string; mine: boolean }) {
  const url = localPreview || attachment.url;
  const imageFile = attachment.mimeType.startsWith("image/");
  const filename = (() => { try { return decodeURIComponent(new URL(attachment.url, window.location.origin).pathname.split("/").pop() || "Ficheiro"); } catch { return "Ficheiro"; } })();
  if (imageFile && url) return <a href={url} target="_blank" rel="noreferrer" className="chat-image-attachment mt-2 block overflow-hidden rounded-xl" aria-label="Abrir imagem"><img src={url} alt={filename === "Ficheiro" ? "Imagem enviada na conversa" : filename} loading="lazy" className="max-h-64 w-full max-w-full object-contain" /></a>;
  const label = localFileName || (filename === "Ficheiro" ? (attachment.mimeType === "application/pdf" ? "Documento PDF" : "Anexo") : filename);
  const className = `mt-2 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${mine ? "border-white/20 bg-black/10" : "border-border bg-surface"}`;
  if (!url) return <div className={className}><span aria-hidden="true">▤</span><span className="min-w-0 flex-1 truncate">{label}</span><span className="shrink-0 opacity-70">A enviar…</span></div>;
  return <a href={url} target="_blank" rel="noreferrer" className={className}><span aria-hidden="true">▤</span><span className="min-w-0 flex-1 truncate">{label}</span><span className="shrink-0 opacity-70">Abrir</span></a>;
}

export default function ChatWidget() {
  const { token } = useAuth();
  const { t, locale } = useLocale();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [menu, setMenu] = useState<ChatMenuOption[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [responding, setResponding] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [failedIds, setFailedIds] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingFiles = useRef<Map<string, File>>(new Map());
  const typingTimer = useRef<number | null>(null);
  const panelBlocked = chatPanelBlocked(location.pathname);
  const rule = chatFabRule(location.pathname, location.search);
  const [reachedCatalog, setReachedCatalog] = useState(false);
  const [calm, setCalm] = useState(false);
  const grouped = useMemo(() => {
    const result: Array<{ day: string; message: LocalMessage } | { day: string; separator: true }> = [];
    let lastDay = "";
    for (const message of messages) {
      const date = new Date(message.createdAt);
      const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (dayKey !== lastDay) { result.push({ day: formatDay(date, locale), separator: true }); lastDay = dayKey; }
      result.push({ day: dayKey, message });
    }
    return result;
  }, [messages, locale]);

  function addMessage(msg: ChatMessage) { setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]); }
  function notifyTyping(value: string) {
    if (!token || !conversation) return;
    const socket = getSocket(token);
    socket.emit("chat.typing", { conversationId: conversation.id, isTyping: Boolean(value.trim()) });
    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    if (value.trim()) typingTimer.current = window.setTimeout(() => socket.emit("chat.typing", { conversationId: conversation.id, isTyping: false }), 1800);
  }
  useEffect(() => { const onOpen = () => setOpen(true); window.addEventListener(OPEN_CHAT_EVENT, onOpen); return () => window.removeEventListener(OPEN_CHAT_EVENT, onOpen); }, []);
  useEffect(() => {
    setReachedCatalog(false); const id = rule.hideWhenReaching; if (!id) return;
    let raf = 0; const check = () => { raf = 0; const el = document.getElementById(id); if (el) setReachedCatalog(el.getBoundingClientRect().top < window.innerHeight * 0.65); };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(check); }; check(); window.addEventListener("scroll", schedule, { passive: true }); window.addEventListener("resize", schedule);
    return () => { if (raf) cancelAnimationFrame(raf); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, [rule.hideWhenReaching, location.pathname, location.search]);
  useEffect(() => { if (!rule.attention || calm) return; const id = window.setTimeout(() => setCalm(true), 12_000); return () => window.clearTimeout(id); }, [rule.attention, calm]);
  useEffect(() => { if (token) return; setConversation(null); setMessages([]); setMenu([]); setLoaded(false); setLoadError(false); disconnectSocket(); }, [token]);
  useEffect(() => {
    if (!open || !token || loaded) return;
    setLoadError(false);
    api.chat.open(token).then((res) => { setConversation(res.conversation); setMessages(res.messages ?? []); setMenu(res.menu ?? []); setLoaded(true); }).catch(() => setLoadError(true));
  }, [open, token, loaded]);
  useEffect(() => {
    if (!token || !conversation) return;
    const socket = getSocket(token);
    function onMessage(payload: { conversationId: string; message: ChatMessage }) {
      if (payload.conversationId !== conversation!.id) return;
      if (payload.message.senderType === "CUSTOMER") {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.message.id)) return prev;
          const pendingIndex = prev.findIndex((m) => m.localState === "pending" && m.senderType === "CUSTOMER");
          if (pendingIndex < 0) return [...prev, payload.message];
          const next = [...prev]; next.splice(pendingIndex, 1, payload.message); return next;
        });
      } else addMessage(payload.message);
      if (payload.message.senderType !== "CUSTOMER") setResponding(false);
    }
    function onClosed(payload: { conversationId: string }) { if (payload.conversationId === conversation!.id) setConversation((c) => c ? { ...c, status: "CLOSED" } : c); }
    function onTyping(payload: { conversationId?: string; isTyping?: boolean; typing?: boolean; senderType?: string }) { if (payload.conversationId && payload.conversationId !== conversation!.id) return; if (payload.senderType === "CUSTOMER") return; setResponding(Boolean(payload.isTyping ?? payload.typing)); }
    socket.on("chat.message", onMessage); socket.on("chat.closed", onClosed); socket.on("chat.typing", onTyping);
    return () => { socket.off("chat.message", onMessage); socket.off("chat.closed", onClosed); socket.off("chat.typing", onTyping); };
  }, [token, conversation]);
  useEffect(() => { const el = listRef.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }); }, [messages, responding, open]);
  useEffect(() => { if (!open) return; const onResize = () => { const el = listRef.current; if (el) el.scrollTop = el.scrollHeight; }; window.visualViewport?.addEventListener("resize", onResize); return () => window.visualViewport?.removeEventListener("resize", onResize); }, [open]);

  async function send(content?: string, file?: File, retryMessage?: LocalMessage) {
    if (!token || !conversation || sending || conversation.status === "CLOSED") return;
    const clean = content?.trim() ?? ""; if (!clean && !file && !retryMessage) return;
    const localId = retryMessage?.id ?? `pending-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    const uploadFile = file ?? (retryMessage ? pendingFiles.current.get(retryMessage.id) : undefined);
    const preview = uploadFile && uploadFile.type.startsWith("image/") ? (retryMessage?.localPreview || URL.createObjectURL(uploadFile)) : undefined;
    const optimistic: LocalMessage = retryMessage ? { ...retryMessage, localState: "pending", localPreview: preview } : { id: localId, conversationId: conversation.id, senderType: "CUSTOMER", senderId: null, content: clean || null, createdAt: new Date().toISOString(), attachments: uploadFile ? [{ id: localId, messageId: localId, url: preview ?? "", publicId: null, mimeType: uploadFile.type || "application/octet-stream", sizeBytes: uploadFile.size, createdAt: new Date().toISOString() }] : [], localState: "pending", localPreview: preview, localFileName: uploadFile?.name };
    if (uploadFile) pendingFiles.current.set(localId, uploadFile);
    if (!retryMessage) setMessages((prev) => [...prev, optimistic]); else setMessages((prev) => prev.map((m) => m.id === localId ? optimistic : m));
    setSending(true); setResponding(Boolean(clean)); setFailedIds((prev) => prev.filter((id) => id !== localId));
    try {
      notifyTyping("");
      const res = await api.chat.sendMessage(conversation.id, token, clean || undefined, uploadFile);
      pendingFiles.current.delete(localId);
      if (preview) URL.revokeObjectURL(preview);
      setMessages((prev) => {
        const withoutPending = prev.filter((m) => m.id !== localId && m.id !== res.message.id);
        const next = [...withoutPending, res.message];
        if (res.botMessage && !next.some((m) => m.id === res.botMessage!.id)) next.push(res.botMessage);
        return next;
      });
      setText(""); setResponding(false);
    } catch {
      setMessages((prev) => prev.map((m) => m.id === localId ? { ...m, localState: "failed" } : m));
      setFailedIds((prev) => [...prev.filter((id) => id !== localId), localId]);
    } finally { setSending(false); }
  }
  if (panelBlocked) return null;
  return <>
    {!open && rule.visible && !reachedCatalog && <div style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + var(--nav-h, 0px) + var(--toast-offset, 16px))" }} className="chat-fab fixed right-4 z-50">
      {rule.attention && !calm && <span aria-hidden="true" className="chat-halo" />}
      <button onClick={() => setOpen(true)} aria-label={t("chat.title")} className="press relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-primary bg-primary-active shadow-lg shadow-black/40"><img src={img.mascotSupportAvatar} alt="" width={256} height={256} className="h-full w-full object-cover" /></button>
    </div>}
    {open && <div className="chat-backdrop fixed inset-0 z-50 flex items-end justify-end bg-black/55 sm:items-center sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <section className="chat-panel flex w-full flex-col overflow-hidden border border-border bg-surface sm:max-w-md sm:rounded-2xl" role="dialog" aria-modal="true" aria-label={t("chat.title")}>
        <header className="flex shrink-0 items-center gap-3 border-b border-border bg-elevated px-4 py-3">
          <img src={img.mascotSupportAvatar} alt="" width={256} height={256} className="h-10 w-10 shrink-0 rounded-full bg-primary-active object-cover" />
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{t("chat.title")}</p><p className="chat-presence text-xs">{conversation?.status === "CLOSED" ? (locale === "pt" ? "Conversa encerrada" : "Conversation closed") : responding ? (locale === "pt" ? "A responder…" : "Replying…") : conversation?.status === "ESCALATED" ? (locale === "pt" ? "Acompanhamento humano" : "Human support") : (locale === "pt" ? "Estamos aqui para ajudar" : "Here to help")}</p></div>
          <button onClick={() => setOpen(false)} className="rounded-xl p-2 text-ink-muted transition-colors hover:bg-surface" aria-label="Fechar"><XIcon width={19} height={19} /></button>
        </header>
        {!token ? <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center"><img src={img.mascotSupport} alt="" width={522} height={600} className="h-32 w-auto object-contain" /><p className="text-sm text-ink-muted">{t("chat.loginRequired")}</p><div className="flex gap-2"><Link to="/entrar" onClick={() => setOpen(false)} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">{t("auth.login")}</Link><Link to="/registar" onClick={() => setOpen(false)} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-ink">{t("auth.register")}</Link></div></div> : <>
          <div ref={listRef} className="chat-messages min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-4">
            {!loaded && !loadError && <p className="py-4 text-center text-xs text-ink-faint">{t("common.loading")}</p>}
            {loadError && <div className="py-5 text-center"><p className="mb-2 text-xs text-danger">{t("common.error")}</p><button onClick={() => { setLoadError(false); setLoaded(false); }} className="text-xs font-semibold text-primary-text">{t("common.retry")}</button></div>}
            {grouped.map((item, index) => "separator" in item ? <div key={`day-${index}`} className="chat-day-divider"><span>{item.day}</span></div> : (() => {
              const m = item.message; const mine = m.senderType === "CUSTOMER"; const local = m as LocalMessage; const time = new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(m.createdAt));
              return <div key={m.id} className={`chat-message-row flex ${mine ? "justify-end" : "justify-start"}`}><div className={`chat-bubble max-w-[86%] min-w-[5rem] rounded-2xl px-3.5 py-2.5 text-sm ${mine ? "chat-bubble-mine" : "chat-bubble-other"}`}>
                {m.content && <div className="chat-message-content"><InlineText text={m.content} mine={mine} /></div>}
                {m.attachments?.map((a) => <Attachment key={a.id} attachment={a} localPreview={local.localPreview} localFileName={local.localFileName} mine={mine} />)}
                {local.localFileName && local.localState === "pending" && <p className="mt-1 max-w-full truncate text-[11px] opacity-75">{local.localFileName}</p>}
                <div className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] ${mine ? "text-white/75" : "text-ink-faint"}`}><time dateTime={m.createdAt}>{time}</time>{mine && (local.localState === "pending" ? <span title="A enviar"><ClockIcon /></span> : local.localState === "failed" ? <button className="font-semibold underline" onClick={() => send(m.content ?? undefined, undefined, local)}>{locale === "pt" ? "Falhou · tentar novamente" : "Failed · retry"}</button> : <CheckMark />)}</div>
              </div></div>;
            })())}
            {responding && <div className="flex justify-start"><div className="chat-typing rounded-2xl px-4 py-3" aria-live="polite"><span></span><span></span><span></span><em>{locale === "pt" ? "A responder" : "Replying"}</em></div></div>}
            {loaded && menu.length > 0 && messages.length <= 1 && <div className="space-y-1.5 pt-1"><p className="text-xs text-ink-faint">{t("chat.menuHint")}</p>{menu.map((opt) => <button key={opt.key} onClick={() => send(opt.key)} className="block w-full rounded-xl border border-border bg-elevated px-3 py-2 text-left text-sm transition-colors hover:border-primary/50">{opt.key}. {opt.label}</button>)}</div>}
          </div>
          {conversation && conversation.status !== "CLOSED" && <form className="chat-composer flex shrink-0 items-end gap-2 border-t border-border p-3" onSubmit={(e) => { e.preventDefault(); void send(text); }}>
            <button type="button" onClick={() => fileInput.current?.click()} className="press mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-muted hover:bg-elevated" aria-label={t("chat.attachFile")}><PlusIcon width={20} height={20} /></button>
            <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void send(undefined, f); e.target.value = ""; }} />
            <input ref={inputRef} value={text} onChange={(e) => { setText(e.target.value); notifyTyping(e.target.value); }} placeholder={t("chat.placeholder")} className="min-w-0 flex-1 rounded-xl border border-border bg-elevated px-3 py-2.5 text-sm focus:border-primary focus:outline-none" aria-label={t("chat.placeholder")} />
            <Button size="md" className="shrink-0" disabled={!text.trim() || sending}>{locale === "pt" ? "Enviar" : t("common.send")}</Button>
          </form>}
        </>}
      </section>
    </div>}
  </>;
}
