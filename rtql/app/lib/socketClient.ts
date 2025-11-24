// Lightweight client-side socket holder so a socket can be shared across
// route transitions inside the SPA without reconnecting.

import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export function getSocket(): Socket | null {
  return socketInstance;
}

export function setSocket(s: Socket | null) {
  socketInstance = s;
}

export function createStudentSocket(baseUrl: string, auth: Record<string, any> = {}) {
  if (socketInstance) return socketInstance;
  socketInstance = io(baseUrl, { auth });
  return socketInstance;
}

export default { getSocket, setSocket, createStudentSocket };
