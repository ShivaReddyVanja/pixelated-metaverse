import { Server, Socket } from "socket.io";
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from "./types/events";
import RedisClient from "./RedisInstance";

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
  proximityRadius = 3  
  maxPeerConnections = 10;
  playerNeighbors: Map<string, Set<string>> = new Map();
  players: Map<string, { x: number; y: number; socketId: string }> = new Map();
  filledPositions: Set<string> = new Set(); //purely used for objects
  filledPlayerPositions: Set<String> = new Set();//purely used for players


  constructor(data: MapData) {
    this.name = data.name;
    this.width = data.width;
    this.height = data.height;
    this.roomId = data.spaceId;
    this.creatorId = data.creatorId;
    this.gridSize = this.width * this.height;
    // this.players.set(this.creatorId, { x: 0, y: 0 });
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

  addUser(userId: string, socketId: string): { x: number; y: number } | null {
    const emptyPos = this.getEmptyPosition();
    if (!emptyPos) return null;
    const { x, y } = emptyPos;
    const posKey = `${x},${y}`;
    this.filledPlayerPositions.add(posKey);
    this.players.set(userId, { x, y, socketId });
    return { x, y };
  }

  removeUser(userId: string): boolean {
    const player = this.players.get(userId);
    if (player) {
      const posKey = `${player.x},${player.y}`;
      this.filledPlayerPositions.delete(posKey);
    }
    return this.players.delete(userId);
  }

  movePlayer(userId: string, newX: number, newY: number): boolean {
    const player = this.players.get(userId);

    if (!player) {
      return false;
    }
    const { x, y } = player;
    const canMove = this.checkMove(x, y, newX, newY);
    if (!canMove) {
      return false;
    }

    // Prevent occupying an already filled position
    const newPosKey = `${newX},${newY}`;
    if (this.filledPositions.has(newPosKey)) {
      return false;
    }

    // Update occupied positions
    const oldPosKey = `${x},${y}`;
    this.filledPositions.delete(oldPosKey);
    this.filledPositions.add(newPosKey);

    // Update player’s new position
    this.players.set(userId, { x: newX, y: newY, socketId: player.socketId });

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
        if (!this.filledPositions.has(posKey) && !this.filledPlayerPositions.has(posKey)) {
          return { x, y };
        }
      }
    }
    return null;
  }

  distance(a: { x: number, y: number }, b: { x: number, y: number }) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  updatePlayerProximity(userId: string) {
    const myPos = this.players.get(userId);
    if (!myPos) return;

    const oldSet = this.playerNeighbors.get(userId) || new Set();
    let newSet = new Set<string>();
    
    // compute nearby players
    const nearby: { id: string; dist: number }[] = [];
    for (const [otherId, pos] of this.players.entries()) {
      if (otherId === userId) continue;

      const d = this.distance(myPos, pos);
      if (d <= this.proximityRadius) {
        nearby.push({ id: otherId, dist: d });
      }
    }
    nearby.sort((a, b) => a.dist - b.dist);
    const limited = nearby.slice(0, this.maxPeerConnections);
    newSet = new Set(limited.map(n => n.id));

    // detect newly nearby players
    for (const id of newSet) {
      if (!oldSet.has(id)) {
        const targetPlayer = this.players.get(id);
        if (targetPlayer) {
          io.to(myPos.socketId).emit("player-near", { playerId:id, socketId:targetPlayer.socketId}); // tell X  that other player is near
          io.to(targetPlayer.socketId).emit("player-near", { playerId:userId, socketId:myPos.socketId}); // tell the other player that X is near
        }
      }
    }

    // detect players who left proximity
    for (const id of oldSet) {
      if (!newSet.has(id)) {
        console.log("newly nearby player", id)
        const targetPlayer = this.players.get(id);
        if (targetPlayer) {
          io.to(myPos.socketId).emit("player-far", { playerId:id, socketId:targetPlayer.socketId});
          io.to(targetPlayer.socketId).emit("player-far", { playerId:userId, socketId:myPos.socketId});
        }
      }
    }

    // save new set
    this.playerNeighbors.set(userId, newSet);
  }


}
