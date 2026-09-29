import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Ao mudar de página (pathname) volta ao topo; mudar só os filtros da home não faz scroll.
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
