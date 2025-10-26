// stores/webSocketStore.ts
import { create } from 'zustand';
import { io, Socket } from "socket.io-client";

type WebSocketStore = {
  socket: WebSocket | null;
  setSocket: (socket: WebSocket) => void;
  closeSocket: () => void;
};

type socketState= {
  socket: Socket|null
  roomId: string|null,
  userId: string|null,
  connect:(socketUrl:string)=>void,
  rejoinRoom:()=>void,
  disconnect: ()=>void
}

export const useSocketStore = create<socketState>((set,get)=>({
socket:null,
roomId:null,
userId:null,
connect: (socketUrl)=>{
  
  if (get().socket) return;
  const saved = JSON.parse(localStorage.getItem("chatSession") || "{}");
  const url = saved.socket || socketUrl;
  const socket = io(url, { autoConnect: true, withCredentials: true });

  socket.on("connect", () => {
      console.log("✅ Connected to socket", socket.id);
      const { roomId, userId } = saved;
      if (roomId && userId) {
        socket.emit("join_room", { roomId, userId });
      }
    });

  socket.on("disconnect", (reason) => {
      console.log("❌ Disconnected:", reason);
    });
},
rejoinRoom:()=>{

},
disconnect:()=>{

}

}))
