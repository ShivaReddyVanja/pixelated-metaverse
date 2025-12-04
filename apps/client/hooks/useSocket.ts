//hooks/useSocketIO.ts

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getMapCollisionData } from '@/utils/getMapData';
// import { getMapData } from '@/utils/getMapDataObjects';
import { CreateRoomEvent } from '@/types/events';
import { handleCreated, handleJoined, handleLeft, handleMoved } from '@/services/socketHandlers';
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
      webrtcManager.initLocalMedia(true, false);
    });

    socket.on('disconnect', (reason) => {
      console.log(`Socket.IO disconnected: ${reason}`);
      setIsConnected(false);
      // Logic for displaying disconnection or managing state goes here
    });


    // When the room is created (for the user who created it)
    socket.on("room:created", (data: { roomId: string; spawn: { x: number; y: number }, playerId: string }) => {
      handleCreated(data)
    });

    socket.on("room:joined", (data: { playerId: string; spawn: { x: number; y: number }, players: any }) => {
      handleJoined(data)
    });

    // When a player leaves
    socket.on("player:left", (data: { playerId: string }) => {
      // e.g., remove player from your map/game state
      handleLeft(data)
    });

    socket.on(
      "player:moved",
      (data: { playerId: string; position: { x: number; y: number } }) => {
        handleMoved(data);
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
      // Handle UI error display
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