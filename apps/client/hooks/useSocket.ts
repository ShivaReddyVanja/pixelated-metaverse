//hooks/useSocketIO.ts

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getMapData } from '@/utils/getMapData';
import { CreateRoomEvent } from '@/types/events';
import { handleJoined, handleMoved } from '@/services/socketHandlers';

// Define the expected structure for connection info from your API
interface ConnectionInfo {
  userId: string;
  roomId: string;
  socket: string;
  token:string; 
}

// Define the state structure for incoming data (optional, but good for typing)
interface SocketEvent {
    name: string;
    data: any;
}

export function useSocketIO(connectionInfo: ConnectionInfo ) {

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  console.log("is connected",isConnected)
  const mapData = getMapData();

  const roomCreationData:CreateRoomEvent = (
    {
    name:"Dwayne",
    width:mapData.mapWidth,
    height:mapData.mapHeight,
    objectsArray:mapData.objectsArray,
    creatorId:connectionInfo.userId,
    spaceId:connectionInfo.roomId
  }
  );

  useEffect(() => {
    if (!connectionInfo || !connectionInfo.socket) {
      return;
    }
    console.log("Im creating the socket,get ready",connectionInfo)
    // 1. Initialize the Socket.IO client
    const socket = io(connectionInfo.socket, {
        auth:{
          token: connectionInfo.token
        },
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling']
    });
    
    socketRef.current = socket;

    // 2. Set up event listeners
    
    socket.on('connect', () => {
      console.log("Socket.IO connected successfully!");
      setIsConnected(true);
      
      socket.emit('room:create',roomCreationData);

    });

    socket.on('disconnect', (reason) => {
      console.log(`Socket.IO disconnected: ${reason}`);
      setIsConnected(false);
      // Logic for displaying disconnection or managing state goes here
    });


    // When the room is created (for the user who created it)
    socket.on("room:created", (data: { roomId: string; spawn: { x: number; y: number } }) => {
      console.log("Room created:", data.roomId, "Spawn:", data.spawn);
      // e.g., initialize player at spawn position
    });

    socket.on("room:joined", (data: { playerId: string; spawn: { x: number; y: number },players:any }) => {
      console.log("Player joined:", data.playerId, "Spawn:", data.spawn);
      handleJoined(data)
    });

    // When a player leaves
    socket.on("player:left", (data: { playerId: string }) => {
      console.log("Player left:", data.playerId);
      // e.g., remove player from your map/game state
    });

    socket.on(
      "player:moved",
      (data: { playerId: string; position: { x: number; y: number } }) => {
        console.log("Player moved:", data.playerId, "New position:", data.position);
        handleMoved(data);
      }
    );

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
  return { isConnected ,socketRef};
}