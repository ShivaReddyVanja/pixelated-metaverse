//this handles all the incoming messages
export const handleWsData = (data:any)=>{
    const event = data.event;
    switch(event){
        case "create":
            handleCreate(data)
            break;
        case "join":
            break;
        case "move":
            break;
        case "leave":
            break;
    }

}
const createMessageHandler =(data:any)=>{
    const status = data.status;
    if(status=="error"){
    
    return;
    }

}