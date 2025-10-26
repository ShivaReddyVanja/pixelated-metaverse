import { Server, Socket } from "socket.io";
import { RoomManager } from "../RoomManager";
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from "../types/events";

type IoServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function handleMove(
  io: IoServer,
  socket: IoSocket,
  data: Extract<ClientToServerEvents["player:move"], Function> extends (data: infer T, ...args: any[]) => any ? T : never,
  callback?: (response: any) => void
) {
  const userId = socket.data.user.userId;
  const room = RoomManager.getInstance().getRoom(data.spaceId);

  if (!room) {
    const error = { event: "move", message: "Room not found" };
    socket.emit("error", error);
    callback?.({ status: "error", ...error });
    return;
  }

  const moved = room.movePlayer(userId, data.x, data.y);

  if (!moved) {
    const error = { event: "move", message: "Invalid move" };
    socket.emit("error", error);
    callback?.({ status: "error", ...error });
    return;
  }
  
  // Broadcast to everyone in the room
  io.to(data.spaceId).emit("player:moved", {
    playerId: userId,
    position: { x: data.x, y: data.y }
  });

  callback?.({ status: "success", position: { x: data.x, y: data.y } });
}
