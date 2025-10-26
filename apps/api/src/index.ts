import express from "express";
import dotenv from "dotenv";
import router from "./routes";
import cors from "cors";
import http from "http";


// Load environment variables
dotenv.config();
const jwt_secret = process.env.JWT_SECRET;
if (!jwt_secret) {
  throw new Error("JWT_SECRET not found in environment variables");
}

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cors());

const port = process.env.PORT || 3000;

app.use("/api", router);

app.get("/", (req, res) => {
  res.json({ message: "hello from server" });
});

server.listen(port, () => {
  console.log(`Web server is running on port ${port}`);
});