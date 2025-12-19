export interface RoomData {
  roomId: string;
  name: string;
  width: number;
  height: number;
  gridSize: number;
  creatorId: string;
  proximityRadius?:number; 
  maxPeerConnections?:number;
  objectsArray: number[];
}

export type AddUserResult = 
  | { x: number; y: number }  // Success: position assigned
  | null  //no slots found
  | 0     //user already exists
  | -1