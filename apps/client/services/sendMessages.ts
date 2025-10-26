import { CreatePayload } from "@/types/events";
import { getMapData } from "../utils/getMapData";
import { JoinPayload } from "@/types/events";
import { LeavePayload } from "@/types/events";
import { MovePayload } from "@/types/events";
import useSocket from "@/hooks/useSocket"




export const leaveRoom = (spaceId: string) => {
    const payload: LeavePayload = {
        spaceId,
    };
    socketEmitter("leave",payload);
}

export const movePlayer = (spaceId: string, x: number, y: number) => {
    const payload: MovePayload = {
        spaceId,
        x,
        y
    };
    socketEmitter("move",payload);
} 
