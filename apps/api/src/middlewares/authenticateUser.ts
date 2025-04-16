import dotenv from "dotenv"
import { Request,Response,NextFunction } from "express"
import jwt from "jsonwebtoken"
import { customRequest } from "../types/custom"

dotenv.config()
const jwt_secret = process.env.JWT_SECRET

if(!jwt_secret){
    throw new Error("JWT SECRET not found in environment variables")
}



const authenticate = async (req:customRequest,res:Response,next:NextFunction)=>{

const token = req.headers.authorization?.split(" ")[1];

if (!token) {
     res.status(401).json({ error: "Unauthorized" });
     return
  }
try{
    const user = jwt.verify(token,jwt_secret) as {userId: string, role:string};
    req.userId = user.userId;
    next()
}
catch(error){
  res.status(403).json({message:"invalid json web token "})
}

}
export {authenticate};

