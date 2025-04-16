import {useWebSocketStore} from "@/../store/websocketStore"
const ws_url = "ws://localhost:3001";

let socket: WebSocket | null = null;
let socketOpen:boolean = false;

const connectWebSocketServer = ()=> {

          if (socket && socket.readyState === WebSocket.OPEN) {
            console.log("🔁 WebSocket already connected");
            return;
          }

          socket = new WebSocket(ws_url);
        
          socket.onopen = () => {
            socketOpen = true;
            if(socket) {
              useWebSocketStore.getState().setSocket(socket)
            };
            console.log("✅ Connected to WebSocket server");
          };
        
          socket.onclose = () => {
            socketOpen = false;
            useWebSocketStore.getState().closeSocket();
            console.log("❌ WebSocket disconnected");
          };
        
          socket.onerror = (error) => {
            console.error("⚠️ WebSocket error:", error);
          };

          socket.onmessage = (message)=>{
            const data = JSON.stringify(message.data);
            handleWsData(data)

          }
        
    }
const getSocket = (): {socket:WebSocket|null,socketOpen:boolean}  => {
      return {
        socket,socketOpen
      }
    };
  


export const sendMessage = (event:string, payload:any)=>{

    const token = localStorage.getItem("token");
    if(!token){
        console.log("No Authorization Token found")
        return;
    }

    if(!socketOpen || !socket){
      console.log("Websocket is not available or not open")
      return
    }
    const message = {
            event,
            token,
            ...payload
        }
    socket.send(JSON.stringify(message));
    console.log(message)
  
}
export { connectWebSocketServer, getSocket };
