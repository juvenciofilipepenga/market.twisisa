# Guia de Testes: Notificações Reais + Sistema de Instalação

## 🧪 Testes Locais (Antes do Deploy)

### Setup Inicial

```bash
# 1. Verificar se todos os ficheiros estão no lugar
ls src/lib/useNotifications.ts
ls src/lib/useNotificationManager.ts
ls src/components/notifications/
ls src/components/download/
ls src/pages/DownloadAppPage.tsx
ls public/sounds/notification.mp3

# 2. Compilar TypeScript
npm run build

# 3. Iniciar dev server
npm run dev

# 4. Abrir em browser
open http://localhost:5173
```

### Teste 1: Notificações Reais

#### 1.1 Verificar Conexão Socket.IO

```javascript
// DevTools → Console (abrir em http://localhost:5173)

// Verificar socket conectado
const socket = window.__socket || window.io?.();
console.log("Socket conectado:", socket?.connected);

// Deve retornar: true
```

#### 1.2 Simular Notificação

```javascript
// No console do browser (estar autenticado primeiro!)

// Criar notificação fake
const notification = {
  id: "test-1",
  userId: "seu-user-id",
  type: "ORDER_UPDATE",
  title: "Sua encomenda foi despachada! 🚚",
  message: "Ordem #12345 está a caminho para você",
  createdAt: new Date(),
  readAt: null,
  data: { orderId: "12345" }
};

// Emitir evento (simular backend)
// Nota: Isto só funciona em ambiente de teste local
// Em produção, o backend enviará via Socket.IO

// Se tiver exposto o socket globalmente:
window.__notificationManager?.addNotification(notification);
```

#### 1.3 Validar Som e Vibração

```javascript
// Testar som
const audio = new Audio("/sounds/notification.mp3");
audio.play().then(() => console.log("✓ Som tocou"));

// Testar vibração (só em mobile)
navigator.vibrate([200, 100, 200]);
console.log("✓ Vibração enviada");
```

#### Checklist - Notificações

- [ ] Toast aparece no canto inferior direito
- [ ] Som toca (volume moderado)
- [ ] Toast desaparece após ~5 segundos
- [ ] Botão "X" funciona (remove imediatamente)
- [ ] Múltiplas notificações: max 3 visíveis
- [ ] Cores diferentes por tipo (ORDER_UPDATE = azul, etc)
- [ ] Responsive em mobile (não quebra layout)

---

### Teste 2: Página de Download/Instalação

#### 2.1 Abrir Página

```bash
# No browser
http://localhost:5173/instalar
```

#### Validar Seções

- [ ] **Hero Section**
  - [ ] Título visível e legível
  - [ ] Botão "Instalar Agora" funciona
  - [ ] Badge de plataforma detectada (se mobile)

- [ ] **Critérios (6 Cards)**
  - [ ] Todos os cards aparecem
  - [ ] Hover effect funciona
  - [ ] Ícones aparecem
  - [ ] Badges visíveis

- [ ] **Guia de Instalação**
  - [ ] Plataforma correta detectada
  - [ ] Passos numerados e claros
  - [ ] Texto formatado corretamente

- [ ] **FAQ**
  - [ ] 6 perguntas visíveis
  - [ ] Accordion funciona (expandir/recolher)
  - [ ] Texto das respostas legível

#### 2.2 Testar Detecção de Plataforma

```javascript
// No console
import { usePlatformDetect } from "@/lib/usePlatformDetect";

const platform = usePlatformDetect();
console.log("Plataforma:", {
  isAndroid: platform.isAndroid,
  isIOS: platform.isIOS,
  isWeb: platform.isWeb,
  isMobile: platform.isMobile,
  osName: platform.osName,
  browserName: platform.browserName,
});

// Resultado esperado (varia por device):
// Desktop Chrome: { isWeb: true, isMobile: false, osName: "Windows", browserName: "Chrome" }
// iPhone Safari: { isIOS: true, isMobile: true, osName: "iOS", browserName: "Safari" }
// Android Chrome: { isAndroid: true, isMobile: true, osName: "Android", browserName: "Chrome" }
```

#### 2.3 Testar Responsividade

```bash
# DevTools → F12
# Pressionar Ctrl+Shift+M (Toggle Device Toolbar)

# Testar tamanhos:
# 375px  (Mobile - iPhone SE)
# 768px  (Tablet - iPad)
# 1440px (Desktop - Laptop)

# Verificar:
# - Texto legível
# - Botões clicáveis
# - Sem overflow horizontal
# - Imagens/cards ajustam-se bem
```

#### Checklist - Página Download

- [ ] Carrega rápido (<2s)
- [ ] Sem erros de console
- [ ] Plataforma detectada corretamente
- [ ] Guia de instalação apropriado aparece
- [ ] Todas as seções responsivas
- [ ] Links funcionam (voltar, scroll)
- [ ] CTA final visível

---

## 📱 Testes em Dispositivos Reais

### Antes de Testar

1. **Deploy para staging/production**
   ```bash
   npm run build
   # Deploy seu bundle...
   ```

2. **Ter um domínio HTTPS** (obrigatório para PWA/WebSocket)
   - Socket.IO requer WSS (WebSocket Secure)
   - Notificações requerem HTTPS

### Android (Chrome)

#### Setup
- Device Android com Chrome instalado
- Conectado à WiFi da sua rede (ou internet)
- Abrir DevTools via `chrome://inspect`

#### Teste de Instalação

1. Abrir: `https://seu-dominio.com/instalar`
2. Aguardar carregamento completo
3. **Verificar badge de instalação:**
   - Se aparecer "Instalar app" no menu (⋮)
   - Indicador de app installable no address bar
4. Tocar em ⋮ → "Instalar app" (ou similar)
5. Confirmar
6. Verificar home screen:
   - [ ] Ícone aparece
   - [ ] Nome está correto
   - [ ] Ao tocar abre a página
   - [ ] Em modo fullscreen (sem barra de endereço)

#### Teste de Notificação

1. Estar autenticado
2. Fazer uma encomenda (order)
3. Backend enviará `notification.created` via Socket.IO
4. Verificar:
   - [ ] Toast aparece no canto inferior direito
   - [ ] Som toca (volume do device deve estar ligado)
   - [ ] Telefone vibra (padrão: 200ms-pausa-200ms)
   - [ ] Toast desaparece após 5s
   - [ ] Múltiplas notificações não se sobrepõem

#### Teste Offline

1. App instalada
2. Desligar WiFi/dados móveis
3. Abrir app do launcher
4. Verificar:
   - [ ] Página carrega (cache)
   - [ ] Dados anteriores visíveis (histórico de encomendas)
   - [ ] Aviso "offline" aparece (se tiver)
   - [ ] Ao reconectar, sincroniza automaticamente

#### DevTools Remote

```bash
# Terminal no seu computador
adb devices  # Listar devices
adb forward tcp:9222 localabstract:chrome_devtools_remote

# Depois abrir em Chrome:
chrome://inspect
# Selecionar seu device e inspecionar
```

### iOS (Safari)

#### Setup
- Device iOS (iPhone/iPad) com Safari
- Conectado à mesma WiFi que seu computador
- Opcionalmente: conectar via USB para debugging

#### Teste de Instalação

1. Abrir: `https://seu-dominio.com/instalar` no Safari
2. Toque em ↑ (Partilha) no fundo
3. Procurar "Adicionar à Home" (scroll se necessário)
4. Confirmar nome
5. Verificar home screen:
   - [ ] Ícone aparece
   - [ ] Ao tocar abre a página
   - [ ] Em modo fullscreen (sem barra de Safari)
   - [ ] Status bar visível (hora, battery)

#### Teste de Notificação

1. Estar autenticado
2. Fazer encomenda
3. Verificar:
   - [ ] Toast aparece
   - [ ] Som toca (iOS toca áudio HTML5)
   - **Nota:** iOS não vibra para áudio HTML5 (limitação do iOS)
   - [ ] Toast desaparece

#### Teste Offline

1. App adicionada à home
2. Modo avião ativado
3. Abrir app
4. Verificar cache funciona

#### Debugging via Mac

```bash
# Mac: Safari → Develop → [seu iPhone]
# Inspecionar e ver console logs em tempo real
# Muito útil para verificar erros
```

### Desktop (Chrome/Firefox/Safari)

#### Teste Rápido

1. `http://seu-dominio.com/instalar`
2. Verificar visualmente:
   - [ ] Layout correto
   - [ ] Cores corretas
   - [ ] Tipografia legível
   - [ ] Nenhum scroll horizontal

#### Performance

```bash
# DevTools → Lighthouse → Analyze page load
# Esperado:
# - Performance: >90
# - Accessibility: >90
# - Best Practices: >90
# - SEO: >95
```

#### Teste de Notificação

```javascript
// No console
// Simular notificação (funciona no desktop também)
const notification = {
  id: "test-1",
  type: "ORDER_UPDATE",
  title: "Teste de Notificação",
  message: "Isto é um teste no desktop",
  createdAt: new Date(),
};

// Emitir via Socket.IO (se implementado)
// Ou disparar evento diretamente se tiver exposto
```

---

## 🔍 Verificações Finais

### Antes de Deploy para Produção

#### 1. TypeScript Compilation

```bash
npm run build
# Não deve ter erros
# Warnings são OK se forem deprecation notices
```

#### 2. Lint & Code Quality

```bash
npm run lint
# Se tiver eslint configured
# Sem erros bloqueantes
```

#### 3. Testar em 3+ Dispositivos

| Device | Status | Notas |
|--------|--------|-------|
| Android phone | ⬜ | Testar instalação, notificação, offline |
| iPhone/iPad | ⬜ | Testar instalação, notificação, offline |
| Desktop laptop | ⬜ | Testar layout, performance |

#### 4. Verificar Manifest.webmanifest

```bash
# DevTools → Application → Manifest
# Deve aparecer: "App is installable"
# Sem erros ou avisos vermelhos
```

#### 5. Verificar Arquivos

```bash
# Verificar se existem:
ls public/sounds/notification.mp3
ls public/manifest.webmanifest
ls public/icons/icon-192.png
ls public/icons/icon-512.png
```

#### 6. Verificar Networking

```javascript
// Console - WebSocket deve estar ativo
// DevTools → Network → WS (WebSocket)
// Deve estar conectado e verde
// URL: wss://seu-dominio.com/socket.io/
```

#### 7. Verificar Security Headers

```bash
# Usar online tool: https://securityheaders.com
# Verificar:
# - X-Frame-Options: DENY
# - X-Content-Type-Options: nosniff
# - Strict-Transport-Security: present
```

---

## 🚨 Troubleshooting Common Issues

### Problema: Som não toca

**Causas possíveis:**
1. Arquivo não existe
2. Path incorreto
3. Browser bloqueia autoplay
4. Volume do device está muto

**Solução:**
```bash
# Verificar arquivo
ls -la public/sounds/notification.mp3

# Verificar path no código
// Deve ser "/sounds/notification.mp3" (com /)

# Testar diretamente no browser
// DevTools → Console
const audio = new Audio("/sounds/notification.mp3");
audio.play().catch(err => console.error("Erro:", err));
```

### Problema: Vibração não funciona

**Causa:** iOS não suporta Vibration API para HTML5

**Solução:**
```javascript
// Verificar suporte
if ("vibrate" in navigator) {
  navigator.vibrate([200, 100, 200]);
} else {
  console.log("Vibração não suportada neste device");
}
```

### Problema: Página `/instalar` retorna 404

**Causa:** Rota não adicionada ao React Router

**Solução:**
```tsx
// App.tsx
<Route path="/instalar" element={<DownloadAppPage />} />
```

### Problema: Socket.IO não conecta

**Causas possíveis:**
1. Backend não está rodando
2. CORS não configurado
3. JWT token inválido
4. URL de WebSocket incorreta

**Solução:**
```javascript
// Verificar no console
console.log("Socket conectado?", socket?.connected);
console.log("Socket ID:", socket?.id);

// Verificar erros
socket?.on("connect_error", (error) => {
  console.error("Erro conexão:", error);
});
```

### Problema: Notificação não aparece

**Causas possíveis:**
1. Socket.IO não conectado (ver acima)
2. Provider não está envolvendo App
3. Event listener não registrado

**Solução:**
```tsx
// Verificar Provider
<NotificationProvider>
  {/* Todo o app deve estar aqui */}
</NotificationProvider>

// Verificar se evento é emitido
// DevTools → Network → WS → Frame
// Deve aparecer mensagem "notification.created"
```

---

## 📊 Teste de Performance

### Lighthouse (DevTools)

```bash
# DevTools → Lighthouse → Analyze page load
# Executar em modo privado (evita extensions)

# Esperado:
# Performance:     >90
# Accessibility:   >90
# Best Practices:  >90
# SEO:             >95
```

### Métricas Importantes

| Métrica | Alvo | Ferramenta |
|---------|------|-----------|
| FCP (First Contentful Paint) | <1.8s | Lighthouse |
| LCP (Largest Contentful Paint) | <2.5s | Lighthouse |
| CLS (Cumulative Layout Shift) | <0.1 | Lighthouse |
| TTI (Time to Interactive) | <3.8s | Lighthouse |

### Speed Test Online

```bash
# Usar ferramentas online:
# - https://pagespeed.web.dev/
# - https://www.webpagetest.org/
# - https://www.webpagetest.org/

# Esperado >85 em ambas
```

---

## ✅ Teste Checklist Final

Antes de considerar pronto:

### Notificações
- [ ] Som toca em todas as notificações
- [ ] Vibração funciona em Android
- [ ] Toast aparece no canto inferior direito
- [ ] Toast desaparece após 5s
- [ ] Máximo 3 toasts visíveis simultaneamente
- [ ] Múltiplas notificações não se sobrepõem
- [ ] Cores corretas por tipo
- [ ] Botão "X" funciona

### Página Download
- [ ] Carrega em <2s
- [ ] Plataforma detectada corretamente
- [ ] Guia apropriado aparece
- [ ] Responsivo em 375px, 768px, 1440px
- [ ] FAQ funciona (accordion)
- [ ] Todos os botões funcionam
- [ ] Sem console errors
- [ ] Sem TypeScript warnings

### Instalação App
- [ ] Android: "Instalar app" aparece no menu
- [ ] Android: App fica na home screen
- [ ] iOS: "Adicionar à Home" funciona
- [ ] iOS: App fica na home screen
- [ ] App abre em modo fullscreen

### Geral
- [ ] Lighthouse >90 em todas categorias
- [ ] Sem erros de compilação
- [ ] Build size razoável (<500KB gzipped)
- [ ] Documentação completa
- [ ] Código bem comentado

---

## 📝 Template de Relatório de Teste

```markdown
# Teste de Notificações + Instalação App

## Ambiente
- [ ] Localhost
- [ ] Staging
- [ ] Produção

## Dispositivos Testados
- [ ] Android Phone (Chrome)
- [ ] iPhone/iPad (Safari)
- [ ] Desktop (Chrome/Firefox/Safari)

## Resultados

### Notificações
- Som: ✅ / ⚠️ / ❌
- Vibração: ✅ / ⚠️ / ❌
- Layout: ✅ / ⚠️ / ❌
- Performance: ✅ / ⚠️ / ❌

### Página Download
- Carregamento: ✅ / ⚠️ / ❌
- Responsividade: ✅ / ⚠️ / ❌
- Funcionalidade: ✅ / ⚠️ / ❌
- Performance: ✅ / ⚠️ / ❌

### App Installation
- Android: ✅ / ⚠️ / ❌
- iOS: ✅ / ⚠️ / ❌
- Web: ✅ / ⚠️ / ❌

## Issues Encontrados
1. [Descrição do issue]
2. [Descrição do issue]

## Recomendações
1. [Recomendação]
2. [Recomendação]

## Status Geral
- [ ] Pronto para produção
- [ ] Com issues menores
- [ ] Com issues críticos

---
Testado em: [DATA]
Tester: [NOME]
```

---

## 🎯 Próximo Passo

1. Executar todos os testes acima
2. Documentar resultados
3. Corrigir issues encontrados
4. Deploy para produção
5. Monitoramento pós-launch

