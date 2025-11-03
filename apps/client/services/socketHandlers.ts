import { RoomCreated, RoomJoined, PlayerLeft, PlayerMoved } from '@/types/events';
import { usePlayersStore } from '@/store/playersStore';
import { gameEmitter } from '@/lib/GameEmitter';


export const handleCreated = (data: RoomCreated) => {
    const { setSpaceId, setPlayerPosition } = usePlayersStore.getState();
    const { roomId, spawn, playerId } = data;
    setSpaceId(roomId);
    setPlayerPosition(playerId, spawn.x, spawn.y)
    console.log("player created at",playerId,spawn.x,spawn.y)
}

export const handleJoined = (data: RoomJoined) => {
    const { setPlayers, setPlayerPosition } = usePlayersStore.getState();
    const { playerId, players, spawn } = data;
    setPlayers(players);
    // Ensure the joining player is present
    setPlayerPosition(playerId, spawn.x, spawn.y);
    console.log("player joined at",playerId,spawn.x,spawn.y)
}

export const handleMoved = (data: PlayerMoved) => {
    const { setPlayerPosition } = usePlayersStore.getState();
    const {playerId,position} = data;
    setPlayerPosition(playerId, position.x, position.y);

    gameEmitter.emit("moveProcessed", playerId);
}

export const handleLeft = (data: PlayerLeft) => {
    const { removePlayer } = usePlayersStore.getState();
    const {playerId} = data;
    removePlayer(playerId);
}