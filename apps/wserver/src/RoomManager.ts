import { Room } from "./Room"

export class RoomManager {

    static instance :RoomManager
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
        return this.rooms.get(roomId)
    }
    
    setRoom(roomId:string,room:Room){
        this.rooms.set(roomId,room);
        return this.rooms.get(roomId);
    }
}