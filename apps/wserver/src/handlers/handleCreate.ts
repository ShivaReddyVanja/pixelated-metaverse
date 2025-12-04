import { Server, Socket } from "socket.io";
import { RoomManager } from "../RoomManager";
import { Room } from "../Room";
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from "../types/events";

type IoServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function handleCreate(
  io: IoServer,
  socket: IoSocket,
  data: Extract<ClientToServerEvents["room:create"], Function> extends (data: infer T, ...args: any[]) => any ? T : never,
  callback?: (response: any) => void
) {
  const userId = socket.data.user.userId;
  const room = RoomManager.getInstance().getRoom(data.spaceId)

  if (room) {

    const position = room.addUser(userId, socket.id);
    if (!position) {
      socket.emit("error", { event: "join", message: "Room is full" });
      callback?.({ status: "error", event: "join", message: "Room is full" });
      return;
    }
    socket.join(data.spaceId);

    const players = Object.fromEntries(room.players);
    socket.emit("room:joined", {
      playerId: userId,
      players,
      spawn: { x: position.x, y: position.y },
    });

    callback?.({
      status: "success",
      roomId: room.roomId,
      spawn: { x: position.x, y: position.y },
    });

    // broadcast to other players that a new player joined
    socket.to(data.spaceId).emit("room:joined", {
      playerId: userId,
      players,
      spawn: { x: position.x, y: position.y },
    });

    return;
  }

  const newRoomData = new Room({
    name: data.name,
    width: data.width,
    height: data.height,
    spaceId: data.spaceId,
    creatorId: userId,
    objectsArray: data.objectsArray
  });

  const newRoom = RoomManager.getInstance().setRoom(data.spaceId, newRoomData);

  // Join the Socket.IO room (automatic room management!)
  socket.join(data.spaceId);
  const position = newRoom?.addUser(userId, socket.id);

  if (!position) {
    socket.emit("error", { event: "join", message: "Room is full" })
    return;
  }

  const response = {
    status: "success",
    roomId: newRoomData.roomId,
    spawn: { x: position.x, y: position.y }
  };

  socket.emit("room:created", {
    playerId: userId,
    roomId: newRoomData.roomId,
    spawn: { x: 0, y: 0 }
  });
  callback?.(response);
}
