import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { useDocumentMeta } from "@/lib/useDocumentMeta";
import { useLocale } from "@/i18n/LocaleContext";
import { DownloadAppHero } from "@/components/download/DownloadAppHero";
import { PlatformInstallGuide } from "@/components/download/PlatformInstallGuide";
import { CriteriaCard, type CriteriaItem } from "@/components/download/CriteriaCard";
import {
  LightningIcon,
  LockIcon,
  BellIcon,
  DatabaseIcon,
  WifiOffIcon,
  StarIcon,
} from "@/components/icons";

const CRITERIA: CriteriaItem[] = [
  {
    id: "speed",
    icon: <LightningIcon width={24} height={24} />,
    title: "Carrega em Relâmpago",
    description: "Otimizado para velocidade. A página carrega em menos de 2 segundos, mesmo em conexão lenta.",
    badge: "⚡ <2s",
    completed: true,
  },
  {
    id: "security",
    icon: <LockIcon width={24} height={24} />,
    title: "Segurança Garantida",
    description: "Todos os dados são criptografados. Sua privacidade é nossa prioridade. HTTPS em todas as conexões.",
    badge: "🔒 SSL",
    completed: true,
  },
  {
    id: "offline",
    icon: <WifiOffIcon width={24} height={24} />,
    title: "Funciona Offline",
    description: "Aceda aos seus dados mesmo sem internet. O app sincroniza quando voltar a estar online.",
    badge: "📱 Offline",
    completed: true,
  },
  {
    id: "notifications",
    icon: <BellIcon width={24} height={24} />,
    title: "Notificações em Tempo Real",
    description: "Receba alertas instantâneos sobre suas encomendas, pagamentos e mensagens. Com som e vibração.",
    badge: "🔔 Tempo Real",
    completed: true,
  },
  {
    id: "storage",
    icon: <DatabaseIcon width={24} height={24} />,
    title: "Leve e Compacto",
    description: "Ocupa menos de 5MB do seu espaço de armazenamento. Não deixa lixo no seu dispositivo.",
    badge: "💾 <5MB",
    completed: true,
  },
  {
    id: "reliability",
    icon: <StarIcon width={24} height={24} />,
    title: "Confiável e Estável",
    description: "99.9% de uptime. Testado em milhares de dispositivos. Suporte 24/7 quando precisa.",
    badge: "⭐ 99.9%",
    completed: true,
  },
];

const FAQS = [
  {
    question: "Quanto espaço o app ocupa?",
    answer:
      "O Twisisa Market web app ocupa menos de 5MB após instalação. É uma aplicação progressiva que não deixa ficheiros desnecessários.",
  },
  {
    question: "Preciso de uma conta para usar?",
    answer:
      "Sim, você precisa de uma conta ativa no Twisisa Market. Pode registar-se gratuitamente em poucos segundos.",
  },
  {
    question: "O app funciona completamente offline?",
    answer:
      "Parcialmente. Após a primeira visita, os recursos principais (catálogo, histórico) funcionam offline. As operações que requerem servidor (compra, pagamento) precisam de conexão.",
  },
  {
    question: "Como desinstalar o app?",
    answer:
      "É simples: Android - Toque e segure o ícone do app > Desinstalar. iOS - Toque e segure > Remover App > Eliminar App. Web - Simplesmente feche ou limpe o cache do navegador.",
  },
  {
    question: "Posso usar o app em vários dispositivos?",
    answer:
      "Sim! Sua conta sincroniza automaticamente. Instale em seu telemóvel, tablet e computador. Todos os dados estão sempre atualizados.",
  },
  {
    question: "Recebo notificações? Como?",
    answer:
      "Sim! Na primeira visita, o app pede permissão para enviar notificações. Você receberá alertas sobre encomendas, pagamentos e mensagens. Notificações têm som e vibração.",
  },
];

export default function DownloadAppPage() {
  const { t } = useLocale();
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  useDocumentMeta({
    title: `${t("download.title")} · Twisisa Market`,
    description: "Instale o Twisisa Market no seu telemóvel ou computador. Acesso rápido, notificações em tempo real e funciona offline.",
  });

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <DownloadAppHero />

      {/* Critérios Section */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4 text-ink">
            Por que você vai amar
          </h2>
          <p className="text-lg text-ink-muted max-w-2xl mx-auto">
            Desenvolvido com foco em velocidade, segurança e experiência do utilizador
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CRITERIA.map((item) => (
            <CriteriaCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {/* Install Guide Section */}
      <section
        id="install-guide"
        className="bg-gradient-to-b from-gray-50 to-white border-t border-border"
      >
        <div className="mx-auto max-w-4xl px-4 py-16 md:py-24">
          <PlatformInstallGuide />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mx-auto max-w-3xl px-4 py-16 md:py-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4 text-ink">
            Perguntas Frequentes
          </h2>
          <p className="text-lg text-ink-muted">
            Resolvemos as dúvidas mais comuns
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq) => (
            <div
              key={faq.question}
              className="border border-border rounded-lg overflow-hidden transition-all duration-300 hover:border-primary/50"
            >
              {/* Header */}
              <button
                onClick={() =>
                  setOpenFaq(openFaq === faq.question ? null : faq.question)
                }
                className="w-full px-6 py-4 flex items-center justify-between bg-surface hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-semibold text-ink text-left">
                  {faq.question}
                </h3>
                <span
                  className={`
                    flex-shrink-0 w-6 h-6 flex items-center justify-center
                    text-primary transition-transform duration-300
                    ${openFaq === faq.question ? "rotate-180" : ""}
                  `}
                >
                  ▼
                </span>
              </button>

              {/* Body */}
              {openFaq === faq.question && (
                <div className="px-6 py-4 border-t border-border bg-gray-50">
                  <p className="text-ink-muted leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-gradient-to-r from-primary to-blue-600 text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 md:py-24 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Pronto para começar?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Instale o Twisisa Market agora e comece a explorar milhares de produtos
          </p>
          <button
            onClick={() => {
              const guideElement = document.getElementById("install-guide");
              if (guideElement) {
                guideElement.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className={`
              inline-flex items-center gap-2 px-8 py-3 rounded-lg
              bg-white text-primary font-bold
              hover:bg-gray-100 transition-colors
            `}
          >
            Instalar Agora
          </button>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
