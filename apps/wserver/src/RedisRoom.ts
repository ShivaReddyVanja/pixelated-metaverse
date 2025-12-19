
export default class Room {
  roomid:string
  socketConnections:Map<string,string> = new Map();
  playerNeighbors: Map<string, Set<string>> = new Map();

  constructor(roomId:string){
   this.roomid = roomId;
  }

  addSocket(playerId:string,socketId:string){
   this.socketConnections.set(playerId,socketId)
  }
  
  removeSocket(playerId:string){
    this.socketConnections.delete(playerId);
  }


}