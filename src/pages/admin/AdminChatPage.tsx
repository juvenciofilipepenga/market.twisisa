import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import type { Conversation, ConversationStatus } from "@/lib/types";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ChatNavIcon } from "@/components/admin/navIcons";
import { ChevronLeftIcon, XIcon, CheckIcon } from "@/components/icons";
import { BookIcon, BotIcon, CheckCircleIcon, HeadsetIcon } from "@/components/chat/ChatIcons";
import { ChatThread } from "@/components/chat/ChatThread";
import { useChatSession, type LocalMessage } from "@/components/chat/useChatSession";

const LIST_POLL_MS = 4000;
const LIST_EVENTS = ["chat.message", "chat.read", "chat.status", "chat.closed"] as const;
const FILTERS: Array<{ value: ConversationStatus | ""; label: string; Icon: typeof BotIcon }> = [
  { value: "", label: "Todas", Icon: ChatNavIcon },
  { value: "BOT", label: "Com a IA", Icon: BotIcon },
  { value: "ESCALATED", label: "Com a equipa", Icon: HeadsetIcon },
  { value: "CLOSED", label: "Encerradas", Icon: CheckCircleIcon }
];
const iconButton = "press flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors disabled:opacity-40";

function listTime(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit" }).format(date);
  return new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "2-digit" }).format(date);
}

function StatusIcon({ status }: { status: ConversationStatus }) {
  if (status === "BOT") return <span title="Com a IA" role="img" aria-label="Com a IA"><BotIcon width={16} height={16} /></span>;
  if (status === "ESCALATED") return <span title="Com a equipa" role="img" aria-label="Com a equipa" className="text-warning"><HeadsetIcon width={16} height={16} /></span>;
  return <span title="Encerrada" role="img" aria-label="Encerrada"><CheckCircleIcon width={16} height={16} /></span>;
}

function Avatar({ name, online }: { name: string; online: boolean }) {
  return (
    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-elevated text-sm font-bold uppercase text-ink-muted">
      {name.trim().charAt(0) || "?"}
      <span aria-hidden="true" className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-surface ${online ? "bg-success" : "bg-ink-faint"}`} />
    </span>
  );
}

// Guardar uma resposta do admin como conhecimento da IA: a pergunta do cliente e a resposta já vêm preenchidas e editáveis.
function TeachSheet({ initialTitle, initialContent, token, onClose }: { initialTitle: string; initialContent: string; token: string; onClose: () => void }) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  async function save() {
    if (!title.trim() || !content.trim() || state === "saving") return;
    setState("saving");
    try {
      await api.admin.chat.ai.addKnowledge(token, { title: title.trim(), content: content.trim() });
      setState("saved");
      window.setTimeout(onClose, 900);
    } catch { setState("error"); }
  }
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-label="Ensinar à IA" className="w-full max-w-lg rounded-t-2xl border border-border bg-surface p-4 sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-bold"><BookIcon width={18} height={18} />Ensinar à IA</p>
          <button type="button" onClick={onClose} className={`${iconButton} text-ink-muted hover:bg-elevated`} aria-label="Fechar" title="Fechar"><XIcon width={18} height={18} /></button>
        </div>
        <label className="mb-1 block text-xs font-semibold text-ink-muted" htmlFor="teach-title">Quando o cliente perguntar</label>
        <textarea id="teach-title" rows={2} maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} className="mb-3 w-full resize-none rounded-xl border border-border bg-elevated px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        <label className="mb-1 block text-xs font-semibold text-ink-muted" htmlFor="teach-content">A IA deve responder</label>
        <textarea id="teach-content" rows={5} maxLength={2000} value={content} onChange={(event) => setContent(event.target.value)} className="w-full resize-none rounded-xl border border-border bg-elevated px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p role="status" className={`text-xs ${state === "error" ? "text-danger" : "text-ink-muted"}`}>
            {state === "saved" ? "Guardado. A IA já usa esta resposta." : state === "error" ? "Não foi possível guardar." : ""}
          </p>
          <button type="button" onClick={() => void save()} disabled={!title.trim() || !content.trim() || state === "saving" || state === "saved"} className={`${iconButton} bg-primary text-white hover:bg-primary-hover`} aria-label="Guardar na IA" title="Guardar na IA"><CheckIcon width={20} height={20} /></button>
        </div>
      </section>
    </div>
  );
}

function AdminThread({ conversation, token, onBack, onChanged }: { conversation: Conversation; token: string; onBack: () => void; onChanged: () => void }) {
  const session = useChatSession({ role: "admin", token, conversationId: conversation.id, active: true });
  const [confirmClose, setConfirmClose] = useState(false);
  const [teach, setTeach] = useState<{ title: string; content: string } | null>(null);
  const status = session.status ?? conversation.status;
  const name = conversation.user?.name ?? "Cliente";

  const presence = session.peerTyping ? "A escrever…" : session.peerOnline ? "Online" : "Offline";

  async function resumeAi() {
    try { await api.admin.chat.aiResume(token, conversation.id); await session.refresh(); onChanged(); } catch { /* o estado visível não muda; o admin pode tentar de novo */ }
  }

  // Pergunta do cliente = a última mensagem de texto do cliente antes desta resposta.
  const teachFrom = useCallback((message: LocalMessage) => {
    const index = session.messages.findIndex((item) => item.id === message.id);
    let question = "";
    for (let i = index - 1; i >= 0; i -= 1) {
      const candidate = session.messages[i];
      if (candidate && candidate.senderType === "CUSTOMER" && candidate.content) { question = candidate.content; break; }
    }
    setTeach({ title: question, content: message.content ?? "" });
  }, [session.messages]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center gap-2 border-b border-border bg-elevated px-2 py-2 sm:px-3">
        <button type="button" onClick={onBack} className={`${iconButton} text-ink-muted hover:bg-surface md:hidden`} aria-label="Voltar às conversas" title="Voltar às conversas"><ChevronLeftIcon width={20} height={20} /></button>
        <Avatar name={name} online={session.peerOnline} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{name}</p>
          <p className="truncate text-xs text-ink-muted" aria-live="polite">{presence}{conversation.user?.phone ? ` · ${conversation.user.phone}` : ""}</p>
        </div>
        <StatusIcon status={status} />
        {status === "ESCALATED" && <button type="button" onClick={() => void resumeAi()} className={`${iconButton} text-ink-muted hover:bg-surface`} aria-label="Devolver à IA" title="Devolver à IA"><BotIcon width={20} height={20} /></button>}
        {status !== "CLOSED" && <button type="button" onClick={() => setConfirmClose(true)} className={`${iconButton} text-ink-muted hover:bg-surface`} aria-label="Encerrar conversa" title="Encerrar conversa"><CheckCircleIcon width={20} height={20} /></button>}
      </header>
      <ChatThread
        session={session}
        role="admin"
        locale="pt"
        assistantName="IA"
        placeholder="Escreva a resposta ao cliente"
        closedNotice={<p className="text-center text-xs text-ink-muted">Conversa encerrada. O cliente pode iniciar uma nova.</p>}
        renderMessageActions={(message) => message.senderType === "ADMIN" && message.content && !message.localState
          ? <button type="button" onClick={() => teachFrom(message)} className="press mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-faint opacity-60 transition hover:bg-elevated hover:text-ink hover:opacity-100 group-hover:opacity-100" aria-label="Ensinar à IA com esta resposta" title="Ensinar à IA com esta resposta"><BookIcon width={16} height={16} /></button>
          : null}
      />
      {confirmClose && (
        <ConfirmDialog
          title="Encerrar conversa"
          message="O cliente deixa de poder escrever nesta conversa e, se voltar, começa uma nova."
          confirmLabel="Encerrar"
          danger
          onConfirm={async () => { await api.admin.chat.close(token, conversation.id); await session.refresh(); onChanged(); setConfirmClose(false); }}
          onClose={() => setConfirmClose(false)}
        />
      )}
      {teach && <TeachSheet initialTitle={teach.title} initialContent={teach.content} token={token} onClose={() => setTeach(null)} />}
    </div>
  );
}

export default function AdminChatPage() {
  const { token } = useAuth();
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [listError, setListError] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | "">("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token) return;
    try {
      const response = await api.admin.chat.list(token, { status: statusFilter || undefined, limit: 50 });
      setConversations(response.data);
      setListError(false);
    } catch { setListError(true); }
  }, [token, statusFilter]);

  useEffect(() => {
    setConversations(null);
    let stopped = false;
    let timer: number | undefined;
    const schedule = () => {
      if (stopped) return;
      timer = window.setTimeout(async () => { if (document.visibilityState === "visible") await reload(); schedule(); }, LIST_POLL_MS);
    };
    void reload().finally(schedule);
    return () => { stopped = true; window.clearTimeout(timer); };
  }, [reload]);

  // Com Socket.IO a lista actualiza logo; sem ele, o ciclo acima chega.
  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);
    let debounce: number | undefined;
    const kick = () => { window.clearTimeout(debounce); debounce = window.setTimeout(() => void reload(), 200); };
    for (const name of LIST_EVENTS) socket.on(name, kick);
    return () => { window.clearTimeout(debounce); for (const name of LIST_EVENTS) socket.off(name, kick); };
  }, [token, reload]);

  const active = useMemo(() => conversations?.find((conversation) => conversation.id === activeId) ?? null, [conversations, activeId]);

  if (!token) return null;
  return (
    <div className="flex h-[min(80dvh,820px)] overflow-hidden rounded-2xl border border-border bg-surface">
      <aside className={`${active ? "hidden md:flex" : "flex"} w-full min-w-0 shrink-0 flex-col border-border md:w-80 md:border-r`}>
        <div className="flex shrink-0 items-center gap-1 border-b border-border p-2">
          {FILTERS.map(({ value, label, Icon }) => (
            <button key={value || "all"} type="button" onClick={() => setStatusFilter(value)} aria-pressed={statusFilter === value} aria-label={label} title={label} className={`${iconButton} ${statusFilter === value ? "bg-primary/15 text-primary-text" : "text-ink-muted hover:bg-elevated"}`}><Icon width={19} height={19} /></button>
          ))}
          <Link to="/admin/chat/ia" className={`${iconButton} ml-auto text-ink-muted hover:bg-elevated`} aria-label="Treinar a IA" title="Treinar a IA"><BookIcon width={19} height={19} /></Link>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {conversations === null && !listError && <div className="space-y-2 p-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>}
          {listError && <p className="p-4 text-center text-xs text-danger">Não foi possível carregar as conversas.</p>}
          {conversations !== null && conversations.length === 0 && <EmptyState title="Sem conversas" icon={<ChatNavIcon width={22} height={22} />} />}
          {conversations?.map((conversation) => {
            const name = conversation.user?.name ?? "Cliente";
            const unread = conversation.unreadCount ?? 0;
            const prefix = conversation.lastMessageSender === "ADMIN" ? "Você: " : conversation.lastMessageSender === "BOT" ? "IA: " : "";
            return (
              <button key={conversation.id} type="button" onClick={() => setActiveId(conversation.id)} aria-current={conversation.id === activeId} className={`flex w-full items-center gap-3 border-b border-border px-3 py-3 text-left transition-colors hover:bg-elevated ${conversation.id === activeId ? "bg-elevated" : ""}`}>
                <Avatar name={name} online={Boolean(conversation.customerOnline)} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className={`truncate text-sm ${unread > 0 ? "font-bold" : "font-semibold"}`}>{name}</span>
                    <span className="shrink-0 text-[11px] text-ink-faint">{listTime(conversation.lastMessageAt)}</span>
                  </span>
                  <span className="mt-0.5 flex items-center justify-between gap-2">
                    <span className={`truncate text-xs ${unread > 0 ? "text-ink" : "text-ink-muted"}`}>{conversation.lastMessagePreview ? `${prefix}${conversation.lastMessagePreview}` : "Sem mensagens"}</span>
                    <span className="flex shrink-0 items-center gap-1.5 text-ink-faint">
                      <StatusIcon status={conversation.status} />
                      {unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white" aria-label={`${unread} por ler`}>{unread > 99 ? "99+" : unread}</span>}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </aside>
      <section className={`${active ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col`}>
        {active
          ? <AdminThread key={active.id} conversation={active} token={token} onBack={() => setActiveId(null)} onChanged={() => void reload()} />
          : <div className="flex flex-1 items-center justify-center p-6"><EmptyState title="Escolha uma conversa" icon={<ChatNavIcon width={22} height={22} />} /></div>}
      </section>
    </div>
  );
}
