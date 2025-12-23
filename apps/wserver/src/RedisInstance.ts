import { GlideClient, GlideClientConfiguration, JsonBatch } from "@valkey/valkey-glide";
import { RoomManager } from "./RoomManager";
import { PublishEvents, PublishSignallingEvent } from "./types";
import { handlers } from "./redisHandlers/eventHandlers";
import { io } from "./index"
class RedisClient {
    static instance: GlideClient;
    private static initializing: Promise<GlideClient> | null = null;

    public static async getInstance() {
        if (this.instance) {
            return this.instance;
        }
        if (!this.initializing) {
            const addresses = [
                {
                    host: "localhost",
                    port: 6379,
                },
            ];
            this.initializing = GlideClient.createClient({
                addresses: addresses,
                //useTLS: true,
                requestTimeout: 500, // 500ms timeout
                clientName: "pubsub_client",
                pubsubSubscriptions: {
                    channelsAndPatterns: {
                        [GlideClientConfiguration.PubSubChannelModes.Exact]: new Set([`server:${RoomManager.serverId}`]),
                        [GlideClientConfiguration.PubSubChannelModes.Pattern]: new Set(['room:*']),
                    },
                    callback: (msg) => {
        
                        const signalHandler = (msg:string)=>{
                            const payload = JSON.parse(msg) as PublishSignallingEvent;
                            io.to(payload.to).emit("webrtc-signaling", { from:payload.from, data });
                        }

                        const channelName = msg.channel as string;

                        if(channelName.startsWith("server")){
                            signalHandler(msg.message as string);
                            return;
                        }
                       
                        const roomId = msg.channel.slice(5) as string;
                        const managerInstance = RoomManager.getInstance();
                        const rooms = managerInstance.getAllRooms();
                        if (!rooms.has(roomId)) return;
                        const data = JSON.parse(msg.message as string) as PublishEvents;

                        // Use type narrowing for discriminated union
                        if (data.type === "move") {
                            handlers.move(io, roomId, data);
                        } else if (data.type === "join") {
                            handlers.join(io, roomId, data);
                        } else if (data.type === "leave") {
                            handlers.leave(io, roomId, data);
                        }



                    },
                },

            });
        }
        this.instance = await this.initializing;
        return this.instance
    }
}

export default RedisClient;