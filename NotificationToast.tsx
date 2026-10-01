import { useEffect, useState } from "react";
import type { ToastNotification } from "@/lib/useNotificationManager";
import { CloseIcon, BellIcon, CheckIcon, AlertIcon, InfoIcon } from "@/components/icons";

interface NotificationToastProps {
  notification: ToastNotification;
  onClose: (displayId: string) => void;
}

export function NotificationToast({ notification, onClose }: NotificationToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(notification.displayId), 300); // Aguardar animação
  };

  // Determinar ícone baseado no tipo
  const getIcon = () => {
    switch (notification.type) {
      case "ORDER_UPDATE":
        return <BellIcon width={20} height={20} />;
      case "PAYMENT_RECEIVED":
        return <CheckIcon width={20} height={20} />;
      case "ERROR":
        return <AlertIcon width={20} height={20} />;
      default:
        return <InfoIcon width={20} height={20} />;
    }
  };

  // Determinar cor baseada no tipo
  const getColorClass = () => {
    switch (notification.type) {
      case "PAYMENT_RECEIVED":
        return "bg-green-50 border-green-200 text-green-900";
      case "ERROR":
        return "bg-red-50 border-red-200 text-red-900";
      case "ORDER_UPDATE":
        return "bg-blue-50 border-blue-200 text-blue-900";
      default:
        return "bg-gray-50 border-gray-200 text-gray-900";
    }
  };

  return (
    <div
      className={`
        fixed bottom-0 right-0 m-4 max-w-sm
        transform transition-all duration-300 ease-in-out
        ${isExiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"}
      `}
    >
      <div
        className={`
          rounded-lg border shadow-lg
          p-4 flex items-start gap-3
          ${getColorClass()}
        `}
      >
        {/* Ícone */}
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">
            {notification.title}
          </p>
          {notification.message && (
            <p className="text-xs opacity-90 mt-1 leading-snug">
              {notification.message}
            </p>
          )}
        </div>

        {/* Botão fechar */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Fechar notificação"
        >
          <CloseIcon width={16} height={16} />
        </button>
      </div>

      {/* Barra de progresso (3 segundos) */}
      <div className="absolute bottom-0 left-0 h-0.5 bg-current opacity-30 rounded-b-lg">
        <div className="h-full animate-[shrink_5s_linear_forwards]" />
      </div>
    </div>
  );
}
