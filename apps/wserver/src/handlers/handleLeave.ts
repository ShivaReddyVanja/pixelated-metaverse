import { Server, Socket } from "socket.io";
import { RoomManager } from "../RoomManager";
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from "../types/events";

type IoServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function handleLeave(
  io: IoServer,
  socket: IoSocket,
  data: Extract<ClientToServerEvents["room:leave"], Function> extends (data: infer T, ...args: any[]) => any ? T : never
) {
  
  const userId = socket.data.user.userId;
  const room = RoomManager.getInstance().getRoom(data.spaceId);

  if (!room) {
    socket.emit("error", { event: "leave", message: "Room not found" });
    return;
  }

  const removed = room.removeUser(userId);

  if (removed) {
    // Leave Socket.IO room
    socket.leave(data.spaceId);
    socket.data.user.roomId = "";

    // Broadcast to remaining users
    socket.to(data.spaceId).emit("player:left", {
      playerId: userId
    });
  }
}
