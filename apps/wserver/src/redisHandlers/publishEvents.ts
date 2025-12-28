import { server } from "typescript";
import RedisClient from "../RedisInstance"
import { RoomManager } from "../RoomManager";
import { PublishEvents,PlayerFar,PublishSignallingEvent} from "../types"
import { getPlayerServerId } from "./actions";

export const publishEvent = async (roomId: string, data: PublishEvents) => {
    const redis = await RedisClient.getInstance();
    const payload = JSON.stringify(data);
    const channelKey = `room:${roomId}`;
    await redis.publish(payload,channelKey);
}

export const publishSignallingEvents = async (serverId:string, data:PublishSignallingEvent)=>{
    const redis = await RedisClient.getInstance();
    const payload = JSON.stringify(data);
    const channelKey = `server:${serverId}`;
    await redis.publish(payload,channelKey);
}

export const publishPlayerFar = async (currUserSocketId:string, currUserId:string, recieverSocketId:string, )=>{
    const serverId = await getPlayerServerId(recieverSocketId);
    if(serverId){
    const redis = await RedisClient.getInstance();
    const payload = JSON.stringify({ to:recieverSocketId, playerId:currUserId, socketId:currUserSocketId});
    const channelKey = `server:player-far:${serverId}`;
    await redis.publish(payload,channelKey);
    console.log("published far")
    }
    else{
        console.log("Ignoring the Player-Far event, Server not found" , serverId,"current user",currUserId, "reciever",recieverSocketId);
    }
    
}