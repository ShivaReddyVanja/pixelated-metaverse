import { WebSocket } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import { JWT_SECRET as jwt_secret } from "./config";
import { Room } from "./Room";
import { RoomManager } from "./RoomManager";
import { handleCreate } from "./handlers/handleCreate";
import { handleJoin } from "./handlers/handleJoin";
import { handleLeave } from "./handlers/handleLeave";
import { handleMove } from "./handlers/handleMove";

export class User {
    public id: string;
    public x: number;
    public y: number;
    public ws: WebSocket;
    public roomId:string;

    constructor(ws: WebSocket) {
        this.x = 0,
        this.y = 0,
        this.ws = ws;
        this.id = "";
        this.roomId=""
        this.initialiser()
    }
    
    initialiser() {
        this.ws.on("message", (data) => {
            try {

                const parsedData = JSON.parse(data.toString());
                const decrypted = jwt.verify(parsedData.token, jwt_secret) as JwtPayload
                this.id = decrypted.userId;
                let room;
                switch (parsedData.event) {
                    case "create":
                        handleCreate(this,parsedData)
                        break;
                    case "join":
                        handleJoin(this,parsedData)
                        break;
                    case "move":
                        handleMove(this,parsedData)
                        break;
                    case "leave":
                        handleLeave(this,parsedData)
                        break;
                       }
                    }
            catch(e){
                console.error(e)
            }

        }
    )
    this.ws.on("close",()=>{
       const room =  RoomManager.getInstance().getRoom(this.roomId);
       if(!room){
        this.sendMessageorError("error","No such room exists")
        return
       }
       room.removeUser(this.id)
       room.broadcastMessage(JSON.stringify({
        status:"left",
        playerId:this.id
       }))

    })

    }
    getRoomOrError(spaceId: string): Room | null {
        const room = RoomManager.getInstance().getRoom(spaceId);
        if (!room) {
            this.ws.send(JSON.stringify({ status: "error", message: "Room not found" }));
            return null;
        }
        return room;
    }
    sendMessageorError(status: string, message: string) {
        this.ws.send(JSON.stringify({ status, message }));
    }
}