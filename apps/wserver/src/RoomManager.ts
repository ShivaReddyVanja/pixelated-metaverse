import Room from "./RedisRoom";
import crypto from "crypto";

export class RoomManager {

    static instance :RoomManager
    static serverId = crypto.randomUUID(); //unique serverId per server
    rooms:Map<string,Room> //Map roomId to room object
    
    private constructor(){
        this.rooms = new Map()
    }

    static getInstance(){
        if(!this.instance){
            this.instance= new RoomManager()
        }
        return this.instance
    }

    getRoom(roomId:string){
        if(this.rooms.get(roomId)){
            return this.rooms.get(roomId);
        }
        const newRoom = new Room(roomId);
        this.rooms.set(roomId,newRoom);
        return this.rooms.get(roomId);
    }
    getAllRooms(){
        return this.rooms;
    }
}