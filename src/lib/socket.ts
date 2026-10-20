import { io, type Socket } from "socket.io-client";

// O backend expõe Socket.IO no mesmo host/porta da API REST (não em "/api/v1", na raiz),
// autenticado por um token JWT enviado em socket.handshake.auth.token — ver src/server.ts
// do backend. Reaproveita-se a mesma origem de VITE_API_URL, só sem o sufixo /api/v1.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
const SOCKET_URL = API_URL.replace(/\/api\/v1\/?$/, "");

let socket: Socket | null = null;
// A API está alojada em Vercel Functions, que não mantém o processo necessário
// para o Socket.IO persistente. O tempo real fica desactivado por omissão e o
// chat/painel usam a sincronização HTTP já implementada. Só activar em servidor
// persistente definindo VITE_ENABLE_SOCKET=true.
const SOCKET_ENABLED = import.meta.env.VITE_ENABLE_SOCKET === "true";

export function getSocket(token: string): Socket {
  // Reutiliza a ligação enquanto estiver activa (a ligar OU ligada): recriá-la a meio de uma ligação em curso
  // deitaria fora os listeners que outros ecrãs já tinham registado.
  if (socket && (socket.active || !SOCKET_ENABLED)) return socket;
  if (!SOCKET_ENABLED) return null as unknown as Socket;
  if (socket) socket.disconnect();
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnectionDelayMax: 30_000,
    autoConnect: SOCKET_ENABLED,
  });
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
