import { Server, Socket } from "socket.io";
import { RoomManager } from "../RoomManager";
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from "../types/events";

type IoServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function handleJoin(
  io: IoServer,
  socket: IoSocket,
  data: Extract<ClientToServerEvents["room:join"], Function> extends (data: infer T, ...args: any[]) => any ? T : never,
  callback?: (response: any) => void
) {
  const userId = socket.data.user.userId;
  const room = RoomManager.getInstance().getRoom(data.spaceId);

  if (!room) {
    const error = { event: "join", message: "Room not found" };
    socket.emit("error", error);
    callback?.({ status: "error", ...error });
    return;
  }

  const spawn = room.addUser(userId, socket.id);

  if (!spawn) {
    const error = { event: "join", message: "Room is full, no empty position found" };
    socket.emit("error", error);
    callback?.({ status: "error", ...error });
    return;
  }

  // Join Socket.IO room
  socket.join(data.spaceId);

  const players = Object.fromEntries(room.players);
  // Broadcast to everyone in the room (including sender)
  io.to(data.spaceId).emit("room:joined", {
    playerId: userId,
    players,
    spawn,
  });

  callback?.({ status: "success", spawn });
}
