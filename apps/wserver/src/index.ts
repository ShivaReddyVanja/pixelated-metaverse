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
import { removeUser } from "./redisHandlers/redisActions";

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
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
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

  socket.on("webrtc-signaling", ({ to, data }) => {
    if (!to) return;
    // Attach sender id so recipient knows who it's from
    io.to(to).emit("webrtc-signaling", { from: socket.id, data });
  });

  // Handle disconnection
  socket.on("disconnect", async () => {
    if (socket.data.user.roomId) {
      const room = RoomManager.getInstance().getRoom(socket.data.user.roomId);
      if (room) {
        await removeUser(room.roomid,socket.data.user.userId);
        // Broadcast to room that player left
        socket.to(socket.data.user.roomId).emit("player:left", {
          playerId: socket.data.user.userId
        });
      }
    }
  });
});

const PORT = process.env.PORT || 5002;

setupServer().catch((err) => {
  console.error("Server startup failed:", err);
  process.exit(1);
});
