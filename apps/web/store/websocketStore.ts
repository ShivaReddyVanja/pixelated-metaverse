// stores/webSocketStore.ts
import { create } from 'zustand';

type WebSocketStore = {
  socket: WebSocket | null;
  setSocket: (socket: WebSocket) => void;
  closeSocket: () => void;
};

export const useWebSocketStore = create<WebSocketStore>((set, get) => ({
  socket: null,

  setSocket: (socket: WebSocket) => set({ socket }),

  closeSocket: () => {
    const current = get().socket;
    if (current && current.readyState === WebSocket.OPEN) {
      current.close();
    }
    set({ socket: null });
  },
}));
