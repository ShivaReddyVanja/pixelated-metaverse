import { GlideClient, GlideClusterClient, Logger } from "@valkey/valkey-glide";

class RedisClient {
    static instance : GlideClient;
    private static initializing: Promise<GlideClient>|null = null;

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
            });
        }
        this.instance = await this.initializing;
        return this.instance
    } 
}

export default RedisClient;