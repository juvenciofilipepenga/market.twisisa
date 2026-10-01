import React, { createContext, useContext } from "react";
import { useNotificationManager } from "@/lib/useNotificationManager";
import { NotificationToast } from "./NotificationToast";

interface NotificationContextType {
  // Props do contexto se necessário no futuro
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { notifications, removeNotification } = useNotificationManager();

  return (
    <NotificationContext.Provider value={{}}>
      {children}

      {/* Stack de notificações */}
      <div className="fixed bottom-0 right-0 pointer-events-none">
        <div className="flex flex-col gap-2 p-4 max-h-screen overflow-hidden">
          {notifications.map((notification) => (
            <div key={notification.displayId} className="pointer-events-auto">
              <NotificationToast
                notification={notification}
                onClose={removeNotification}
              />
            </div>
          ))}
        </div>
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotificationContext deve ser usado dentro de NotificationProvider"
    );
  }
  return context;
}
