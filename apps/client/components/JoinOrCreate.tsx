import useUserStore from './../store/userStore';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleUser } from '@fortawesome/free-solid-svg-icons';
import Spinner from './components/Spinner';
import useSocket from './hooks/useSocket';
import { getMapData } from './utils/getMapData';
import { CreatePayload, CreateRoom, JoinPayload, JoinRoom } from './types/events';
import { useAuthToken } from './hooks/useAuthToken';
import { usePlayersStore } from './../store/playersStore';

const JoinOrCreate = () => {
  const { getUser } = useUserStore();
  const {setPlayerPosition,setPlayers,removePlayer} = usePlayersStore();
  const {getToken} = useAuthToken()
  const location = useLocation();
  const { roomid } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();

  const token = getToken();
  const spaceId = location.state?.spaceId;
  const userId = getUser()?.id;
  const name = "Janaki rama"
  const [roomName, setRoomName] = useState('');
  const [loading, setLoading] = useState(false)
  const [action, setAction] = useState<'create' | 'join'>('create')

  useEffect(()=>{

    if(!socket) return;

    const handleCreateRoom = (data:CreateRoom)=>{
    if(data.status=="success"){
        setPlayerPosition(data.playerId,data.position.x,data.position.y);
        console.log("naigating to server")
        navigate("/start")
    }
    else{
        console.log(data.message);
    }
   }

   const handleJoin = (data:JoinRoom)=>{
       if(data.status=="success"){
           setPlayerPosition(data.playerId,data.position.x,data.position.y);
       }
       else{
           console.log(data.message);
       }
   }

    socket.on("create",(data)=>{

      console.log(data);
     handleCreateRoom(data)
   
    })

    socket.on("join",(data)=>{
    handleJoin(data);
    navigate("/start")
    })

   return ()=>{
    socket.off("create")
    socket.off("join")
   }
  },[socket])

  const handleClick = () => {
    if (action == 'create' && userId) {
      createRoom(userId, roomName, spaceId)
    }
    else if (action == 'join' && roomid) {
      joinRoom(roomid)
    }
    else {
      console.log("Unknown action")
    }

  }
  const socketEmitter = (event: string, payload: any) => {
    if (!socket) return;
    socket.emit(event, payload);
  }

  const createRoom = (creatorId: string, name: string, spaceId: string) => {
    const { mapWidth, mapHeight, objectsArray } = getMapData();
    const payload: CreatePayload = {
      name,
      token,
      creatorId,
      width: mapWidth,
      height: mapHeight,
      spaceId,
      objectsArray
    };
    socketEmitter("create", payload);

  }

  const joinRoom = (spaceId: string) => {
    const payload: JoinPayload = {
      spaceId
    };
    socketEmitter("join", payload);
  }
  

  useEffect(() => {
    // 1. Ensure userId is available
    if (!userId) {
      console.log("⏳ Waiting for userId...");
      navigate("/");
      return;
    }
    // 2. Handle room creation or joining
    if (spaceId) {
      console.log("🚀 Creating the room");
      setAction('create')
    } else if (roomid) {
      console.log("🔗 Joining the room");
      setAction('join')
    } else {
      console.log("❌ Missing spaceId or roomid");
      navigate("/");
    }
  }, [userId, spaceId, roomid, name, navigate]);


  return (
    <div>
      <div className="flex flex-col items-center justify-center h-screen ">
        <div className="bg-white p-6 rounded-xl   shadow-2xl min-w-2xs min-h-40 flex items-center justify-center">

          {loading ? <Spinner /> :
            (
              <div className='space-y-2'>
                <FontAwesomeIcon icon={faCircleUser} className="text-gray-700 text-8xl text-center w-full" />
                <div className='space-y-4'>
                  <label className="block text-lg font-medium text-gray-700 ">Enter your name</label>
                  <input
                    onChange={(e) => setRoomName(e.target.value)}
                    value={roomName}
                    className=" w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button onClick={handleClick} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-xl transition">
                    Join
                  </button>
                </div>
              </div>
            )}
        </div>

      </div>

    </div>

  )

}
export default JoinOrCreate;