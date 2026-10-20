import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import type { ChatMessage, ConversationStatus } from "@/lib/types";

export type ChatRole = "customer" | "admin";

/** Mensagem como o ecrã a vê: a do servidor + o estado local enquanto ainda não foi gravada. */
export type LocalMessage = ChatMessage & {
  localState?: "pending" | "failed";
  localPreview?: string;
  localFileName?: string;
  localFile?: File;
};

// Sem Socket.IO (ex.: backend em Vercel) a sincronização por pedidos é a base; com Socket.IO ligado o servidor avisa e
// o pedido de segurança abranda. O socket nunca entrega dados: só manda sincronizar já, por isso não há duas fontes de verdade.
const POLL_MS_SOCKET_DOWN = 2500;
const POLL_MS_SOCKET_UP = 15_000;
const TYPING_REFRESH_MS = 2500;
const TYPING_IDLE_MS = 3500;
const SOCKET_EVENTS = ["chat.message", "chat.typing", "chat.read", "chat.status", "chat.closed"] as const;

function newClientId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Junta o que veio do servidor ao que já está no ecrã: actualiza por id, troca a mensagem "pendente" pela gravada
// (mesmo clientId) e mantém as pendentes no fim, pela ordem de envio, em vez de as ordenar pelo relógio do telemóvel.
function mergeServer(previous: LocalMessage[], incoming: ChatMessage[]): LocalMessage[] {
  if (incoming.length === 0) return previous;
  const next = [...previous];
  for (const message of incoming) {
    let index = next.findIndex((item) => item.id === message.id);
    if (index < 0 && message.clientId) index = next.findIndex((item) => item.clientId === message.clientId);
    if (index >= 0) {
      const existing = next[index]!;
      next[index] = { ...message, localPreview: existing.localPreview, localFileName: existing.localFileName };
    } else {
      next.push(message);
    }
  }
  const confirmed = next.filter((item) => !item.localState).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const unsent = next.filter((item) => item.localState);
  return [...confirmed, ...unsent];
}

export interface ChatSession {
  messages: LocalMessage[];
  status: ConversationStatus | null;
  peerTyping: boolean;
  peerOnline: boolean;
  aiThinking: boolean;
  loaded: boolean;
  loadError: boolean;
  send: (content: string, file?: File) => Promise<void>;
  retry: (message: LocalMessage) => Promise<void>;
  notifyTyping: (value: string) => void;
  refresh: () => Promise<void>;
}

export function useChatSession(options: { role: ChatRole; token: string | null; conversationId: string | null; active: boolean }): ChatSession {
  const { role, token, conversationId, active } = options;
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [status, setStatus] = useState<ConversationStatus | null>(null);
  const [peerTyping, setPeerTyping] = useState(false);
  const [peerOnline, setPeerOnline] = useState(false);
  const [aiBusy, setAiBusy] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => typeof document === "undefined" || document.visibilityState === "visible");

  const generation = useRef(0);
  const sinceRef = useRef<string | null>(null);
  const inFlight = useRef(false);
  const pendingSync = useRef(false);
  const socketUp = useRef(false);
  const messagesRef = useRef<LocalMessage[]>([]);
  const typingOn = useRef(false);
  const lastTypingSent = useRef(0);
  const idleTimer = useRef<number | undefined>(undefined);
  messagesRef.current = messages;

  // Trocar de conversa (ou de sessão) recomeça do zero. Declarado antes dos efeitos de rede: corre primeiro.
  useEffect(() => {
    generation.current += 1;
    sinceRef.current = null;
    inFlight.current = false;
    pendingSync.current = false;
    typingOn.current = false;
    setMessages([]);
    setStatus(null);
    setPeerTyping(false);
    setPeerOnline(false);
    setAiBusy(0);
    setLoaded(false);
    setLoadError(false);
  }, [conversationId, token]);

  useEffect(() => {
    const onVisibility = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const sync = useCallback(async (): Promise<void> => {
    if (!token || !conversationId) return;
    if (inFlight.current) { pendingSync.current = true; return; }
    inFlight.current = true;
    const mine = generation.current;
    try {
      const response = role === "customer"
        ? await api.chat.sync(conversationId, token, sinceRef.current)
        : await api.admin.chat.sync(token, conversationId, sinceRef.current);
      if (mine !== generation.current) return;
      sinceRef.current = response.serverTime;
      setMessages((previous) => mergeServer(previous, response.messages));
      setStatus(response.conversation.status);
      setPeerTyping(response.typing);
      setPeerOnline(response.peerOnline);
      setLoaded(true);
      setLoadError(false);
    } catch {
      // Falha de rede a meio não apaga o que já está no ecrã; só avisa se nunca chegou a carregar.
      if (mine === generation.current && sinceRef.current === null) setLoadError(true);
    } finally {
      if (mine === generation.current) inFlight.current = false;
      if (pendingSync.current) { pendingSync.current = false; void sync(); }
    }
  }, [token, conversationId, role]);

  // Sincronização periódica, só com o separador visível.
  useEffect(() => {
    if (!active || !token || !conversationId) return;
    let stopped = false;
    let timer: number | undefined;
    const schedule = () => {
      if (stopped) return;
      timer = window.setTimeout(async () => {
        if (document.visibilityState === "visible") await sync();
        schedule();
      }, socketUp.current ? POLL_MS_SOCKET_UP : POLL_MS_SOCKET_DOWN);
    };
    void sync().finally(schedule);
    const onVisible = () => { if (document.visibilityState === "visible") void sync(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { stopped = true; window.clearTimeout(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [active, token, conversationId, sync]);

  // Socket.IO (quando o backend o tem): só acelera, mandando sincronizar assim que há novidades.
  useEffect(() => {
    if (!active || !token || !conversationId) return;
    const socket = getSocket(token);
    socketUp.current = socket.connected;
    let debounce: number | undefined;
    const kick = () => { window.clearTimeout(debounce); debounce = window.setTimeout(() => void sync(), 120); };
    const onConnect = () => { socketUp.current = true; kick(); };
    const onDisconnect = () => { socketUp.current = false; };
    const onEvent = (payload?: { conversationId?: string }) => { if (!payload?.conversationId || payload.conversationId === conversationId) kick(); };
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    for (const name of SOCKET_EVENTS) socket.on(name, onEvent);
    return () => {
      window.clearTimeout(debounce);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      for (const name of SOCKET_EVENTS) socket.off(name, onEvent);
      socketUp.current = false;
    };
  }, [active, token, conversationId, sync]);

  // "Visto": enquanto o chat está aberto e visível, as mensagens do outro lado passam a vistas.
  const isPeerUnseen = useCallback(
    (message: LocalMessage) => !message.readAt && !message.localState && (role === "customer" ? message.senderType !== "CUSTOMER" : message.senderType === "CUSTOMER"),
    [role]
  );
  const peerUnseen = messages.some(isPeerUnseen);
  useEffect(() => {
    if (!active || !token || !conversationId || !pageVisible || !peerUnseen) return;
    const timer = window.setTimeout(() => {
      const request = role === "customer" ? api.chat.markRead(conversationId, token) : api.admin.chat.markRead(token, conversationId);
      request.catch(() => { /* o próximo ciclo de leitura volta a tentar quando chegar nova mensagem */ });
      const stamp = new Date().toISOString();
      setMessages((previous) => previous.map((message) => (isPeerUnseen(message) ? { ...message, readAt: stamp } : message)));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [active, token, conversationId, pageVisible, peerUnseen, role, isPeerUnseen]);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (!token || !conversationId) return;
    const request = role === "customer" ? api.chat.typing(conversationId, token, isTyping) : api.admin.chat.typing(token, conversationId, isTyping);
    request.catch(() => { /* "a escrever" é informativo */ });
  }, [token, conversationId, role]);

  const notifyTyping = useCallback((value: string) => {
    window.clearTimeout(idleTimer.current);
    if (!value.trim()) {
      if (typingOn.current) { typingOn.current = false; sendTyping(false); }
      return;
    }
    const now = Date.now();
    if (!typingOn.current || now - lastTypingSent.current > TYPING_REFRESH_MS) {
      typingOn.current = true;
      lastTypingSent.current = now;
      sendTyping(true);
    }
    idleTimer.current = window.setTimeout(() => { typingOn.current = false; sendTyping(false); }, TYPING_IDLE_MS);
  }, [sendTyping]);

  useEffect(() => () => window.clearTimeout(idleTimer.current), []);
  useEffect(() => () => {
    for (const message of messagesRef.current) if (message.localPreview) URL.revokeObjectURL(message.localPreview);
  }, []);

  const requestAi = useCallback(async (afterMessageId: string) => {
    if (!token || !conversationId) return;
    const mine = generation.current;
    setAiBusy((count) => count + 1);
    try {
      const response = await api.chat.aiReply(conversationId, token, afterMessageId);
      if (mine !== generation.current) return;
      if (response.botMessage) setMessages((previous) => mergeServer(previous, [response.botMessage!]));
      if (response.escalated) setStatus((previous) => (previous === "CLOSED" ? previous : "ESCALATED"));
    } catch {
      // Se a resposta falhar, a sincronização seguinte traz o que o servidor tiver gravado.
    } finally {
      if (mine === generation.current) setAiBusy((count) => Math.max(0, count - 1));
    }
  }, [token, conversationId]);

  const deliver = useCallback(async (clientId: string, content: string, file: File | undefined): Promise<void> => {
    if (!token || !conversationId) return;
    const mine = generation.current;
    try {
      if (role === "customer") {
        const response = await api.chat.sendMessage(conversationId, token, { clientId, content: content || undefined, file });
        if (mine !== generation.current) return;
        setMessages((previous) => mergeServer(previous, [response.message]));
        if (response.aiPending) void requestAi(response.message.id);
      } else {
        const response = await api.admin.chat.reply(token, conversationId, { clientId, content: content || undefined, file });
        if (mine !== generation.current) return;
        setMessages((previous) => mergeServer(previous, [response.message]));
        setStatus((previous) => (previous === "CLOSED" ? previous : "ESCALATED"));
      }
    } catch {
      if (mine !== generation.current) return;
      setMessages((previous) => previous.map((message) => (message.clientId === clientId ? { ...message, localState: "failed" } : message)));
    }
  }, [token, conversationId, role, requestAi]);

  const send = useCallback(async (content: string, file?: File): Promise<void> => {
    if (!token || !conversationId) return;
    const text = content.trim();
    if (!text && !file) return;
    const clientId = newClientId();
    const preview = file && file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
    const nowIso = new Date().toISOString();
    const optimistic: LocalMessage = {
      id: `local-${clientId}`,
      conversationId,
      senderType: role === "customer" ? "CUSTOMER" : "ADMIN",
      senderId: null,
      content: text || null,
      clientId,
      readAt: null,
      createdAt: nowIso,
      attachments: file ? [{ id: `local-att-${clientId}`, messageId: `local-${clientId}`, url: preview ?? "", publicId: null, mimeType: file.type || "application/octet-stream", sizeBytes: file.size, createdAt: nowIso }] : [],
      localState: "pending",
      localPreview: preview,
      localFileName: file?.name,
      localFile: file
    };
    setMessages((previous) => [...previous, optimistic]);
    notifyTyping("");
    await deliver(clientId, text, file);
  }, [token, conversationId, role, notifyTyping, deliver]);

  const retry = useCallback(async (message: LocalMessage): Promise<void> => {
    if (!message.clientId) return;
    const clientId = message.clientId;
    setMessages((previous) => previous.map((item) => (item.clientId === clientId ? { ...item, localState: "pending" } : item)));
    await deliver(clientId, message.content ?? "", message.localFile);
  }, [deliver]);

  return { messages, status, peerTyping, peerOnline, aiThinking: aiBusy > 0, loaded, loadError, send, retry, notifyTyping, refresh: sync };
}
