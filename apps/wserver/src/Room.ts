import { Server } from "socket.io";
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from "./types/events";

interface MapData {
  name: string;
  width: number;
  height: number;
  spaceId: string;
  creatorId: string;
  objectsArray: number[];
}

export class Room {
  roomId: string;
  name: string;
  width: number;
  height: number;
  gridSize: number;
  creatorId: string;
  players: Map<string, { x: number; y: number }> = new Map();
  filledPositions: Set<string> = new Set();
  // No need for activeClients map - Socket.IO rooms handle this!

  constructor(data: MapData) {
    this.name = data.name;
    this.width = data.width;
    this.height = data.height;
    this.roomId = data.spaceId;
    this.creatorId = data.creatorId;
    this.gridSize = this.width * this.height;
    this.players.set(this.creatorId, { x: 0, y: 0 });
    this.fillObjectPositions(data.objectsArray);
  }

  fillObjectPositions(objectsArray: number[]) {
    objectsArray.forEach((item) => {
      const x = item % this.width;
      const y = Math.floor(item / this.width);
      const posKey = `${x},${y}`;
      this.filledPositions.add(posKey);
    });
  }

  addUser(userId: string): { x: number; y: number } | null {
    const emptyPos = this.getEmptyPosition();
    if (!emptyPos) return null;
    const { x, y } = emptyPos;
    const posKey = `${x},${y}`;
    this.filledPositions.add(posKey);
    this.players.set(userId, { x, y });
    console.log("player added:",this.players)
    
    return { x, y };
  }

  removeUser(userId: string): boolean {
    const player = this.players.get(userId);
    if (player) {
      const posKey = `${player.x},${player.y}`;
      this.filledPositions.delete(posKey);
    }
    return this.players.delete(userId);
  }

 movePlayer(userId: string, newX: number, newY: number): boolean {
  console.log(`[movePlayer] Attempting move for userId=${userId} → (${newX}, ${newY})`);

  const player = this.players.get(userId);
  if (!player) {
    console.warn(`[movePlayer] Failed: No player found for userId=${userId}`);
    return false;
  }

  const { x, y } = player;
  console.log(`[movePlayer] Current position: (${x}, ${y})`);

  // Check if movement is valid via checkMove
  const canMove = this.checkMove(x, y, newX, newY);
  console.log(`[movePlayer] checkMove(${x}, ${y}, ${newX}, ${newY}) → ${canMove}`);
  if (!canMove) {
    console.warn(`[movePlayer] Failed: checkMove returned false`);
    return false;
  }

  // Prevent occupying an already filled position
  const newPosKey = `${newX},${newY}`;
  if (this.filledPositions.has(newPosKey)) {
    console.warn(`[movePlayer] Failed: Position (${newX}, ${newY}) already occupied`);
    return false;
  }

  // Update occupied positions
  const oldPosKey = `${x},${y}`;
  this.filledPositions.delete(oldPosKey);
  this.filledPositions.add(newPosKey);

  console.log(`[movePlayer] Updated filled positions: Removed ${oldPosKey}, added ${newPosKey}`);

  // Update player’s new position
  this.players.set(userId, { x: newX, y: newY });
  console.log(`[movePlayer] Success: Player ${userId} moved to (${newX}, ${newY})`);

  return true;
}


  checkMove(x: number, y: number, newX: number, newY: number): boolean {
    return (Math.abs(x - newX) === 1 && y === newY) || 
           (x === newX && Math.abs(y - newY) === 1);
  }

  getEmptyPosition(): { x: number; y: number } | null {
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const posKey = `${x},${y}`;
        if (!this.filledPositions.has(posKey)) {
          return { x, y };
        }
      }
    }
    return null;
  }
}
