import { usePlatformDetect } from "@/lib/usePlatformDetect";
import { Button } from "@/components/ui/Button";
import type { AppNotification } from "@/lib/types";
import {
  AppleIcon,
  AndroidIcon,
  ChromeIcon,
  ShareIcon,
  DownloadIcon,
  MoreIcon,
} from "@/components/icons";

interface GuideStep {
  number: number;
  title: string;
  description: string;
  icon?: React.ReactNode;
}

function AndroidGuide() {
  const steps: GuideStep[] = [
    {
      number: 1,
      title: "Abra esta página no Chrome",
      description: "Certifique-se de que está usando o navegador Chrome",
      icon: <ChromeIcon width={20} height={20} />,
    },
    {
      number: 2,
      title: "Toque no menu (⋮)",
      description: "No canto superior direito do navegador",
      icon: <MoreIcon width={20} height={20} />,
    },
    {
      number: 3,
      title: "Selecione 'Instalar app'",
      description: "Pode aparecer como 'Instalar Twisisa Market' ou 'Adicionar à Home'",
      icon: <DownloadIcon width={20} height={20} />,
    },
    {
      number: 4,
      title: "Confirme a instalação",
      description: "O app será adicionado ao seu launcher de aplicações",
      icon: <AndroidIcon width={20} height={20} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
        <div className="flex items-start gap-3 mb-3">
          <AndroidIcon width={24} height={24} className="text-green-600 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-green-900">Android</h3>
            <p className="text-sm text-green-800 mt-1">
              Instalação rápida no seu smartphone
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.number} className="flex gap-4">
            {/* Número do passo */}
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                {step.number}
              </div>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0 pt-0.5">
              <h4 className="font-semibold text-ink mb-1">{step.title}</h4>
              <p className="text-sm text-ink-muted">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>💡 Dica:</strong> Se não ver a opção "Instalar app", 
          tente atualizar o Chrome ou use outro navegador Chrome-based.
        </p>
      </div>
    </div>
  );
}

function iOSGuide() {
  const steps: GuideStep[] = [
    {
      number: 1,
      title: "Abra no Safari",
      description: "Esta página deve estar aberta no navegador Safari do iPhone/iPad",
      icon: <AppleIcon width={20} height={20} />,
    },
    {
      number: 2,
      title: "Toque no botão de partilha",
      description: "O ícone de caixa com seta (↑) no fundo da tela",
      icon: <ShareIcon width={20} height={20} />,
    },
    {
      number: 3,
      title: "Selecione 'Adicionar à Home'",
      description: "Deslize até encontrar e toque nesta opção",
      icon: <DownloadIcon width={20} height={20} />,
    },
    {
      number: 4,
      title: "Confirme o nome",
      description: "O padrão é 'Twisisa Market', você pode mudar se quiser",
      icon: <AppleIcon width={20} height={20} />,
    },
    {
      number: 5,
      title: "Toque em 'Adicionar'",
      description: "O app aparecerá na sua home screen",
      icon: <DownloadIcon width={20} height={20} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-200">
        <div className="flex items-start gap-3 mb-3">
          <AppleIcon width={24} height={24} className="text-gray-600 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-gray-900">iPhone / iPad</h3>
            <p className="text-sm text-gray-600 mt-1">
              Instalação em 5 passos simples
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.number} className="flex gap-4">
            {/* Número do passo */}
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                {step.number}
              </div>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0 pt-0.5">
              <h4 className="font-semibold text-ink mb-1">{step.title}</h4>
              <p className="text-sm text-ink-muted">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>💡 Dica:</strong> Ao usar o app da home screen, 
          aparecerá no modo tela cheia, como se fosse um app native.
        </p>
      </div>
    </div>
  );
}

function WebGuide() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200">
        <div className="flex items-start gap-3 mb-3">
          <ChromeIcon width={24} height={24} className="text-blue-600 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-blue-900">Web (Desktop/Tablet)</h3>
            <p className="text-sm text-blue-800 mt-1">
              Acesso instantâneo, nenhuma instalação necessária
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-900 font-semibold mb-2">✓ Já está instalado!</p>
          <p className="text-sm text-green-800">
            Você pode usar o Twisisa Market diretamente neste navegador. 
            O site é otimizado para funcionar offline.
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-ink">Benefícios:</h4>
          <ul className="space-y-2 text-sm text-ink-muted">
            <li className="flex gap-2">
              <span className="text-primary">→</span>
              <span>Sem necessidade de download</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">→</span>
              <span>Funciona offline após primeira visita</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">→</span>
              <span>Atualiza automaticamente</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">→</span>
              <span>Compatível com qualquer browser moderno</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export function PlatformInstallGuide() {
  const platform = usePlatformDetect();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Como instalar?</h2>
        <p className="text-ink-muted">
          Siga o guia de instalação para sua plataforma
        </p>
      </div>

      {/* Mostrar guia apropriado */}
      {platform.isAndroid && !platform.isTablet && (
        <AndroidGuide />
      )}

      {platform.isIOS && (
        <iOSGuide />
      )}

      {platform.isWeb && (
        <WebGuide />
      )}

      {/* Fallback: mostrar todos se não detectar */}
      {!platform.isAndroid && !platform.isIOS && !platform.isWeb && (
        <div className="space-y-8">
          <AndroidGuide />
          <hr className="my-8" />
          <iOSGuide />
          <hr className="my-8" />
          <WebGuide />
        </div>
      )}
    </div>
  );
}
