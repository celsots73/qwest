// In-memory room state (use Redis adapter for horizontal scaling)
// ponytail: in-memory Map, replace with ioredis if >1 server instance needed

export interface RoomState {
  sessionId: string;
  pin: string;
  hostSocketId: string;
  currentQ: number;
  questionStartedAt: number; // ms timestamp
  status: 'waiting' | 'active' | 'between' | 'finished';
  answerCount: number;
  totalParticipants: number;
}

const rooms = new Map<string, RoomState>(); // key = pin

export const roomManager = {
  create(pin: string, sessionId: string, hostSocketId: string): RoomState {
    const state: RoomState = {
      pin,
      sessionId,
      hostSocketId,
      currentQ: 0,
      questionStartedAt: 0,
      status: 'waiting',
      answerCount: 0,
      totalParticipants: 0,
    };
    rooms.set(pin, state);
    return state;
  },

  get(pin: string) {
    return rooms.get(pin);
  },

  update(pin: string, patch: Partial<RoomState>) {
    const room = rooms.get(pin);
    if (!room) return null;
    Object.assign(room, patch);
    return room;
  },

  delete(pin: string) {
    rooms.delete(pin);
  },

  findBySocketId(socketId: string): RoomState | undefined {
    return [...rooms.values()].find(r => r.hostSocketId === socketId);
  },
};
