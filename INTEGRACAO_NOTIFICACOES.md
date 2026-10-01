# Integração do Sistema de Notificações Reais

## 📝 Passo 1: Adicionar Ficheiros

Copie os seguintes ficheiros para o frontend:

```
src/
├── lib/
│   ├── useNotifications.ts          ← Ficheiro novo
│   ├── useNotificationManager.ts    ← Ficheiro novo
│
├── components/
│   └── notifications/
│       ├── NotificationToast.tsx    ← Ficheiro novo
│       └── NotificationProvider.tsx ← Ficheiro novo
```

## 🎵 Passo 2: Adicionar Arquivo de Som

Crie/baixe um arquivo de som de notificação e coloque em:
```
public/sounds/notification.mp3
```

**Recomendações:**
- Duração: 0.5-1 segundo
- Volume: Moderado (não invasivo)
- Formato: MP3 ou WAV
- Pode gerar em: https://ttsmp3.com/ ou usar IA

**Prompt para gerar som com IA:**
```
"Create a short (0.5s), pleasant notification sound. 
It should be a gentle bell or chime sound, not too loud, 
suitable for mobile app notifications."
```

## 🔧 Passo 3: Modificar App.tsx

Adicione o `NotificationProvider` ao App.tsx:

```tsx
import { NotificationProvider } from "@/components/notifications/NotificationProvider";

function App() {
  return (
    <NotificationProvider>
      {/* Resto do seu app */}
    </NotificationProvider>
  );
}
```

## 🎨 Passo 4: Atualizar Tailwind Config

Adicione a animação "shrink" ao `tailwind.config.ts`:

```ts
export default {
  theme: {
    extend: {
      animation: {
        shrink: "shrink 5s linear forwards",
      },
      keyframes: {
        shrink: {
          "0%": { width: "100%" },
          "100%": { width: "0%" },
        },
      },
    },
  },
};
```

## 📱 Passo 5: Garantir Permissões

O navegador pedirá permissão para:
- **Notificações:** Automático com Socket.IO (sem necessidade de Service Worker agora)
- **Vibração:** Sem permissão necessária (funciona automaticamente)
- **Áudio:** Sem permissão necessária (mas pode ser bloqueado por autoplay)

Se quiser solicitar permissão explicitamente, adicione este hook:

```ts
// lib/useNotificationPermissions.ts
export function useNotificationPermissions() {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setPermission(perm);
    return perm;
  };

  return { permission, requestPermission };
}
```

E use no Header:

```tsx
const { permission, requestPermission } = useNotificationPermissions();

{permission === "default" && (
  <button onClick={requestPermission}>
    Ativar Notificações
  </button>
)}
```

## ✅ Passo 6: Testar

### Teste manual:
1. Abra a app
2. Abra DevTools (F12)
3. Execute no console:
```js
// Simular notificação (backend vai enviar quando houver evento real)
const socket = window.__socket; // Se expor globalmente para debug
socket?.emit("notification.created", {
  id: "test-1",
  userId: "test",
  type: "ORDER_UPDATE",
  title: "Teste de Notificação",
  message: "Este é um teste com som e vibração",
  createdAt: new Date(),
  readAt: null,
  data: {}
});
```

### Teste real:
1. Colocar uma encomenda (order)
2. Backend enviará notificação via Socket.IO
3. Som toca + vibração executa + toast aparece

## 🔊 Solução de Problemas

### Som não toca
- ✅ Verificar se o arquivo existe em `/public/sounds/notification.mp3`
- ✅ Verificar volume do dispositivo
- ✅ Alguns browsers bloqueiam áudio até primeira interação (clique do user)
- ✅ Verificar console para erros

### Vibração não funciona
- ✅ Apenas funciona em mobile (Android)
- ✅ Verificar se device suporta Vibration API
- ✅ iOS não suporta (sem vibração, apenas som)

### Notificação não aparece
- ✅ Verificar se Socket.IO está conectado (DevTools → Network → WS)
- ✅ Verificar se token JWT é válido
- ✅ Verificar console para erros de conexão

## 🎯 Próximos Passos

1. ✅ Sistema de notificações implementado
2. ⏳ Implementar FASE 2 (Página de Download)
3. ⏳ Gerar imagens/screenshots
4. ⏳ Testes em dispositivos reais

