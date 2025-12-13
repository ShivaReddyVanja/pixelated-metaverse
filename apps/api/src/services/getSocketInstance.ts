
export const getSocketInstance = ()=>{

//current available socket instances, we will dynamic orchestrator based instance later
  const activeServers = ["wss://socket.augenpay.com"]
  return activeServers[0];
  
} 