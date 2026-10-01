import { useNavigate } from "react-router-dom";
import { usePlatformDetect } from "@/lib/usePlatformDetect";
import { Button } from "@/components/ui/Button";
import { DownloadIcon, AppleIcon, AndroidIcon } from "@/components/icons";

export function DownloadAppHero() {
  const navigate = useNavigate();
  const platform = usePlatformDetect();

  // Scrollar para seção de guia
  const scrollToGuide = () => {
    const guideElement = document.getElementById("install-guide");
    if (guideElement) {
      guideElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl px-4 py-16 md:py-24 text-center">
        {/* Icon/Logo */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            {/* Simulado com SVG - substitua por seu ícone */}
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg">
              <DownloadIcon width={48} height={48} className="text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center text-xs font-bold text-white">
              ✓
            </div>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 text-ink">
          Instale o{" "}
          <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Twisisa Market
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-ink-muted mb-8 max-w-2xl mx-auto leading-relaxed">
          Acesso rápido, notificações em tempo real e funciona offline. 
          Instale em segundos e comece a explorar.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
          <Button
            size="lg"
            onClick={scrollToGuide}
            className="gap-2"
          >
            <DownloadIcon width={20} height={20} />
            Instalar Agora
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate("/")}
          >
            Voltar ao Início
          </Button>
        </div>

        {/* Badge com plataforma detectada */}
        {platform.isMobile && (
          <div className="inline-block px-4 py-2 rounded-full bg-green-50 border border-green-200 text-sm font-medium text-green-900 mb-8">
            {platform.isAndroid && (
              <>
                <AndroidIcon width={16} height={16} className="inline mr-2" />
                Otimizado para Android
              </>
            )}
            {platform.isIOS && (
              <>
                <AppleIcon width={16} height={16} className="inline mr-2" />
                Otimizado para iPhone/iPad
              </>
            )}
          </div>
        )}

        {/* Features Grid - Mini */}
        <div className="mt-12 pt-12 border-t border-border">
          <p className="text-sm font-semibold text-ink-muted uppercase tracking-wide mb-6">
            Por que instalar?
          </p>
          <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-primary">⚡</div>
              <p className="text-xs font-semibold text-ink mt-2">Carrega Rápido</p>
              <p className="text-xs text-ink-muted mt-1">Em menos de 2s</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">🔔</div>
              <p className="text-xs font-semibold text-ink mt-2">Notificações</p>
              <p className="text-xs text-ink-muted mt-1">Em tempo real</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">📱</div>
              <p className="text-xs font-semibold text-ink mt-2">Funciona Offline</p>
              <p className="text-xs text-ink-muted mt-1">Sem internet</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
