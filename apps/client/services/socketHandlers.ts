import { RoomCreated, RoomJoined, PlayerLeft, PlayerMoved } from '@/types/events';
import { usePlayersStore } from '@/store/playersStore';

const { setPlayerPosition, setPlayers, removePlayer, setSpaceId } = usePlayersStore();

export const handleCreated = (data: RoomCreated) => {
    const { roomId, spawn, playerId } = data;
    setSpaceId(roomId);
    setPlayerPosition(playerId, spawn.x, spawn.y)
}

export const handleJoined = (data: RoomJoined) => {
    const { playerId, players, spawn } = data;
    setPlayers(players);
    // Ensure the joining player is present
    setPlayerPosition(playerId, spawn.x, spawn.y);
}

export const handleMoved = (data: PlayerMoved) => {
    const {playerId,position} = data;
    setPlayerPosition(playerId, position.x, position.y);
}

export const handleLeft = (data: PlayerLeft) => {
        const {playerId} = data;
        removePlayer(playerId);
}