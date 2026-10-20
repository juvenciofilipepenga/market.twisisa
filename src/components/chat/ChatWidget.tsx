import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/LocaleContext";
import { api } from "@/lib/api";
import { disconnectSocket } from "@/lib/socket";
import { OPEN_CHAT_EVENT } from "@/lib/chatBus";
import { chatFabRule, chatPanelBlocked } from "@/lib/chatRules";
import { img } from "@/lib/images";
import { XIcon, PlusIcon } from "../icons";
import { RetryIcon } from "./ChatIcons";
import { ChatThread } from "./ChatThread";
import { useChatSession } from "./useChatSession";

const DEFAULT_ASSISTANT = "Assistente Twisisa";

// Chat do cliente: só fala com a área administrativa (a IA atende em nome da loja enquanto nenhum humano assume).
// Toda a lógica de mensagens vive em useChatSession/ChatThread, partilhados com o chat do admin.
export default function ChatWidget() {
  const { token } = useAuth();
  const { t, locale } = useLocale();
  const pt = locale === "pt";
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [assistantName, setAssistantName] = useState(DEFAULT_ASSISTANT);
  const [openError, setOpenError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const panelBlocked = chatPanelBlocked(location.pathname);
  const rule = chatFabRule(location.pathname, location.search);
  const [reachedCatalog, setReachedCatalog] = useState(false);
  const [calm, setCalm] = useState(false);
  const session = useChatSession({ role: "customer", token, conversationId, active: open && !panelBlocked });

  useEffect(() => { const onOpen = () => setOpen(true); window.addEventListener(OPEN_CHAT_EVENT, onOpen); return () => window.removeEventListener(OPEN_CHAT_EVENT, onOpen); }, []);
  useEffect(() => {
    setReachedCatalog(false); const id = rule.hideWhenReaching; if (!id) return;
    let raf = 0; const check = () => { raf = 0; const el = document.getElementById(id); if (el) setReachedCatalog(el.getBoundingClientRect().top < window.innerHeight * 0.65); };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(check); }; check(); window.addEventListener("scroll", schedule, { passive: true }); window.addEventListener("resize", schedule);
    return () => { if (raf) cancelAnimationFrame(raf); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, [rule.hideWhenReaching, location.pathname, location.search]);
  useEffect(() => { if (!rule.attention || calm) return; const id = window.setTimeout(() => setCalm(true), 12_000); return () => window.clearTimeout(id); }, [rule.attention, calm]);
  useEffect(() => { if (token) return; setConversationId(null); setOpenError(false); disconnectSocket(); }, [token]);

  // Abre (ou retoma) a conversa em curso. conversationId a null volta a pedir: é assim que "Nova conversa" funciona.
  useEffect(() => {
    if (!open || !token || conversationId) return;
    let cancelled = false;
    setOpenError(false);
    api.chat.open(token)
      .then((res) => { if (cancelled) return; setConversationId(res.conversation.id); setAssistantName(res.assistantName || DEFAULT_ASSISTANT); })
      .catch(() => { if (!cancelled) setOpenError(true); });
    return () => { cancelled = true; };
  }, [open, token, conversationId, attempt]);

  useEffect(() => { if (!open) return; const onResize = () => { document.querySelector(".chat-messages")?.scrollTo({ top: Number.MAX_SAFE_INTEGER }); }; window.visualViewport?.addEventListener("resize", onResize); return () => window.visualViewport?.removeEventListener("resize", onResize); }, [open]);

  if (panelBlocked) return null;

  const closed = session.status === "CLOSED";
  const presence = closed ? (pt ? "Conversa encerrada" : "Conversation closed")
    : session.peerTyping ? (pt ? "A escrever…" : "Typing…")
    : session.aiThinking ? (pt ? "A escrever…" : "Typing…")
    : session.peerOnline ? "Online"
    : (pt ? "Ausente · respondemos assim que possível" : "Away · we reply as soon as possible");
  const showOnlineDot = !closed && session.peerOnline;

  return <>
    {!open && rule.visible && !reachedCatalog && <div style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + var(--nav-h, 0px) + var(--toast-offset, 16px))" }} className="chat-fab fixed right-4 z-50">
      {rule.attention && !calm && <span aria-hidden="true" className="chat-halo" />}
      <button onClick={() => setOpen(true)} aria-label={t("chat.title")} className="press relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-primary bg-primary-active shadow-lg shadow-black/40"><img src={img.mascotSupportAvatar} alt="" width={256} height={256} className="h-full w-full object-cover" /></button>
    </div>}
    {open && <div className="chat-backdrop fixed inset-0 z-50 flex items-end justify-end bg-black/55 sm:items-center sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <section className="chat-panel flex w-full flex-col overflow-hidden border border-border bg-surface sm:max-w-md sm:rounded-2xl" role="dialog" aria-modal="true" aria-label={t("chat.title")}>
        <header className="flex shrink-0 items-center gap-3 border-b border-border bg-elevated px-4 py-3">
          <img src={img.mascotSupportAvatar} alt="" width={256} height={256} className="h-10 w-10 shrink-0 rounded-full bg-primary-active object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{t("chat.title")}</p>
            <p className="chat-presence truncate text-xs" aria-live="polite">
              {showOnlineDot && <span aria-hidden="true" className="mr-1.5 inline-block h-2 w-2 rounded-full bg-success align-middle" />}
              {presence}
            </p>
          </div>
          <button onClick={() => setOpen(false)} className="press flex h-10 w-10 items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-surface" aria-label={pt ? "Fechar" : "Close"} title={pt ? "Fechar" : "Close"}><XIcon width={19} height={19} /></button>
        </header>
        {!token ? <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center"><img src={img.mascotSupport} alt="" width={522} height={600} className="h-32 w-auto object-contain" /><p className="text-sm text-ink-muted">{t("chat.loginRequired")}</p><div className="flex gap-2"><Link to="/entrar" onClick={() => setOpen(false)} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">{t("auth.login")}</Link><Link to="/registar" onClick={() => setOpen(false)} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-ink">{t("auth.register")}</Link></div></div>
        : openError ? <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-xs text-danger">{t("common.error")}</p>
            <button type="button" onClick={() => setAttempt((n) => n + 1)} className="press flex h-10 w-10 items-center justify-center rounded-xl border border-border text-ink-muted hover:bg-elevated" aria-label={t("common.retry")} title={t("common.retry")}><RetryIcon width={18} height={18} /></button>
          </div>
        : <ChatThread
            session={session}
            role="customer"
            locale={locale}
            assistantName={assistantName}
            placeholder={t("chat.placeholder")}
            closedNotice={<div className="flex items-center justify-between gap-3">
              <p className="text-xs text-ink-muted">{pt ? "Esta conversa foi encerrada." : "This conversation was closed."}</p>
              <button type="button" onClick={() => setConversationId(null)} className="press flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary-hover" aria-label={pt ? "Nova conversa" : "New conversation"} title={pt ? "Nova conversa" : "New conversation"}><PlusIcon width={20} height={20} /></button>
            </div>}
          />}
      </section>
    </div>}
  </>;
}
