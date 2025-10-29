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
  const roomId = socket.data.user.roomId
  const room = RoomManager.getInstance().getRoom(roomId);

  if (!room) {
    const error = { event: "move", message: "Room not found" };
    socket.emit("error", error);
    callback?.({ status: "error", ...error });
    return;
  }
  console.log("Player positions", data.position,data.position)
  const moved = room.movePlayer(userId, data.position.x, data.position.y);

  if (!moved) {
    const error = { event: "move", message: "Invalid move" };
    socket.emit("error", error);
    callback?.({ status: "error", ...error });
    return;
  }
  
  // Broadcast to everyone in the room
  io.in(roomId).emit("player:moved", {
    playerId: userId,
    position: { x: data.position.x, y: data.position.y }
  });

  callback?.({ status: "success", position: { x: data.position.x, y: data.position.y } });
}
