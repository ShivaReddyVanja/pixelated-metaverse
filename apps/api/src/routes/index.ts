import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { getSocketInstance } from "../services/getSocketInstance";
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import {JwtTokenPayload} from "@myapp/types"

const app = Router();
dotenv.config();

const jwt_secret: string = process.env.JWT_SECRET!;

app.post("/create-room", async (req, res) => {

    if (!jwt_secret) {
        res.status(500).json({ error: "Internal server error" });
        console.error("Missing jwt secret")
        return
    }
    const {name = "Noobmaster"} = req.body;
    console.log(req.body)
    const roomId = uuidv4();
    const userId = uuidv4();
    const socketInstance = getSocketInstance();
    const payload:JwtTokenPayload = {
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
        socket: socketInstance
    })

})

export default app;
