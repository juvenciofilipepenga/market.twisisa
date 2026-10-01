import { useSyncExternalStore } from "react";

// Instalação da loja no ecrã inicial (PWA). O navegador dispara "beforeinstallprompt" logo no
// arranque, muito antes de o utilizador abrir /instalar, por isso o evento é guardado aqui
// (initInstall() é chamado uma vez em main.tsx) e a página só lê o estado.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallPlatform = "android" | "ios" | "desktop";

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
let started = false;
const listeners = new Set<() => void>();

function emit() { listeners.forEach((l) => l()); }

function readInstalled(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function initInstall(): void {
  if (started) return;
  started = true;
  installed = readInstalled();

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installed = true;
    emit();
  });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export function detectPlatform(): InstallPlatform {
  const ua = navigator.userAgent;
  // iPadOS 13+ apresenta-se como Mac; distingue-se pelo ecrã táctil.
  if (/iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

export function useInstall() {
  const canPrompt = useSyncExternalStore(subscribe, () => deferred !== null, () => false);
  const isInstalled = useSyncExternalStore(subscribe, () => installed, () => false);

  async function install(): Promise<void> {
    if (!deferred) return;
    const event = deferred;
    await event.prompt();
    await event.userChoice;
    // O evento só pode ser usado uma vez; se foi aceite, "appinstalled" actualiza o estado.
    deferred = null;
    emit();
  }

  return { canPrompt, installed: isInstalled, install };
}
