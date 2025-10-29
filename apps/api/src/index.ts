import express from "express";
import dotenv from "dotenv";
import router from "./routes";
import cors from "cors";
import http from "http";
import { createClient } from "redis";


// Load environment variables
dotenv.config();
const jwt_secret = process.env.JWT_SECRET;
if (!jwt_secret) {
  throw new Error("JWT_SECRET not found in environment variables");
}

const app = express();

app.use(express.json());
app.use(cors());

const port = process.env.PORT || 3000;

const redisClient = createClient({
  url: 'redis://localhost:6379'
});

// Connect to Redis
redisClient.connect().catch(console.error);

// Handle Redis errors
redisClient.on('error', (err) => {
  console.log('Redis error:', err);
});

app.use("/api", router);

app.get("/", (req, res) => {
  res.json({ message: "hello from server" });
});

app.listen(port, () => {
  console.log(`Web server is running on port ${port}`);
});