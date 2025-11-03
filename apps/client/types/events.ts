export type EventType = "create" | "join" | "move" | "leave";

export type IncomingEvent = | { 
    event: "create", 
}

export type CreateRoomEvent = {
    name: string,
    width: number,
    height: number,
    spaceId: string,
    creatorId: string,
    objectsArray: number[],
};

export type JoinPayload = { spaceId: string };

export type MovePayload = {
    spaceId: string,
    x: number,
    y: number
};

export type LeavePayload = { spaceId: string };

//the below types are written for the incoming nessages from the server

type position = {
    x: number,
    y: number
}
type status = "success" | "error";

interface basicResponse {
    event: EventType,
    status: status,
    playerId: string,
    message: string
}
export interface RoomCreated extends basicResponse{
    roomId: string
    status: status
    spawn: position
}
export interface RoomJoined  {
    playerId: string,
    spawn:position
    players: Record<string, { x: number; y: number }>;
}
export interface PlayerMoved {
    playerId: string,
    position: position
}
export interface PlayerLeft extends basicResponse{
   
}