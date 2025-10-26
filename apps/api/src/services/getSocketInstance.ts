
export const getSocketInstance = ()=>{

//current available socket instances, we will dynamic orchestrator based instance later
  const activeServers = ["ws://localhost:5001"]
  return activeServers[0];

}