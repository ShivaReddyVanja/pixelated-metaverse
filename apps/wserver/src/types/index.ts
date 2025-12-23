export interface RoomData {
  roomId: string;
  name: string;
  width: number;
  height: number;
  gridSize: number;
  creatorId: string;
  proximityRadius?: number;
  maxPeerConnections?: number;
  objectsArray: number[];
}

export type AddUserResult =
  | { x: number; y: number }  // Success: position assigned
  | null  //no slots found
  | 0     //user already exists
  | -1


type Position = {
  x: number,
  y: number
}

export type JoinRoom = {
  type: "join",
  userId: string,
  position: Position,
  socketId:string
}
export type LeaveRoom = {
  type: "leave",
  userId: string
}
export type PlayerMoved = {
  type: "move",
  userId: string,
  position: Position
}

export type PublishSignallingEvent = {
 to:string,
 from:string,
 data:any
}


export type PublishEvents = JoinRoom | LeaveRoom | PlayerMoved