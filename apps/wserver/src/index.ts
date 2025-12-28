import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from "./types/events";
import { RoomManager } from "./RoomManager";
import { handleCreate } from "./handlers/handleCreate";
import { handleJoin } from "./handlers/handleJoin";
import { handleLeave } from "./handlers/handleLeave";
import { handleMove } from "./handlers/handleMove";
import RedisClient from "./RedisInstance";

dotenv.config();

import { verifyToken } from "@shared/jwt";
import { getPlayerServerId, removeUser } from "./redisHandlers/actions";
import { publishEvent, publishSignallingEvents } from "./redisHandlers/publishEvents";

const httpServer = createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200);
    res.end("OK");
  }
});

const setupServer = async () => {
  await RedisClient.getInstance();
  console.log("Redis client initialized");

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}



// Create Socket.IO server with types
export const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: No token in cookies"));
    }
    const decoded = await verifyToken(token);
    socket.data.user = decoded;
    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid token"));
  }
});

// Connection handler
io.on("connection", (socket) => {
  // Room creation
  socket.on("room:create", async (data, callback) => {
    handleCreate(io, socket, data, callback);
  });

  // Room join
  socket.on("room:join", async (data, callback) => {
    await handleJoin(io, socket, data, callback);
  });

  // Player movement
  socket.on("player:move", async (data, callback) => {
    await handleMove(io, socket, data, callback);
  });

  // Room leave
  socket.on("room:leave", async (data) => {
    await handleLeave(io, socket, data);
  });

  socket.on("webrtc-signaling", async ({ to, data }) => {
    if (!to) return;
    const serverId = await getPlayerServerId(to);
    if (serverId) {
      const from = socket.id;
      await publishSignallingEvents(serverId, { to, from, data });
    }
    else {
       console.log("Ignoring webrtc signalling", "recipient socket id is",to,"sender socket id is", socket.id)
    }
    
  });

  // Handle disconnection
  socket.on("disconnect", async () => {
    if (socket.data.user.roomId) {
      const roomId = socket.data.user.roomId;
      const userId = socket.data.user.userId;
      const room = RoomManager.getInstance().getRoom(roomId);

      if (room) {
        room.removePlayer(userId)
        await removeUser(room.roomid, userId, socket.id);
        // Use pub/sub pattern to notify all servers
        await publishEvent(roomId, {
          type: "leave" as const,
          userId,
          socketId:socket.id
        });
      }
    }
  });
});

const PORT = process.env.PORT || 5002;

// Only start server if not running in test environment
if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
  setupServer().catch((err) => {
    console.error("Server startup failed:", err);
    process.exit(1);
  });
}

// // Export for testing
// export { setupServer };
