import { Context } from "../types/Context";
import { ParsedData } from "../types/ParsedData";
export function handleLeave(context:Context, parsedData: Extract<ParsedData,{event:"join"|"leave"}>) {
    const { id, ws } = context;
    const room = context.getRoomOrError(parsedData.spaceId);
    if (!room) return;
  
    const status = room.removeUser(id);
  
    if (status) {
      room.broadcastMessage(JSON.stringify({
        event:"leave",
        status: "success",
        playerId: id
      }));
    } else {
      ws.send(JSON.stringify({
        event:"leave",
        status: "error",
        message: "User not found in the room"
      }));
    }
  }
  