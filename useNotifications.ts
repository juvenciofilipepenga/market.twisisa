import { useEffect, useCallback } from "react";
import { useAuth } from "@/auth/AuthContext";
import { getSocket, disconnectSocket } from "@/lib/socket";
import type { AppNotification } from "@/lib/types";

interface NotificationContextType {
  onNotificationReceived: (callback: (notification: AppNotification) => void) => void;
  offNotificationReceived: (callback: (notification: AppNotification) => void) => void;
}

// Event emitter para notificações
let notificationCallbacks: Array<(notification: AppNotification) => void> = [];

export function addNotificationListener(callback: (notification: AppNotification) => void) {
  notificationCallbacks.push(callback);
  return () => {
    notificationCallbacks = notificationCallbacks.filter((cb) => cb !== callback);
  };
}

export function useNotifications() {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      disconnectSocket();
      return;
    }

    try {
      const socket = getSocket(token);

      // Listeners para eventos de notificações
      const handleNotificationCreated = (notification: AppNotification) => {
        // Trigger callbacks
        notificationCallbacks.forEach((cb) => cb(notification));
      };

      socket.on("notification.created", handleNotificationCreated);

      return () => {
        socket.off("notification.created", handleNotificationCreated);
      };
    } catch (error) {
      console.error("Erro ao conectar ao Socket.IO:", error);
    }
  }, [token]);

  return { addNotificationListener };
}
