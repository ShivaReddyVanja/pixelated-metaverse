import { connectWebSocketServer, getSocket } from './utils/websocket';
import useUserStore from './../store/userStore';
import { createRoom, joinRoom } from './utils/sendMessages';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleUser } from '@fortawesome/free-solid-svg-icons';
import Spinner from './components/Spinner';

const JoinOrCreate = () => {

    const { socket, socketOpen } = getSocket();
    const { getUser } = useUserStore();
    const location = useLocation();
    const {roomid} =useParams();
    const navigate = useNavigate();
    const spaceId = location.state?.spaceId;
    const userId = getUser()?.id;
    const name = "Janaki rama"
    const [roomName,setRoomName] = useState('');
    const [loading,setLoading] =useState(false)
    const [action,setAction]= useState<'create'|'join'>('create')

    const handleClick=()=>{
     if(action == 'create' && userId){
        createRoom(userId,roomName,spaceId)
     }
     else if(action =='join' && roomid){
        joinRoom(roomid)
     }
     else{
        console.log("Unknown action")
     }

    }

    useEffect(() => {
        // 1. Ensure userId is available
        if (!userId) {
          console.log("⏳ Waiting for userId...");
          navigate("/");
          return;
        }
      
        // 2. Connect socket if not open
        if (!socketOpen) {
          connectWebSocketServer();
          return; 
        }
      
        // 3. Handle room creation or joining
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
      }, [socketOpen, userId, spaceId, roomid, name, navigate]);
      

    return (
        <div>
        <div className="flex flex-col items-center justify-center h-screen ">
        <div className="bg-white p-6 rounded-xl   shadow-2xl min-w-2xs min-h-40 flex items-center justify-center">

        {loading?<Spinner/>:
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