import RedisClient from "../RedisInstance"
import { RoomManager } from "../RoomManager";
import { PublishEvents,PublishSignallingEvent} from "../types"

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
    console.log("published proximity",payload);
}
