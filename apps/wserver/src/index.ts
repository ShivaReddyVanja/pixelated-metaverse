import { createServer } from "http";
import WebSocket from "ws";
import dotenv from "dotenv";
import jwt from "jsonwebtoken"
import { Room } from "./Room";
dotenv.config();
import { User } from "./User";

const jwt_secret = process.env.JWT_SECRET

const wss = new WebSocket.Server({port:3001});

wss.on("connection",(ws:WebSocket)=>{
  console.log("new client connected");
  ws.send("You are now connected to the server");
  let user = new User(ws)

  ws.on("error",console.error);
  ws.on("close",()=>{

  })


})



