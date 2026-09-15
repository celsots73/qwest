import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { registerEvents } from './events';

export function setupSocket(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
    },
    connectionStateRecovery: { maxDisconnectionDuration: 30_000 },
  });

  io.on('connection', socket => {
    console.log(`[ws] connected: ${socket.id}`);
    registerEvents(io, socket);
    socket.on('disconnect', () => console.log(`[ws] disconnected: ${socket.id}`));
  });

  return io;
}
