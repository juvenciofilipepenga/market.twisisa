// Efeitos com função: o produto "voa" até ao carrinho (mostra onde foi parar o que adicionou).
export const CART_BUMP_EVENT = "twisisa:cart-bump";
export const SHOW_HEADER_EVENT = "twisisa:show-header";

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const bump = () => window.dispatchEvent(new Event(CART_BUMP_EVENT));

export function flyToCart(source: Element | null, imageUrl: string | null): void {
  if (!source || reducedMotion()) { bump(); return; }
  window.dispatchEvent(new Event(SHOW_HEADER_EVENT));

  const run = () => {
    const target = document.querySelector("[data-cart-target]");
    if (!target) { bump(); return; }
    const a = source.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const size = Math.min(72, Math.max(44, a.width * 0.5));
    const startX = a.left + a.width / 2 - size / 2;
    const startY = a.top + a.height / 2 - size / 2;
    const dx = b.left + b.width / 2 - size / 2 - startX;
    const dy = b.top + b.height / 2 - size / 2 - startY;

    const el = document.createElement("div");
    el.setAttribute("aria-hidden", "true");
    el.style.cssText = `position:fixed;left:${startX}px;top:${startY}px;width:${size}px;height:${size}px;border-radius:16px;z-index:90;pointer-events:none;will-change:transform;box-shadow:0 8px 24px rgba(0,0,0,.5);background:${imageUrl ? `#271F1D url("${imageUrl}") center/cover` : "#EE0006"}`;
    document.body.appendChild(el);

    const anim = el.animate([
      { transform: "translate(0,0) scale(1)", opacity: 1, offset: 0 },
      { transform: `translate(${dx * 0.5}px,${dy * 0.5 - 70}px) scale(0.8)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px,${dy}px) scale(0.2)`, opacity: 0.5, offset: 1 }
    ], { duration: 650, easing: "cubic-bezier(0.4,0.1,0.3,1)" });
    const done = () => { el.remove(); bump(); };
    anim.onfinish = done;
    anim.oncancel = done;
  };

  // Se o cabeçalho estava escondido (scroll para baixo), espera que ele volte antes de medir o destino.
  const target = document.querySelector("[data-cart-target]");
  const hidden = !target || target.getBoundingClientRect().bottom <= 0;
  window.setTimeout(run, hidden ? 300 : 0);
}
