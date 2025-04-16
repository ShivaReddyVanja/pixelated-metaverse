import { Context } from "../types/Context";
import { ParsedData } from "../types/ParsedData";

export function handleMove(context: Context, parsedData: Extract<ParsedData,{event:"move"}>) {
    const { id, ws } = context;
    const room = context.getRoomOrError(parsedData.spaceId);
    if (!room) return;
  
    const player = room.players.get(id);
    if (!player) {
      ws.send(JSON.stringify({
        event:"move",
        status: "error",
        message: "Player not found in the room"
      }));
      return;
    }
  
    const { x, y } = player;
    const { x: newX, y: newY } = parsedData;
    const newPosKey = `${newX},${newY}`;
  
    if (!room.checkMove(x, y, newX, newY)) {
      ws.send(JSON.stringify({
        event:"move",
        status: "error",
        message: "Invalid move: You can only move one step in any direction"
      }));
      return;
    }
  
    if (room.filledPositions.has(newPosKey)) {
      ws.send(JSON.stringify({
        event:"move",
        status: "error",
        message: "Invalid move: Position is already occupied"
      }));
      return;
    }
  
    room.filledPositions.delete(`${x},${y}`);
    room.filledPositions.add(newPosKey);
    room.players.set(id, { x: newX, y: newY });
  
    room.broadcastMessage(JSON.stringify({
      event:"move",
      status: "sucess",
      playerId: id,
      position: { x: newX, y: newY }
    }));
  }
  