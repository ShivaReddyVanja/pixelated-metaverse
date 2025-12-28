import { Server, Socket } from "socket.io";
import { RoomManager } from "../RoomManager";
import Room from "../Room";
import { addUser, checkIfRoomExists, createRoom } from "../redisHandlers/actions";
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from "../types/events";
import { handleJoin } from "./handleJoin";

type IoServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export async function handleCreate(
  io: IoServer,
  socket: IoSocket,
  data: Extract<ClientToServerEvents["room:create"], Function> extends (data: infer T, ...args: any[]) => any ? T : never,
  callback?: (response: any) => void
) {
  try {
    const userId = socket.data.user.userId;
    const roomId = data.spaceId;
    const roomExists = await checkIfRoomExists(roomId);

    if (roomExists) {
      await handleJoin(io, socket, data, callback);
      return;
    }

    const roomData = {
      roomId: data.spaceId,
      name: data.name,
      width: data.width,
      height: data.height,
      gridSize: data.width * data.height,
      creatorId: userId,
      objectsArray: data.objectsArray
    }


    const result = await createRoom(roomData, userId, socket.id);

    if (result === null) {
      socket.emit("error", { event: "create", message: "Room already exists, currently its full" })
      return;
    }
    if (result === 0) {
      socket.emit("error", { event: "create", message: "Room already exists, you are in the room" })
      return;
    }
    if (result === -1) {
      socket.emit("error", { event: "create", message: "Room created, error while adding to the room" })//room might not be accessible
      return;
    }

    const room = RoomManager.getInstance().getRoom(roomId)!;
    // Join the Socket.IO room (automatic room management!)
    socket.join(data.spaceId);
    socket.data.user.roomId = data.spaceId; // Track room in socket data
    //add the player to local room instance for proximity calculations
    room.addPlayer({ 
      id:userId,
      x:result.x, 
      y:result.y, 
      socketId:socket.id
    });

    const response = {
      status: "success",
      roomId,
      spawn: { x: result.x, y: result.y }
    };

    socket.emit("room:created", {
      playerId: userId,
      roomId,
      spawn: { x: result.x, y: result.y }
    });
    callback?.(response);
  } catch (error) {
    console.error("handleCreate error:", error);
    const errorMsg = { event: "create", message: "Internal server error" };
    socket.emit("error", errorMsg);
    callback?.({ status: "error", ...errorMsg });
  }
}
