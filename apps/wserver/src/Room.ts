import { Player } from "@myapp/types";
import { Server } from "socket.io";
import { io } from ".";
import { publishPlayerFar } from "./redisHandlers/publishEvents";
export default class Room {
  roomid:string
  socketConnections:Map<string,string> = new Map();
  players: Map<string, Player> = new Map();
  playerNeighbors: Map<string, Set<string>> = new Map(); //playerId
  proximityRadius = 5 
  maxPeerConnections = 10;

  constructor(roomId:string){
   this.roomid = roomId;
  }

  addPlayer(player:Player){
    this.socketConnections.set(player.id, player.socketId)
    this.players.set(player.id, player);
    //existing one should get this
  }
  removePlayer(id:string){
    this.players.delete(id);
    this.socketConnections.delete(id);
  }

  clearAllPlayers(){
    this.players.clear();
  }

  changePlayerPosition(user:Player){
    const player = this.players.get(user.id);
    if (!player) return;
    player.x = user.x;
    player.y = user.y;
    this.updatePlayerProximity(io,user.id);
  }
  
  cachePlayers(players:Record<string,Player>){
    this.players = new Map<string,Player>(Object.entries(players));
    console.log("Cached existing players",this.players.keys())
  }
  
  updatePlayerProximity(io:Server, userId: string) {
      const myPos = this.players.get(userId);
      if (!myPos) {
        return;
      }
     
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
            //  publishProximityEvents({
            //   type:"player-near",
            //   userId:id,
            //   socketId:targetPlayer.socketId
            //  })
            io.to(myPos.socketId).emit("player-near", { playerId:id, socketId:targetPlayer.socketId});
            // io.to(targetPlayer.socketId).emit("player-near", { playerId:userId, socketId:myPos.socketId});
          }
        }
      }
  
      // detect players who left proximity
      for (const id of oldSet) {
        if (!newSet.has(id)) {
      
          const targetPlayer = this.players.get(id);
          if (targetPlayer) {
            //send signal to other player
            publishPlayerFar(myPos.socketId, myPos.id, targetPlayer.socketId);
            //send signal to current player
            io.to(myPos.socketId).emit("player-far", { playerId:id, socketId:targetPlayer.socketId});
          }
        }
      }
  
      // save new set
      this.playerNeighbors.set(userId, newSet);
    }
  
    distance(a: { x: number, y: number }, b: { x: number, y: number }) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

}