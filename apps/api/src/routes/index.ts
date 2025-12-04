import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { getSocketInstance } from "../services/getSocketInstance";
import dotenv from "dotenv"
import { JwtTokenPayload } from "@myapp/types"
import { getRedisClient } from "../services/redis";

const app = Router();
dotenv.config();
import { createToken } from "@shared/jwt";

app.post("/create-room", async (req, res) => {
    const redisClient = await getRedisClient();
    const { name = "Noobmaster" } = req.body;
    const roomId = uuidv4();
    const userId = uuidv4();
    const socketInstance = getSocketInstance();
    const payload: Partial<JwtTokenPayload> = {
        userId,
        roomId,
        name
    }
    // Generate JWT token (expires in 2 hours)
    const token = await createToken(payload, "24h");
    const result = await redisClient.set(roomId, socketInstance, {
        expiration: {
            type: 'EX', value: 7200
        }
    })

    res.json({
        userId,
        roomId,
        token,
        socket: socketInstance
    })
})

app.post("/join", async (req, res) => {

    const { roomId, name = "Noobmaster" } = req.body;
    if (!roomId) {
        res.status(404).json({ message: "Roomid not found in the request" });
        return;
    }
    try {
        const redisClient = await getRedisClient();
        const socketUrl = await redisClient.get(roomId);
        if (!socketUrl) {
            res.status(404).json({ message: "Room Not found" });
        }

        const userId = uuidv4();
        const payload:Partial<JwtTokenPayload>= {
            userId,
            roomId,
            name
        }
        // Generate JWT token (expires in 2 hours)
        const token =await createToken(payload, "24h");
        res.json({
            userId,
            roomId,
            token,
            socket: socketUrl
        })
    } catch (error) {

    }
})

export default app;
