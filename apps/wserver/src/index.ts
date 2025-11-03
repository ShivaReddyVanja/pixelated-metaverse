import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from "./types/events";
import { RoomManager } from "./RoomManager";
import { handleCreate } from "./handlers/handleCreate";
import { handleJoin } from "./handlers/handleJoin";
import { handleLeave } from "./handlers/handleLeave";
import { handleMove } from "./handlers/handleMove";
import cookie from 'cookie'; 
import {JwtTokenPayload} from "@myapp/types"

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET!;
const httpServer = createServer();

// Create Socket.IO server with types
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
  cors: {
    origin: "*", // Configure appropriately for production
    methods: ["GET", "POST"]
  }
});

// Authentication middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token; 
      if (!token) {
      return next(new Error("Authentication error: No token in cookies"));
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.data.user = decoded as JwtTokenPayload;
    next();
  } catch (err) {
    console.error("Socket auth failed:", err);
    next(new Error("Authentication error: Invalid token"));
  }
});

// Connection handler
io.on("connection", (socket) => {
  console.log(`User connected: `,socket.data);

  // Room creation
  socket.on("room:create", (data, callback) => {
    console.log("data to create a room",data.spaceId)
    handleCreate(io, socket, data, callback);
  });

  // Room join
  socket.on("room:join", (data, callback) => {
    handleJoin(io, socket, data, callback);
  });

  // Player movement
  socket.on("player:move", (data, callback) => {
    console.log("player moved",data)
    handleMove(io, socket, data, callback);
  });

  // Room leave
  socket.on("room:leave", (data) => {
    handleLeave(io, socket, data);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.data}`);
    
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
