
export const getSocketInstance = ()=>{

//current available socket instances, we will dynamic orchestrator based instance later
  const activeServers = ["ws://localhost:5002"]
  return activeServers[0];
  
} 