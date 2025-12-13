"use client"
import { api } from '@/services/api';
import { SocketConnectionData } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';


// You can create a reusable ArrowLeft icon component or use a library
const ArrowLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m12 19-7-7 7-7"/>
    <path d="M19 12H5"/>
  </svg>
);

export default function CreateRoomPage() {

  const [name,setName] = useState("");
  const [connectionData,setConnectionData] = useState<SocketConnectionData | null>(null);
  const router = useRouter();


  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try{
      const response = await api.post("/create-room", { name })
      const data = response.data
      setConnectionData(data);

      localStorage.setItem("connectionInfo", JSON.stringify({
        userId: data.userId,
        roomId: data.roomId,
        socket: data.socket,
        token: data.token
      }))
      
     console.log(data)

     router.push(`/meet?id=${data.roomId}`)

    }
    catch(e:any){
       console.error(e.message)
    }
    
  };

  return (
    <div className="bg-slate-900 text-white min-h-screen flex flex-col">
      <header className="container mx-auto px-6 lg:px-8 py-4">
        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
          PixelMeet
        </Link>
      </header>

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-lg shadow-pink-500/10">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Create a meeting</h1>
            <p className="text-slate-400 mb-8">Enter your name to get started.</p>
          </div>

          <form onSubmit={handleFormSubmit}>
            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={(e)=>setName(e.target.value)}
                required
                placeholder="e.g., Alex Doe"
                className="w-full px-4 py-3 bg-slate-700 text-white border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition duration-200"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 duration-300"
            >
              Start Meet
            </button>
          </form>

          <div className="text-center mt-6">
             <Link href="/" className="text-sm text-slate-400 hover:text-pink-400 transition duration-200 inline-flex items-center gap-2">
                <ArrowLeftIcon className="h-4 w-4" />
                Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}