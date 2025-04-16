import express from "express";
import dotenv from "dotenv"
import router from "./routes";
import cors from "cors";

//loading the environment variables
dotenv.config()

const app = express();
app.use(express.json())
app.use(cors())
const port = process.env.PORT || 5000

app.use("/api",router)


app.get("/",(req,res)=>{
    res.json({"message":"hello from web server sfffdfff"})  
})

app.listen(port, ()=>{
    console.log(`web server is running on ${port}`)
})