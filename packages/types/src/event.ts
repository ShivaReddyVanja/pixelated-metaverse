import { Player } from ".";
export type EventType = "create" | "join" | "move" | "leave";


type position = {
    x: number,
    y: number
}

type status = "success" | "error";

interface basicResponse {
    event?: EventType,
    status?: status,
    playerId: string,
    message?: string
}

export interface RoomCreated extends basicResponse {
    roomId: string
    spawn: position
}
export interface RoomJoined {
    playerId: string,
    spawn: position
    players: Record<string, Player>;
}
export interface PlayerJoined {
    playerId: string,
    spawn: position
}
export interface PlayerMoved {
    playerId: string,
    position: position
}
export interface PlayerLeft extends basicResponse {
    playerId:string
}