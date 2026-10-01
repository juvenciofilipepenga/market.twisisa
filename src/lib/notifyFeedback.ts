// Som e vibração quando chega uma notificação nova. Falha sempre em silêncio:
// os navegadores bloqueiam áudio e vibração antes do primeiro toque do utilizador, e o iPhone não vibra.
let chime: HTMLAudioElement | null = null;

export function playChime(): void {
  try {
    if (!chime) { chime = new Audio("/sounds/notification.wav"); chime.volume = 0.5; }
    chime.currentTime = 0;
    void chime.play().catch(() => { /* áudio bloqueado: sem som, o aviso continua a aparecer */ });
  } catch { /* sem suporte */ }
}

export function vibrate(): void {
  try { navigator.vibrate?.([120, 60, 120]); } catch { /* sem suporte */ }
}
