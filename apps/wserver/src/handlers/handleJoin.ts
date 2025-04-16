import { Context } from "../types/Context";
import { ParsedData } from "../types/ParsedData";
export function handleJoin(context:Context, parsedData: Extract<ParsedData,{event:"join"|"leave"}>) {
    const { id, ws } = context;
    const room = context.getRoomOrError(parsedData.spaceId);
    if (!room) return;
  
    context.roomId = room.roomid;
    const emptyPos = room.getEmptyPosition();
  
    if (!emptyPos) {
      ws.send(JSON.stringify({
        event:"join",
        status: "error",
        message: "Room is full , no empty position found"
      }));
      return;
    }
  
    const { x, y } = emptyPos;
    const newPosKey = `${x},${y}`;
    room.filledPositions.add(newPosKey);
    room.players.set(id, { x, y });
  
    room.broadcastMessage(JSON.stringify({
      event:"join",
      status: "success",
      playerId: id,
      spawn: { x, y }
    }));
  }
  