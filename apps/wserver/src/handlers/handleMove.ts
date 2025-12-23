import { Server, Socket } from "socket.io";
import { RoomManager } from "../RoomManager";
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from "../types/events";
import { moveUser } from "../redisHandlers/actions";
import { publishEvent } from "../redisHandlers/publisherRedis";

type IoServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export async function handleMove(
  io: IoServer,
  socket: IoSocket,
  data: Extract<ClientToServerEvents["player:move"], Function> extends (data: infer T, ...args: any[]) => any ? T : never,
  callback?: (response: any) => void
) {
  try {
    const userId = socket.data.user.userId;
    const roomId = socket.data.user.roomId;
    const room = RoomManager.getInstance().getRoom(roomId);

    if (!room) {
      const error = { event: "move", message: "Room not found" };
      socket.emit("error", error);
      callback?.({ status: "error", ...error });
      return;
    }
    const result = await moveUser(roomId, userId, data.position.x, data.position.y);
    if (result === -1) {
      const error = { event: "move", message: "Room not found" };
      socket.emit("error", error);
      callback?.({ status: "error", ...error });
      return;
    }
    else if (result === 0) {
      const error = { event: "move", message: "Player Not found" };
      socket.emit("error", error);
      callback?.({ status: "error", ...error });
      return;
    }
    else if (result.moved === 0) {
      //Emit only to the user to avoid data unnecessary events
      socket.emit("player:moved", {
        playerId: userId,
        position: { x: result.x, y: result.y }
      });
      callback?.({ status: "rejected", position: { x: result.x, y: result.y } });
      return; // Don't broadcast invalid moves
    }

    // room.updatePlayerProximity(io, userId);
    const payload = { type: "move" as const, userId, position: { x: result.x, y: result.y } };
    await publishEvent(roomId, payload);
    // Broadcast to everyone in the room (only when move was successful)
    // io.in(roomId).emit("player:moved", {
    //   playerId: userId,
    //   position: { x: result.x, y: result.y }
    // });

    callback?.({ status: "success", position: { x: result.x, y: result.y } });
  } catch (error) {
    console.error("handleMove error:", error);
    const errorMsg = { event: "move", message: "Internal server error" };
    socket.emit("error", errorMsg);
    callback?.({ status: "error", ...errorMsg });
  }
}
