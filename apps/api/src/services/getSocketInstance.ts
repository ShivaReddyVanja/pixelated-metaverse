
export const getSocketInstance = ()=>{

//current available socket instances, we will dynamic orchestrator based instance later
  const activeServers = ["ws://192.168.1.6:5002"]
  return activeServers[0];

}