import { CreatePayload } from "@/types/events";
import { getMapData } from "./getMapData";
import { JoinPayload } from "@/types/events";
import { LeavePayload } from "@/types/events";
import { MovePayload } from "@/types/events";
import { sendMessage } from "./websocket";

export const createRoom = (creatorId:string,name:string,spaceId:string) => {

    const { mapWidth, mapHeight, objectsArray } = getMapData();
    const payload: CreatePayload = {
        name,
        creatorId,
        width:mapWidth,
        height:mapHeight,
        spaceId,
        objectsArray
    };
    sendMessage("create",payload)
    
}

export const joinRoom = (spaceId: string) => {

    const payload: JoinPayload = {
        spaceId
    };
    sendMessage("join",payload)
    
}

export const leaveRoom = (spaceId: string) => {
    const payload: LeavePayload = {
        spaceId,
    };
    sendMessage("leave",payload)
}

export const movePlayer = (spaceId: string, x: number, y: number) => {
    const payload: MovePayload = {
        spaceId,
        x,
        y
    };
    sendMessage("move",payload)
 
} 
