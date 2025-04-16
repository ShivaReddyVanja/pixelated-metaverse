export type EventType = "create" | "join" | "move" | "leave";

export type IncomingEvent = |{ event:"create",}

export type CreatePayload = {name:string,width:number,height:number,spaceId:string,creatorId:string,objectsArray:number[]};

export type JoinPayload = {spaceId:string};

export type MovePayload = {spaceId:string,x:number,y:number};

export type LeavePayload = {spaceId:string};