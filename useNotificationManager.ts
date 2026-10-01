import { useState, useCallback, useRef, useEffect } from "react";
import { addNotificationListener } from "./useNotifications";
import type { AppNotification } from "@/lib/types";

export interface ToastNotification extends AppNotification {
  displayId: string; // ID único para cada exibição
}

const DEFAULT_DURATION = 5000; // 5 segundos
const MAX_VISIBLE = 3; // Máximo de notificações visíveis

export function useNotificationManager() {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const idCounterRef = useRef(0);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Reproduzir som de notificação
  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio("/sounds/notification.mp3");
      audio.volume = 0.5; // Volume moderado
      audio.play().catch((err) => {
        console.debug("Não foi possível reproduzir som:", err);
      });
    } catch (error) {
      console.debug("Erro ao reproduzir som:", error);
    }
  }, []);

  // Vibrar (Vibration API)
  const vibratePhone = useCallback(() => {
    if (!("vibrate" in navigator)) return;
    try {
      navigator.vibrate([200, 100, 200]); // Padrão: vibra-pausa-vibra
    } catch (error) {
      console.debug("Vibração não suportada:", error);
    }
  }, []);

  // Remover notificação
  const removeNotification = useCallback((displayId: string) => {
    // Limpar timeout se existir
    const timeout = timeoutsRef.current.get(displayId);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(displayId);
    }

    setNotifications((prev) => prev.filter((n) => n.displayId !== displayId));
  }, []);

  // Adicionar notificação
  const addNotification = useCallback(
    (notification: AppNotification) => {
      const displayId = `notif-${++idCounterRef.current}`;
      const toastNotification: ToastNotification = {
        ...notification,
        displayId,
      };

      // Adicionar à fila
      setNotifications((prev) => [...prev, toastNotification].slice(-MAX_VISIBLE));

      // Toque som + vibração
      playNotificationSound();
      vibratePhone();

      // Auto-remover após duration
      const timeout = setTimeout(() => {
        removeNotification(displayId);
      }, DEFAULT_DURATION);

      timeoutsRef.current.set(displayId, timeout);
    },
    [playNotificationSound, vibratePhone, removeNotification]
  );

  // Cleanup de timeouts
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);

  // Adicionar listener de notificações
  useEffect(() => {
    const unsubscribe = addNotificationListener(addNotification);
    return unsubscribe;
  }, [addNotification]);

  return {
    notifications,
    removeNotification,
    addNotification, // Para adicionar manualmente se necessário
  };
}
