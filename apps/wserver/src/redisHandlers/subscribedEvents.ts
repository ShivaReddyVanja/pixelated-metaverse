import { Server, Socket } from "socket.io"
import { JoinRoom, LeaveRoom,PlayerMoved as PlayerMoveServer, PublishEvents } from "../types"
import { PlayerJoined,PlayerMoved } from "@myapp/types";
import { getPlayersInRoom } from "./actions";
import { RoomManager } from "../RoomManager";

const handlePlayerJoin = async (io: Server, roomId: string, data: JoinRoom) => {
    const room = RoomManager.getInstance().getRoom(roomId)!;
    const players = await getPlayersInRoom(roomId);
    if (room.players.size === 0) {
        //cache when the server has freshly created a room here
        room.cachePlayers(players);
    }
    else {
        room.addPlayer({
            id: data.userId,
            socketId: data.socketId,
            x: data.position.x,
            y: data.position.y
        })
    }
    io.to(roomId).emit("player:joined", {
        playerId: data.userId,
        spawn: data.position,
        socketId:data.socketId
    } as PlayerJoined);
}

const handlePlayerMove = async (io: Server, roomId: string, data: PlayerMoveServer) => {
    const room = RoomManager.getInstance().getRoom(roomId)!;
    room.changePlayerPosition({id:data.userId,x:data.position.x,y:data.position.y,socketId:''})
    // Broadcast to everyone in the room (only when move was successful)
    io.in(roomId).emit("player:moved", {
        playerId: data.userId,
        position: data.position,
    } as PlayerMoved);
}

const handlePlayerLeave = async (io: Server, roomId: string, data: LeaveRoom) => {
    io.to(roomId).emit("player:left", {
        playerId: data.userId,
        socketId: data.socketId
    });
}


type EventHandler<T extends PublishEvents> = (io: Server, roomId: string, data: T) => Promise<void>;

export const handlers: {
    move: EventHandler<PlayerMoveServer>;
    join: EventHandler<JoinRoom>;
    leave: EventHandler<LeaveRoom>;
} = {
    move: handlePlayerMove,
    join: handlePlayerJoin,
    leave: handlePlayerLeave
}