import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from "./types/events";
import { RoomManager } from "./RoomManager";
import { handleCreate } from "./handlers/handleCreate";
import { handleJoin } from "./handlers/handleJoin";
import { handleLeave } from "./handlers/handleLeave";
import { handleMove } from "./handlers/handleMove";

dotenv.config();

import { verifyToken } from "@shared/jwt";

const httpServer = createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200);
    res.end("OK");
  }
});

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
  socket.on("room:create", (data, callback) => {
    handleCreate(io, socket, data, callback);
  });

  // Room join
  socket.on("room:join", (data, callback) => {
    handleJoin(io, socket, data, callback);
  });

  // Player movement
  socket.on("player:move", (data, callback) => {
    handleMove(io, socket, data, callback);
  });

  // Room leave
  socket.on("room:leave", (data) => {
    handleLeave(io, socket, data);
  });

  socket.on("webrtc-signaling", ({ to, data }) => {
    if (!to) return;
    // Attach sender id so recipient knows who it's from
    io.to(to).emit("webrtc-signaling", { from: socket.id, data });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    if (socket.data.user.roomId) {
      const room = RoomManager.getInstance().getRoom(socket.data.user.roomId);
      if (room) {
        room.removeUser(socket.data.user.userId);
        // Broadcast to room that player left
        socket.to(socket.data.user.roomId).emit("player:left", {
          playerId: socket.data.user.userId
        });
      }
    }
  });
});

const PORT = process.env.PORT || 5002;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
