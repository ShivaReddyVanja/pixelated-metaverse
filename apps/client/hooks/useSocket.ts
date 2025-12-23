//hooks/useSocketIO.ts

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getMapCollisionData } from '@/utils/getMapData';
// import { getMapData } from '@/utils/getMapDataObjects';
import { CreateRoomEvent, PlayerJoined, PlayerLeft, PlayerMoved, RoomCreated, RoomJoined } from '@/types/events';
import { roomCreated, roomJoined,newPlayerJoined, playerLeft, playerMoved } from '@/services/socketHandlers';
import { WebRTCManager } from '@/lib/WebRtcManager';

// Define the expected structure for connection info from your API
interface ConnectionInfo {
  userId: string;
  roomId: string;
  socket: string;
  token: string;
}

// Define the state structure for incoming data (optional, but good for typing)
interface SocketEvent {
  name: string;
  data: any;
}

export function useSocketIO(connectionInfo: ConnectionInfo) {

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const mapData = getMapCollisionData();
  // const mapData = getMapData()

  const roomCreationData: CreateRoomEvent = (
    {
      name: "Dwayne",
      width: mapData.mapWidth,
      height: mapData.mapHeight,
      objectsArray: mapData.blockedTileIndices,
      creatorId: connectionInfo.userId,
      spaceId: connectionInfo.roomId
    }
  );

  useEffect(() => {
    if (!connectionInfo || !connectionInfo.socket) {
      return;
    }

    // 1. Initialize the Socket.IO client
    const socket = io(connectionInfo.socket, {
      auth: {
        token: connectionInfo.token
      },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    });


    const webrtcManager = new WebRTCManager(socket);
    socketRef.current = socket;

    // 2. Set up event listeners

    socket.on('connect', () => {
      console.log("Socket.IO connected successfully!");
      setIsConnected(true);
      socket.emit('room:create', roomCreationData);
    });

    socket.on('disconnect', (reason) => {
      console.log(`Socket.IO disconnected: ${reason}`);
      setIsConnected(false);
    });

    // room:created and room:joined are self recieved events
    socket.on("room:created", (data: RoomCreated) => {
      roomCreated(data)
    });
    
    socket.on("room:joined", (data: RoomJoined) => {
      console.log("Room Join data", data)
      roomJoined(data)
    });

    //event handlers for all others 
    socket.on("player:joined", (data: PlayerJoined) => {
      newPlayerJoined(data)
    });

    socket.on("player:left", (data: PlayerLeft) => {
      playerLeft(data)
    });

    socket.on("player:moved",(data: PlayerMoved) => {
      playerMoved(data);
    }
    );

    socket.on("player-near", async ({ playerId, socketId }: { playerId: string, socketId: string }) => {
      await webrtcManager.callPeer({ playerId, socketId }, connectionInfo.userId);
    });

    socket.on("player-far", ({ playerId, socketId }: { playerId: string, socketId: string }) => {
      webrtcManager.closePeer(socketId);
    });

    socket.on('connect_error', (err) => {
      console.error("Socket.IO Connection Error:", err.message);
    });

    // 3. Cleanup function: Disconnect the socket when the component unmounts
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };

  }, []);

  // Return the connection status, the latest received event, and the function to send events
  return { isConnected, socketRef };
}