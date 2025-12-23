import { Server, Socket } from "socket.io";
import { RoomManager } from "../RoomManager";
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from "../types/events";
import { addUser, getPlayersInRoom } from "../redisHandlers/actions";
import { publishEvent } from "../redisHandlers/publisherRedis";
import { RoomJoined } from "@myapp/types";

type IoServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export async function handleJoin(
  io: IoServer,
  socket: IoSocket,
  data: Extract<ClientToServerEvents["room:join"], Function> extends (data: infer T, ...args: any[]) => any ? T : never,
  callback?: (response: any) => void
) {
  try {
    const userId = socket.data.user.userId;
    const roomId = data.spaceId;
    const position = await addUser(roomId, userId, socket.id);

    if (position === -1) {
      const error = { event: "join", message: "Room Not found" };
      socket.emit("error", error);
      callback?.({ status: "error", ...error });
      return;
    }
    else if (position === null) {
      const error = { event: "join", message: "Room is full" }
      socket.emit("error", error);
      callback?.({ status: "error", ...error });
      return;
    }
    else if (position === 0) {
      const error = { event: "join", message: "Already in the room" };
      socket.emit("error", error);
      socket.join(data.spaceId);
      socket.data.user.roomId = data.spaceId;
      callback?.({ status: "error", ...error });
      return;
    }

    const room = RoomManager.getInstance().getRoom(roomId)!;

    // Join Socket.IO room
    socket.join(data.spaceId);
    socket.data.user.roomId = data.spaceId; // Track room in socket data

    const result = await getPlayersInRoom(roomId);

    if (result === null) {
      const error = { event: "join", message: "No room found, while trying to fetch the players" }
      socket.emit("error", error);
      callback?.({ status: "error", ...error });
      return;
    }

    const payload = { type: "join" as const, userId, position,socketId:socket.id};
    await publishEvent(roomId, payload);

    //cache the players in the room
    const players = result;
    // // Broadcast to everyone in the room (including sender)
    socket.emit("room:joined", {
      playerId: userId,
      players,
      spawn: position,
    });
    // console.log('PLAYERS DATA',players);
    

    callback?.({ status: "success", position });
  } catch (error) {
    console.error("handleJoin error:", error);
    const errorMsg = { event: "join", message: "Internal server error" };
    socket.emit("error", errorMsg);
    callback?.({ status: "error", ...errorMsg });
  }
}
