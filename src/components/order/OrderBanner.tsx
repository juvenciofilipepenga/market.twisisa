import { SpeedLines } from "../brand/SpeedLines";

// Faixa vermelha com a mascote: usada nos momentos que merecem destaque (encomenda criada, a caminho, entregue).
export function OrderBanner({ image, title, body }: { image: string; title: string; body: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-primary-active">
      <SpeedLines className="pointer-events-none absolute -left-6 top-3 h-20 w-32 text-white/15" />
      <div className="relative flex items-end justify-between gap-2 pl-5 pt-5">
        <div className="pb-5">
          <p className="font-display text-xl font-extrabold leading-tight text-white">{title}</p>
          <p className="mt-1 max-w-[16rem] text-sm text-white">{body}</p>
        </div>
        <img src={image} alt="" width={900} height={900} className="h-28 w-28 shrink-0 object-contain object-bottom sm:h-32 sm:w-32" />
      </div>
    </div>
  );
}
