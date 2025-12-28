import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

type PlayerData = {
  x: number,
  y: number,
}

export type PlayersMap = Record<string, PlayerData>;

type GameState = {
  spaceId: string
  players: PlayersMap,
  setSpaceId: (id: string) => void
  setPlayerPosition: (id: string, x: number, y: number) => void
  setPlayers: (players: PlayersMap) => void
  removePlayer: (id: string) => void
}

export const usePlayersStore = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    spaceId: "",
    players: {},

    setPlayerPosition: (playerId, x, y) => {
      const current = get().players;
      set({
        players: {
          ...current,
          [playerId]: { x, y },
        },
      });
    },

    setPlayers: (players) => set({ players }),

    removePlayer: (id) => {
      const current = get().players;
      const { [id]: _, ...rest } = current;
      set({ players: rest });
    },

    setSpaceId: (id) => set({ spaceId: id })
  }))
);
