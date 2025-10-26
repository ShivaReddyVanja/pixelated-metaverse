import { useEffect, useState } from 'react';
import useSocket from '../hooks/useSocket';
import { handleCreateRoom, handleJoin, handleLeave, handleMove } from './socketHandlers';



const socketListener = () => {

  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    
    socket.on("connect", () => {
        console.log("connected to server");
    });
    
    socket.on("leave",(data)=>{
    handleLeave(data);
    })   

    socket.on("move",(data)=>{
    handleMove(data);
    })

    socket.on("disconnect", () => {
        console.log("disconnected from server");
    });

    socket.on("message", (message) => {
        console.log("message", message);
    });
    return()=>{
      socket.off("connect")
      socket.off("join")
      socket.off("move")
      socket.off("leave")
      socket.off("message")
      socket.off("disconnect")
    }

  },[socket])



}

export default socketListener;