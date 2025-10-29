import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { getSocketInstance } from "../services/getSocketInstance";
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import { JwtTokenPayload } from "@myapp/types"
import { getRedisClient } from "../services/redis";

const app = Router();
dotenv.config();

const jwt_secret: string = process.env.JWT_SECRET!;

app.post("/create-room", async (req, res) => {
    const redisClient = await getRedisClient();
    if (!jwt_secret) {
        res.status(500).json({ error: "Internal server error" });
        console.error("Missing jwt secret")
        return
    }
    const { name = "Noobmaster" } = req.body;
    const roomId = uuidv4();
    const userId = uuidv4();
    const socketInstance = getSocketInstance();

    const payload: JwtTokenPayload = {
        userId,
        roomId,
        name
    }

    // Generate JWT token (expires in 2 hours)
    const token = jwt.sign(payload, jwt_secret, { expiresIn: "2h" });

    const result = await redisClient.set(roomId, socketInstance, {
        expiration: {
            type: 'EX', value: 7200
        }
    })

    console.log("Key is stored in redis", await redisClient.get(roomId));

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

        const payload: JwtTokenPayload = {
            userId,
            roomId,
            name
        }
        // Generate JWT token (expires in 2 hours)
        const token = jwt.sign(payload, jwt_secret, { expiresIn: "2h" });

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
