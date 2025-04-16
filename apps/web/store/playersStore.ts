import {create} from "zustand";

type PlayerData ={
    x:number,
    y:number,

}
type PlayersMap = Record<string,PlayerData>;

type PlayersState ={
        players:PlayersMap,
        setPlayerPosition:(id:string,x:number,y:number)=>void
        setPlayers:(players:PlayersMap)=>void
}
export const usePlayersStore = create<PlayersState>((set, get) => ({
    players: {},
  
    setPlayerPosition: (playerId, x, y) => {
      const current = get().players;
      const player = current[playerId];
  
      if (player) {
        set({
          players: {
            ...current,
            [playerId]: { ...player, x, y },
          },
        });
      }
    },
  
    setPlayers: (players) => set({ players }),
  }));
  