import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/LocaleContext";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import type { ChatMessage, Conversation, ConversationStatus } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { ChatNavIcon } from "@/components/admin/navIcons";

const statusTone: Record<ConversationStatus, "info" | "warning" | "neutral"> = {
  BOT: "neutral", ESCALATED: "warning", CLOSED: "info"
};

export default function AdminChatPage() {
  const { token } = useAuth();
  const { t } = useLocale();
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | "">("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  function reload() {
    if (!token) return;
    setConversations(null);
    api.admin.chat.list(token, { status: statusFilter || undefined, limit: 30 }).then((r) => setConversations(r.data));
  }
  useEffect(reload, [token, statusFilter]);

  useEffect(() => {
    if (!token || !activeId) return;
    api.admin.chat.messages(activeId, token).then((r) => setMessages(r.messages));
  }, [token, activeId]);

  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);
    function onMessage(payload: { conversationId: string; message: ChatMessage }) {
      if (payload.conversationId === activeId) setMessages((prev) => (prev.some((m) => m.id === payload.message.id) ? prev : [...prev, payload.message]));
      api.admin.chat.list(token!, { status: statusFilter || undefined, limit: 30 }).then((r) => setConversations(r.data)).catch(() => { /* lista fica como está */ });
    }
    socket.on("chat.message", onMessage);
    return () => { socket.off("chat.message", onMessage); };
  }, [token, activeId, statusFilter]);

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }); }, [messages]);

  async function reply() {
    if (!token || !activeId || !text.trim()) return;
    const res = await api.admin.chat.reply(token, activeId, text.trim());
    setMessages((prev) => [...prev, res.message]);
    setText("");
  }

  async function closeConversation() {
    if (!token || !activeId) return;
    await api.admin.chat.close(token, activeId);
    reload();
  }

  const active = conversations?.find((c) => c.id === activeId) ?? null;

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">{t("admin.nav.chat")}</h1>

      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ConversationStatus | "")}
        className="mb-4 w-full max-w-xs rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none">
        <option value="">{t("categories.all")}</option>
        <option value="ESCALATED">ESCALATED</option>
        <option value="BOT">BOT</option>
        <option value="CLOSED">CLOSED</option>
      </select>

      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <div>
          {conversations === null && <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>}
          {conversations !== null && conversations.length === 0 && <EmptyState title={t("catalog.empty")} icon={<ChatNavIcon width={22} height={22} />} />}
          {conversations !== null && conversations.length > 0 && (
            <div className="space-y-1.5">
              {conversations.map((c) => (
                <button key={c.id} onClick={() => setActiveId(c.id)}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl border p-3 text-left ${activeId === c.id ? "border-primary bg-primary/5" : "border-border bg-surface"}`}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.user?.name ?? c.userId}</p>
                    <p className="truncate text-xs text-ink-faint">{c.user?.email}</p>
                  </div>
                  <Badge tone={statusTone[c.status]}>{c.status}</Badge>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex min-h-[400px] flex-col rounded-xl border border-border bg-surface">
          {!active ? (
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-ink-faint">—</div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-border p-3">
                <p className="text-sm font-semibold">{active.user?.name}</p>
                {active.status !== "CLOSED" && (
                  <Button variant="secondary" onClick={closeConversation}>{t("admin.chat.close")}</Button>
                )}
              </div>
              <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-3">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.senderType === "ADMIN" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${m.senderType === "ADMIN" ? "bg-primary text-white" : "bg-elevated text-ink"}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
              {active.status !== "CLOSED" && (
                <div className="flex items-center gap-2 border-t border-border p-3">
                  <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") reply(); }}
                    className="flex-1 rounded-xl border border-border bg-elevated px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                  <Button onClick={reply} disabled={!text.trim()}>{t("admin.chat.reply")}</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
