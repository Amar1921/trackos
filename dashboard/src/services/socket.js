import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

let socket = null;

export function getSocket() {
  if (socket) return socket;

  const token = localStorage.getItem('jwt_token');

  socket = io(`${SOCKET_URL}/dashboard`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => console.log('[socket] connecté au dashboard'));
  socket.on('disconnect', (reason) => console.warn('[socket] déconnecté:', reason));
  socket.on('connect_error', (err) => console.error('[socket] erreur:', err.message));

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function subscribeToSite(site_id) {
  getSocket().emit('subscribe:site', site_id);
}

export function unsubscribeFromSite(site_id) {
  getSocket().emit('unsubscribe:site', site_id);
}
