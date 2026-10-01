# Twisisa Market: Notificações Reais + Sistema de Instalação do App

## 🎯 Objetivo

Adicionar ao Twisisa Market:
1. **Notificações Reais** com vibração + som
2. **Sistema elegante de instalação do app** com critérios de avaliação

---

## 📋 Análise da Estrutura Existente

### Backend
- ✅ **Socket.IO** já configurado
- ✅ Serviço de realtime (`services/realtime.ts`)
- ✅ Serviço de notifications (`services/notifications.ts`)
- ✅ Rotas REST de notifications (`routes/notifications.ts`)
- ✅ Modelo Prisma de Notification

### Frontend
- ✅ Socket.io-client configurado (`lib/socket.ts`)
- ✅ Página de NotificationsPage
- ✅ AuthContext para gerenciar token

---

## 🔧 Plano de Implementação

### **FASE 1: Notificações Reais em Tempo Real** (Prioridade Alta)

#### 1.1 Hook React para Notificações (`useNotifications.ts`)
- **Responsabilidade:** Gerenciar conexão Socket.IO e listeners de notificações
- **Features:**
  - Conectar socket quando token está disponível
  - Escutar evento `notification.created` do backend
  - Armazenar notificações no estado local
  - Cleanup automático na desmontagem

#### 1.2 Componente de Notificação Toast (`NotificationToast.tsx`)
- **Responsabilidade:** Exibir notificação com som + vibração
- **Features:**
  - Mostrar titulo + mensagem
  - **Vibração:** Usar Vibration API (navigator.vibrate)
  - **Som:** Reproduzir áudio (tocar som de notificação)
  - Desaparecer automaticamente após 5-7 segundos
  - Suporte a click para marcar como lido

#### 1.3 Gerenciador Global de Notificações (`useNotificationManager.ts`)
- **Responsabilidade:** Coordenar múltiplas notificações simultâneas
- **Features:**
  - Stack de notificações (FIFO queue)
  - Limitar máximo de notificações visíveis (ex: 3)
  - Autom. remover após tempo
  - Permitir dismiss manual

#### 1.4 Adicionar Provider no App.tsx
- Envolver App com `<NotificationProvider>`
- Disponibilizar hook `useNotifications()` em qualquer lugar

#### 1.5 Arquivo de Som
- Copiar/criar arquivo `.mp3` ou `.wav` com som de notificação
- Path: `/public/sounds/notification.mp3`
- Usar áudio simples e não invasivo (curto, ~0.5s)

---

### **FASE 2: Sistema de Instalação do App** (Prioridade Alta)

#### 2.1 Página "Download App" (`DownloadAppPage.tsx`)
- **Responsabilidade:** Landing page elegante para instalação
- **Sections:**
  1. **Hero Section**
     - Titulo impactante ("Instale o Twisisa Market")
     - Breve descrição de benefícios
     - CTA principal (botão destacado)
  
  2. **Critérios de Avaliação** (Cards elegantes)
     - Velocidade (⚡ - "Carrega em <2s offline")
     - Segurança (🔒 - "Dados criptografados")
     - Offline (📱 - "Funciona sem internet")
     - Notificações (🔔 - "Alertas em tempo real")
     - Espaço (💾 - "<5MB instalado")
  
  3. **Guia por Plataforma**
     - iOS (manual via bookmark/home screen)
     - Android (APK direto ou via web app)
     - Web (instalar como app ou usar browser)
  
  4. **Screenshots/Mockups**
     - (Usar espaço reservado para imagens que você gerará)
  
  5. **FAQ**
     - Quanto espaço ocupa?
     - Preciso de conta?
     - Funciona sem internet?
     - Como desinstalar?

#### 2.2 Componente "Criteria Card" (`CriteriaCard.tsx`)
- **Responsabilidade:** Exibir um critério de avaliação
- **Features:**
  - Ícone + título + descrição
  - Animação on hover
  - Badge de status (✓ concluído)
  - Background gradient suave

#### 2.3 Detector de Plataforma (`usePlatformDetect.ts`)
- **Responsabilidade:** Identificar SO/browser do utilizador
- **Retorna:** `{ isIOS, isAndroid, isWeb, isMobile, isChromeWeb, isSafari }`
- **Lógica:** User-Agent parsing

#### 2.4 Componente de Instalação por Plataforma (`PlatformInstallGuide.tsx`)
- **Responsabilidade:** Mostrar instruções específicas
- **Exemplo Android:**
  ```
  1. Abra este site no Chrome
  2. Toque em ⋮ (menu) → Instalar app
  3. Pronto! Abra do seu launcher
  ```
- **Exemplo iOS:**
  ```
  1. Abra no Safari
  2. Toque em Partilhar → Adicionar à Home Screen
  3. Nomeie o app e confirme
  ```

#### 2.5 PWA Enhancements
- **Verificar/atualizar:** `manifest.webmanifest`
  - `start_url: "/"`
  - `display: "standalone"`
  - Ícones corretos (192x192, 512x512)
  - Theme color e background color
  
- **Service Worker melhorado** (se não existir)
  - Cache de assets estáticos
  - Offline fallback
  - Push notifications ready

#### 2.6 Rota no Router
- Adicionar rota: `/downloads` ou `/instalar`
- Acessível from: Header (botão ou menu), Home page CTA

---

### **FASE 3: Integração + Testes** (Prioridade Média)

#### 3.1 Backend
- Nenhuma alteração necessária (já está pronto!)

#### 3.2 Frontend - Integração
- Adicionar botão "Instalar" na Header (se em mobile)
- Mostrar banner sugestão de instalação após visita

#### 3.3 Testes
- ✅ Som toca em todas as notificações
- ✅ Vibração funciona em Android/iOS
- ✅ Múltiplas notificações não se sobrepõem
- ✅ Página download carrega rápido
- ✅ Responsivo em mobile e desktop
- ✅ Instruções claras por plataforma

---

## 📁 Estrutura de Ficheiros a Criar/Modificar

```
frontend/src/
├── components/
│   ├── notifications/
│   │   ├── NotificationToast.tsx       (NEW)
│   │   ├── NotificationProvider.tsx    (NEW)
│   │   └── NotificationStack.tsx       (NEW)
│   ├── download/
│   │   ├── CriteriaCard.tsx            (NEW)
│   │   ├── PlatformInstallGuide.tsx    (NEW)
│   │   └── DownloadAppHero.tsx         (NEW)
│   └── layout/
│       └── Header.tsx                  (MODIFY - adicionar botão instalar)
│
├── pages/
│   └── DownloadAppPage.tsx             (NEW)
│
├── lib/
│   ├── useNotifications.ts             (NEW)
│   ├── useNotificationManager.ts       (NEW)
│   ├── usePlatformDetect.ts            (NEW)
│   └── socket.ts                       (MODIFY - adicionar listeners)
│
├── App.tsx                             (MODIFY - adicionar Provider)
│
└── i18n/
    └── dictionaries.ts                 (MODIFY - adicionar strings)

public/
├── sounds/
│   └── notification.mp3                (NEW - você pode gerar)
└── manifest.webmanifest                (VERIFY/UPDATE)
```

---

## 🎨 Prompts para Geração de Imagens (ChatGPT)

### Screenshot para App Store/Play Store
```
"A modern mobile app interface for Twisisa Market showing:
- Clean header with Twisisa logo
- Grid of colorful product cards
- Bottom navigation with Home, Cart, Profile icons
- Soft gradient background (blues and purples)
- Style: Modern Material Design, bright and friendly"
```

### Illustration para Critérios
```
"Icon illustration set for app installation criteria:
1. Lightning bolt (⚡) for speed
2. Lock/shield (🔒) for security
3. Cloud with arrow down (📱) for offline
4. Bell (🔔) for notifications
5. Database (💾) for storage
Color: gradient blues and purples, minimalist style"
```

### Hero Image para Download Page
```
"Hero banner for app installation landing page:
- Left side: 3D mobile phone mockup showing Twisisa app interface
- Right side: Text 'Instale o Twisisa Market' with benefits list
- Background: Soft gradient (blue to purple)
- Style: Modern, professional, welcoming"
```

---

## ⏰ Estimativa de Desenvolvimento

| Componente | Complexidade | Tempo |
|-----------|-------------|-------|
| Hook useNotifications | ⭐⭐ | 1-2h |
| NotificationToast + Toast Stack | ⭐⭐ | 1.5-2h |
| Arquivo de som | ⭐ | 0.5h |
| DownloadAppPage estrutura | ⭐⭐⭐ | 2-3h |
| CriteriaCard + PlatformGuide | ⭐⭐ | 1.5-2h |
| usePlatformDetect | ⭐ | 0.5h |
| Integração e testes | ⭐⭐ | 1-2h |
| **TOTAL** | | **8-12.5h** |

---

## ✅ Critérios de Sucesso

- [ ] Notificações aparecem em tempo real
- [ ] Som toca (audível)
- [ ] Vibração funciona em mobile
- [ ] Página download carrega <2s
- [ ] Funciona em iOS, Android e Web
- [ ] Instruções claras e elegantes
- [ ] Design responsivo
- [ ] Sem poluição da interface existente
- [ ] Código bem documentado

---

## 📝 Próximas Ações

1. **Iniciar FASE 1** - Sistema de notificações reais
2. Implementar hooks e componentes de notificação
3. Testar com múltiplas notificações simultâneas
4. **Iniciar FASE 2** - Página de download
5. Criar landing page com critérios
6. Gerar imagens/screenshots (via ChatGPT)
7. Fazer ajustes de UX/design

