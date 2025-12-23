import {JwtTokenPayload} from "@myapp/types"
type Player = { id:string, x: number; y: number ,socketId:string};
type PlayersMap = Record<string, Player>;

export interface ServerToClientEvents {
  "webrtc-signaling": (data: {
    from: string;
    data: any;
  }) => void;

  "room:created": (data: {
     playerId:string;
     roomId: string; 
     spawn: { x: number; y: number } 
    }) => void;

  "room:joined": (data: { 
    playerId: string;
    players: PlayersMap
    spawn: { x: number; y: number }
   }) => void;

  "player:moved": (data: { 
    playerId: string;
    position: { x: number; y: number }
    }) => void;

  "player:left": (data: { 
    playerId: string 
  }) => void;

  "error": (data: { event: string; message: string }) => void;
}

export interface ClientToServerEvents {
  "webrtc-signaling": (data: {
    to: string;
    data: any;
  }) => void;
  "room:create": (data: {
    token: string;
    name: string;
    width: number;
    height: number;
    spaceId: string;
    objectsArray: number[];
  }, callback?: (response: any) => void) => void;
  
  "room:join": (data: {
    token: string;
    spaceId: string;
  }, callback?: (response: any) => void) => void;
  
  "room:leave": (data: {
    token: string;
    spaceId: string;
  }) => void;
  
  "player:move": (data: {
    playerId:string,
    position:{
      x:number,
      y:number
    }
  }, callback?: (response: any) => void) => void;
}


export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  user: {
    userId: string;
    roomId: string;
    name: string;
    iat: number; // issued-at timestamp
    exp: number; // expiry timestamp
  };
}