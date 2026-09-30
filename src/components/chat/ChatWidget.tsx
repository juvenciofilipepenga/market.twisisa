import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/LocaleContext";
import { api } from "@/lib/api";
import { getSocket, disconnectSocket } from "@/lib/socket";
import type { ChatMenuOption, ChatMessage, Conversation } from "@/lib/types";
import { OPEN_CHAT_EVENT } from "@/lib/chatBus";
import { XIcon, PlusIcon } from "../icons";

// Não aparece dentro do admin, que tem a sua própria página de chat (/admin/chat).
export default function ChatWidget() {
  const { token } = useAuth();
  const { t } = useLocale();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [menu, setMenu] = useState<ChatMenuOption[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isAdminRoute = location.pathname.startsWith("/admin");

  function addMessage(msg: ChatMessage) {
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
  }

  // Outros sítios (ex.: rodapé) pedem a abertura do chat através de um evento.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_CHAT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, onOpen);
  }, []);

  // Ao terminar a sessão, o chat volta ao estado inicial.
  useEffect(() => {
    if (token) return;
    setConversation(null); setMessages([]); setMenu([]); setLoaded(false); setLoadError(false);
    disconnectSocket();
  }, [token]);

  useEffect(() => {
    if (!open || !token || loaded) return;
    setLoadError(false);
    api.chat.open(token).then((res) => {
      setConversation(res.conversation);
      setMessages(res.messages ?? []);
      setMenu(res.menu ?? []);
      setLoaded(true);
    }).catch(() => setLoadError(true));
  }, [open, token, loaded]);

  useEffect(() => {
    if (!token || !conversation) return;
    const socket = getSocket(token);
    function onMessage(payload: { conversationId: string; message: ChatMessage }) {
      if (payload.conversationId === conversation!.id) addMessage(payload.message);
    }
    function onClosed(payload: { conversationId: string }) {
      if (payload.conversationId === conversation!.id) setConversation((c) => (c ? { ...c, status: "CLOSED" } : c));
    }
    socket.on("chat.message", onMessage);
    socket.on("chat.closed", onClosed);
    return () => { socket.off("chat.message", onMessage); socket.off("chat.closed", onClosed); };
  }, [token, conversation]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(content?: string, file?: File) {
    if (!token || !conversation || sending) return;
    if (!content?.trim() && !file) return;
    setSending(true);
    try {
      const res = await api.chat.sendMessage(conversation.id, token, content?.trim(), file);
      addMessage(res.message);
      if (res.botMessage) addMessage(res.botMessage);
      setText("");
    } finally {
      setSending(false);
    }
  }

  if (isAdminRoute) return null;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label={t("chat.title")}
          className="fixed bottom-4 right-4 z-50 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-primary bg-surface shadow-lg shadow-black/40"
        >
          <img src="/mascot.png" alt="" className="h-full w-full object-cover" />
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/40 sm:p-4">
          <div className="flex h-[80vh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-surface sm:h-[600px] sm:max-w-sm sm:rounded-2xl">
            <div className="flex items-center gap-3 border-b border-border bg-elevated p-3">
              <img src="/mascot.png" alt="" className="h-10 w-10 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{t("chat.title")}</p>
                {conversation?.status === "ESCALATED" && <p className="text-xs text-warning">{t("chat.escalated")}</p>}
                {conversation?.status === "CLOSED" && <p className="text-xs text-ink-faint">{t("chat.closed")}</p>}
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-ink-muted hover:bg-surface" aria-label="Fechar">
                <XIcon width={18} height={18} />
              </button>
            </div>

            {!token ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
                <img src="/mascot.png" alt="" className="h-28 w-28 object-contain" />
                <p className="text-sm text-ink-muted">{t("chat.loginRequired")}</p>
                <div className="flex gap-2">
                  <Link to="/entrar" onClick={() => setOpen(false)} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">{t("auth.login")}</Link>
                  <Link to="/registar" onClick={() => setOpen(false)} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-ink">{t("auth.register")}</Link>
                </div>
              </div>
            ) : (
              <>
                <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-3">
                  {!loaded && !loadError && <p className="text-center text-xs text-ink-faint">{t("common.loading")}</p>}
                  {loadError && (
                    <div className="text-center">
                      <p className="mb-2 text-xs text-danger">{t("common.error")}</p>
                      <button onClick={() => { setLoadError(false); setLoaded(false); }} className="text-xs font-semibold text-primary">{t("common.retry")}</button>
                    </div>
                  )}
                  {messages.map((m) => {
                    const isCustomer = m.senderType === "CUSTOMER";
                    return (
                      <div key={m.id} className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${isCustomer ? "bg-primary text-white" : "bg-elevated text-ink"}`}>
                          {m.content}
                          {m.attachments?.map((a) => (
                            <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="mt-1 block text-xs underline">📎 {a.mimeType}</a>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {loaded && menu.length > 0 && messages.length <= 1 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-xs text-ink-faint">{t("chat.menuHint")}</p>
                      {menu.map((opt) => (
                        <button key={opt.key} onClick={() => send(opt.key)}
                          className="block w-full rounded-xl border border-border bg-elevated px-3 py-2 text-left text-sm hover:border-primary/50">
                          {opt.key}. {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {conversation && conversation.status !== "CLOSED" && (
                  <div className="flex items-center gap-2 border-t border-border p-3">
                    <button onClick={() => fileInput.current?.click()} className="shrink-0 rounded-lg p-2 text-ink-muted hover:bg-elevated" aria-label={t("chat.attachFile")}>
                      <PlusIcon width={18} height={18} />
                    </button>
                    <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) send(undefined, f); e.target.value = ""; }} />
                    <input
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") send(text); }}
                      placeholder={t("chat.placeholder")}
                      className="flex-1 rounded-xl border border-border bg-elevated px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                    <button onClick={() => send(text)} disabled={sending || !text.trim()} className="shrink-0 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">
                      {t("common.send")}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
