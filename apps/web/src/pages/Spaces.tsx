
import { useEffect, useState } from "react";
import { useSpaces } from "@/hooks/useSpaces";
import { PlusIcon } from "lucide-react";
import SpaceCard from "@/components/SpaceCard";
import CreateSpaceModal from "@/components/CreateSpaceModal";
import useUserStore from "./../../store/userStore";
import { api } from "@/utils/api";

export default function Spaces() {
  const { spaces, isLoading, error } = useSpaces();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const {setUser,getUser} =useUserStore();
  useEffect(()=>{
   const fetchUser = async ()=>{
      try{
        const res:any = await api.post("/user/me");
        const creatorId = res.data;
        setUser({id:creatorId})
      }
      catch(error){
        console.error(error);
      }
    }
    fetchUser()
  },[getUser()])
 
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Spaces</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
        >
          <PlusIcon className="mr-2 h-5 w-5" /> Create Space
        </button>
      </div>

      {spaces.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">You haven't created any spaces yet.</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
          >
            Create Your First Space
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spaces.map((space) => (
            <SpaceCard key={space.id} space={space} />
          ))}
        </div>
      )}

      <CreateSpaceModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  );
}
