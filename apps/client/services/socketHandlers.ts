import { RoomCreated, RoomJoined, PlayerLeft, PlayerMoved, PlayerJoined } from '@/types/events';
import { usePlayersStore } from '@/store/playersStore';
import { gameEmitter } from '@/lib/GameEmitter';

//created and 
export const roomCreated = (data: RoomCreated) => {
    const { setSpaceId, setPlayerPosition } = usePlayersStore.getState();
    const { roomId, spawn, playerId } = data;
    setSpaceId(roomId);
    setPlayerPosition(playerId, spawn.x, spawn.y)
    console.log("player created at",playerId,spawn.x,spawn.y)
}

export const roomJoined = (data: RoomJoined) => {
    const { setPlayers, setPlayerPosition } = usePlayersStore.getState();
    const { playerId, players, spawn } = data;
    setPlayers(players);
    // Ensure the joining player is present
    setPlayerPosition(playerId, spawn.x, spawn.y);
    console.log("player joined at",playerId,spawn.x,spawn.y)
}


export const newPlayerJoined = (data: PlayerJoined) => {
    const {setPlayerPosition } = usePlayersStore.getState();
    const { playerId, spawn } = data;
    setPlayerPosition(playerId, spawn.x, spawn.y);
    console.log("player",playerId,"spawnned at",spawn.x,spawn.y);
}

export const playerMoved = (data: PlayerMoved) => {
    const { setPlayerPosition } = usePlayersStore.getState();
    const {playerId,position} = data;
    setPlayerPosition(playerId, position.x, position.y);
    gameEmitter.emit("moveProcessed", playerId);
}

export const playerLeft = (data: PlayerLeft) => {
    const { removePlayer } = usePlayersStore.getState();
    const {playerId} = data;
    removePlayer(playerId);
}