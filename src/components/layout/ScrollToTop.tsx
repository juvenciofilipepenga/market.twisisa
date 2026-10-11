import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// Ao entrar numa página, começa SEMPRE no topo (loja, pagamento e painel admin). O navegador deixava a página nova
// "herdar" a posição da anterior, e quem entrava num ecrã começava a meio. Voltar atrás (seta do telemóvel) mantém a
// posição em que a pessoa estava. Mudar só a pesquisa/filtros da mesma página não faz scroll.
export function ScrollToTop() {
  const { pathname } = useLocation();
  const type = useNavigationType();
  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
  }, []);
  useEffect(() => {
    if (type === "POP") return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, type]);
  return null;
}
