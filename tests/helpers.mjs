import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const read = (p) => readFileSync(path.join(ROOT, p), "utf8");
export const readBin = (p) => readFileSync(path.join(ROOT, p));
export const TEMPLATE = read("index.html");

/** Simula a API pública com respostas fixas. routes: { "/path": {status, body} } */
export function fakeApi(routes, calls = []) {
  return async (p) => {
    calls.push(p);
    const hit = routes[p];
    if (!hit) throw new Error(`rota não simulada: ${p}`);
    if (hit instanceof Error) throw hit;
    return hit;
  };
}
