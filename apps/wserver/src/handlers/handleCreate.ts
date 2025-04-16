import { Room } from "../Room";
import { RoomManager } from "../RoomManager";
import { ParsedData } from "../types/ParsedData";
import { Context } from "../types/Context";

export function handleCreate(context:Context, parsedData: Extract<ParsedData,{event:"create"}>) {
  const { ws, id } = context;

  if (RoomManager.getInstance().getRoom(parsedData.spaceId)) {
    ws.send(JSON.stringify({
      event:"create",
      status: "error",
      message: "Room already exists"
    }));
    return;
  }

  const newRoom = new Room({
    name: parsedData.name,
    width: parsedData.width,
    height: parsedData.height,
    spaceId: parsedData.spaceId,
    creatorId: id,
    objectsArray: parsedData.objectsArray
  });

  context.roomId = newRoom.roomid;
  RoomManager.getInstance().setRoom(parsedData.spaceId, newRoom);
  console.log("created")
  ws.send(JSON.stringify({
    event:"create",
    roomId: newRoom.roomid,
    status: "success",
    spawn: {
      x: 0,
      y: 0
    }
  }));
}
