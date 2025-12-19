import { Server, Socket } from "socket.io";
import { RoomManager } from "../RoomManager";
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from "../types/events";
import { removeUser } from "../redisHandlers/redisActions";

type IoServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export async function handleLeave(
  io: IoServer,
  socket: IoSocket,
  data: Extract<ClientToServerEvents["room:leave"], Function> extends (data: infer T, ...args: any[]) => any ? T : never
) {
  try {
    const userId = socket.data.user.userId;
    const roomId = data.spaceId;
    const result = await removeUser(roomId, userId);

    if (result === null) {
      socket.emit("error", { event: "leave", message: "Room not found" });
      return;
    }

    // const room = RoomManager.getInstance().getRoom(data.spaceId);

    if (result) {
      // Leave Socket.IO room
      socket.leave(roomId);
      socket.data.user.roomId = "";

      // Broadcast to remaining users
      socket.to(data.spaceId).emit("player:left", {
        playerId: userId
      });
    }
  } catch (error) {
    console.error("handleLeave error:", error);
    socket.emit("error", { event: "leave", message: "Internal server error" });
  }
}
