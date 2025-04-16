interface mapData{
    name: string,
    width:number,
    height:number,
    spaceId:string,
    creatorId:string,
    objectsArray:number[]
}
interface playerData{
    x:number,
    y:number
}
export class Room {
    roomid :string
    name: string
    width: number
    height:number
    gridSize :number
    creatorId : string
    players: Map<string, {x:number ,y:number}>= new Map()
    filledPositions :Set<string> = new Set();
    activeClients:Map<string,WebSocket> = new Map(); //map userId to connection object
    
    constructor(data:mapData){
        this.name = data.name,
        this.width = data.width,
        this.height = data.height,
        this.roomid = data.spaceId
        this.creatorId = data.creatorId
        this.gridSize = this.width * this.height
        this.players.set(this.creatorId,{x:0,y:0})
        this.fillObjectPositions(data.objectsArray)
    }
    
    fillObjectPositions(objectsArray:number[]){
        objectsArray.forEach((item)=>{
            const x = item % this.width
            const y = Math.floor(item / this.width)
            const posKey = `${x},${y}`
            this.filledPositions.add(posKey)
        })
    }
    
    addUser(userId:string){
        const emptyPos = this.getEmptyPosition() 
    }

    removeUser(userId:string){
        const removed = this.players.delete(userId)
        return removed
    }
    
    checkMove(x:number,y:number,newX:number,newY:number){

        if(Math.abs(x-newX)==1 && y-newY==0 ||x-newX==0 && Math.abs(y-newY)==1  ){
            return true
        }
        return false
    }

    getEmptyPosition(){
        for(let x = 0; x< this.width; x++){
            for(let y=0;y<this.height; y++){
                const posKey = `${x},${y}`
                if(!this.filledPositions.has(posKey)){
                    return {x,y}
                }
            }
        }
    }

    broadcastMessage(message:string){
        this.activeClients.forEach((client)=>{
            client.send(message)
        })
    }
}