import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { api } from "@/lib/api";
import type { ChatAiSettings, ChatKnowledgeEntry } from "@/lib/types";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { CheckIcon, ChevronLeftIcon, EyeIcon, EyeOffIcon, PlusIcon, TrashIcon, XIcon } from "@/components/icons";
import { BotIcon, PencilIcon, SendIcon } from "@/components/chat/ChatIcons";

const iconButton = "press flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors disabled:opacity-40";
const field = "w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-sm focus:border-primary focus:outline-none";

type Draft = { id: string | null; title: string; content: string };

// "Treinar" a IA do chat. O Groq não treina modelos por pedido: o que o admin controla aqui são as instruções e o
// conhecimento da loja que a IA recebe em cada resposta. Mudanças valem logo, sem esperar por nada.
export default function AdminChatAiPage() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<ChatAiSettings | null>(null);
  const [groqConfigured, setGroqConfigured] = useState(true);
  const [knowledge, setKnowledge] = useState<ChatKnowledgeEntry[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [draftError, setDraftError] = useState(false);
  const [toDelete, setToDelete] = useState<ChatKnowledgeEntry | null>(null);
  const [testText, setTestText] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ reply: string | null; escalate: boolean; usedKnowledge: string[] } | null>(null);
  const [testError, setTestError] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [settingsResponse, knowledgeResponse] = await Promise.all([api.admin.chat.ai.settings(token), api.admin.chat.ai.knowledge(token)]);
      setSettings(settingsResponse.settings);
      setGroqConfigured(settingsResponse.groqConfigured);
      setKnowledge(knowledgeResponse.data);
      setLoadError(false);
    } catch { setLoadError(true); }
  }, [token]);
  useEffect(() => { void load(); }, [load]);

  async function saveSettings(next: ChatAiSettings) {
    if (!token) return;
    setSaveState("saving");
    try {
      const response = await api.admin.chat.ai.saveSettings(token, next);
      setSettings(response.settings);
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 2000);
    } catch { setSaveState("error"); }
  }

  async function saveDraft() {
    if (!token || !draft || !draft.title.trim() || !draft.content.trim()) return;
    setDraftError(false);
    try {
      if (draft.id) await api.admin.chat.ai.updateKnowledge(token, draft.id, { title: draft.title.trim(), content: draft.content.trim() });
      else await api.admin.chat.ai.addKnowledge(token, { title: draft.title.trim(), content: draft.content.trim() });
      setDraft(null);
      await load();
    } catch { setDraftError(true); }
  }

  async function toggleActive(entry: ChatKnowledgeEntry) {
    if (!token) return;
    setKnowledge((previous) => previous?.map((item) => (item.id === entry.id ? { ...item, active: !entry.active } : item)) ?? previous);
    try { await api.admin.chat.ai.updateKnowledge(token, entry.id, { active: !entry.active }); } catch { await load(); }
  }

  async function runTest() {
    if (!token || !testText.trim() || testing) return;
    setTesting(true); setTestError(false); setTestResult(null);
    try { setTestResult(await api.admin.chat.ai.test(token, testText.trim())); }
    catch { setTestError(true); }
    finally { setTesting(false); }
  }

  if (!token) return null;
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-2">
        <Link to="/admin/chat" className={`${iconButton} text-ink-muted hover:bg-elevated`} aria-label="Voltar ao chat" title="Voltar ao chat"><ChevronLeftIcon width={20} height={20} /></Link>
        <h1 className="flex items-center gap-2 text-lg font-bold"><BotIcon width={22} height={22} />IA do chat</h1>
      </div>

      {loadError && <p role="alert" className="rounded-xl border border-border p-4 text-sm text-danger">Não foi possível carregar. Atualize a página.</p>}
      {!settings && !loadError && <Skeleton className="h-48 w-full" />}
      {!groqConfigured && <p role="alert" className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs text-ink">A chave do Groq não está configurada no servidor (GROQ_API_KEY). Sem ela, a IA passa todas as conversas à equipa.</p>}

      {settings && (
        <section className="space-y-4 rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold">Atendimento automático</p>
              <p className="text-xs text-ink-muted">{settings.enabled ? "A IA responde aos clientes e passa à equipa o que não souber." : "Desligado: todas as mensagens ficam para a equipa."}</p>
            </div>
            <button type="button" role="switch" aria-checked={settings.enabled} aria-label="Atendimento automático" title={settings.enabled ? "Desligar a IA" : "Ligar a IA"} onClick={() => void saveSettings({ ...settings, enabled: !settings.enabled })} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${settings.enabled ? "bg-primary" : "bg-border"}`}>
              <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-all ${settings.enabled ? "left-[1.4rem]" : "left-0.5"}`} />
            </button>
          </div>
          <div>
            <label htmlFor="ai-name" className="mb-1 block text-xs font-semibold text-ink-muted">Nome do assistente</label>
            <input id="ai-name" value={settings.assistantName} maxLength={60} onChange={(event) => setSettings({ ...settings, assistantName: event.target.value })} className={field} />
          </div>
          <div>
            <label htmlFor="ai-instructions" className="mb-1 block text-xs font-semibold text-ink-muted">Instruções da loja</label>
            <textarea id="ai-instructions" rows={7} maxLength={4000} value={settings.instructions} onChange={(event) => setSettings({ ...settings, instructions: event.target.value })} placeholder="Tom de voz, horário de atendimento, zonas de entrega, formas de pagamento, o que nunca prometer…" className={`${field} resize-y`} />
            <p className="mt-1 text-right text-[11px] text-ink-faint">{settings.instructions.length}/4000</p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p role="status" className={`text-xs ${saveState === "error" ? "text-danger" : "text-ink-muted"}`}>{saveState === "saved" ? "Guardado. A IA já usa estas instruções." : saveState === "error" ? "Não foi possível guardar." : ""}</p>
            <button type="button" onClick={() => void saveSettings(settings)} disabled={saveState === "saving" || !settings.assistantName.trim()} className={`${iconButton} bg-primary text-white hover:bg-primary-hover`} aria-label="Guardar instruções" title="Guardar instruções"><CheckIcon width={20} height={20} /></button>
          </div>
        </section>
      )}

      <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold">Conhecimento da loja</p>
            <p className="text-xs text-ink-muted">Perguntas frequentes e políticas. Também pode ensinar a partir de uma resposta sua, no chat.</p>
          </div>
          <button type="button" onClick={() => { setDraft({ id: null, title: "", content: "" }); setDraftError(false); }} className={`${iconButton} bg-primary text-white hover:bg-primary-hover`} aria-label="Adicionar conhecimento" title="Adicionar conhecimento"><PlusIcon width={20} height={20} /></button>
        </div>

        {draft && (
          <div className="space-y-2 rounded-xl border border-primary/40 bg-elevated p-3">
            <label htmlFor="kn-title" className="block text-xs font-semibold text-ink-muted">Quando o cliente perguntar</label>
            <input id="kn-title" value={draft.title} maxLength={200} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className={field} />
            <label htmlFor="kn-content" className="block text-xs font-semibold text-ink-muted">A IA deve responder</label>
            <textarea id="kn-content" rows={4} value={draft.content} maxLength={2000} onChange={(event) => setDraft({ ...draft, content: event.target.value })} className={`${field} resize-y`} />
            <div className="flex items-center justify-between gap-2">
              <p role="alert" className="text-xs text-danger">{draftError ? "Não foi possível guardar." : ""}</p>
              <div className="flex gap-1">
                <button type="button" onClick={() => setDraft(null)} className={`${iconButton} text-ink-muted hover:bg-surface`} aria-label="Cancelar" title="Cancelar"><XIcon width={19} height={19} /></button>
                <button type="button" onClick={() => void saveDraft()} disabled={!draft.title.trim() || !draft.content.trim()} className={`${iconButton} bg-primary text-white hover:bg-primary-hover`} aria-label="Guardar" title="Guardar"><CheckIcon width={20} height={20} /></button>
              </div>
            </div>
          </div>
        )}

        {knowledge === null && !loadError && <Skeleton className="h-20 w-full" />}
        {knowledge?.length === 0 && !draft && <p className="py-4 text-center text-xs text-ink-faint">Ainda não há conhecimento. Adicione a primeira pergunta com o botão +.</p>}
        {knowledge?.map((entry) => (
          <article key={entry.id} className={`rounded-xl border border-border p-3 ${entry.active ? "" : "opacity-55"}`}>
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{entry.title}</p>
                <p className="mt-1 whitespace-pre-line text-xs text-ink-muted">{entry.content}</p>
              </div>
              <div className="flex shrink-0">
                <button type="button" onClick={() => void toggleActive(entry)} className={`${iconButton} h-9 w-9 text-ink-muted hover:bg-elevated`} aria-label={entry.active ? "Desativar" : "Ativar"} title={entry.active ? "Desativar (a IA deixa de usar)" : "Ativar"}>{entry.active ? <EyeIcon width={18} height={18} /> : <EyeOffIcon width={18} height={18} />}</button>
                <button type="button" onClick={() => { setDraft({ id: entry.id, title: entry.title, content: entry.content }); setDraftError(false); }} className={`${iconButton} h-9 w-9 text-ink-muted hover:bg-elevated`} aria-label="Editar" title="Editar"><PencilIcon width={17} height={17} /></button>
                <button type="button" onClick={() => setToDelete(entry)} className={`${iconButton} h-9 w-9 text-ink-muted hover:bg-elevated`} aria-label="Apagar" title="Apagar"><TrashIcon width={17} height={17} /></button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
        <div>
          <p className="text-sm font-bold">Testar a IA</p>
          <p className="text-xs text-ink-muted">Escreva como se fosse um cliente. Usa as instruções e o conhecimento guardados acima, sem dados de nenhuma conta.</p>
        </div>
        <form className="flex items-end gap-2" onSubmit={(event) => { event.preventDefault(); void runTest(); }}>
          <input value={testText} onChange={(event) => setTestText(event.target.value)} maxLength={1000} placeholder="Quanto custa a entrega?" aria-label="Mensagem de teste" className={field} />
          <button type="submit" disabled={!testText.trim() || testing} className={`${iconButton} bg-primary text-white hover:bg-primary-hover`} aria-label="Enviar teste" title="Enviar teste"><SendIcon width={20} height={20} /></button>
        </form>
        {testing && <p className="text-xs text-ink-muted" aria-live="polite">A IA está a escrever…</p>}
        {testError && <p role="alert" className="text-xs text-danger">Não foi possível testar.</p>}
        {testResult && (
          <div className="space-y-2 rounded-xl border border-border bg-elevated p-3 text-sm" aria-live="polite">
            <p className="whitespace-pre-line">{testResult.reply ?? "(sem resposta)"}</p>
            {testResult.escalate && <p className="text-xs text-warning">Neste caso a IA passaria a conversa à equipa.</p>}
            {testResult.usedKnowledge.length > 0 && <p className="text-xs text-ink-muted">Conhecimento usado: {testResult.usedKnowledge.join(" · ")}</p>}
          </div>
        )}
      </section>

      {toDelete && (
        <ConfirmDialog
          title="Apagar conhecimento"
          message={`A IA deixa de usar "${toDelete.title}".`}
          confirmLabel="Apagar"
          danger
          onConfirm={async () => { if (!token) return; await api.admin.chat.ai.deleteKnowledge(token, toDelete.id); setToDelete(null); await load(); }}
          onClose={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
