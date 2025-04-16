
import Router from "express";
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { userSigninSchema, userSignupSchema } from "../validation/validationSchema";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { authenticate } from "../middlewares/authenticateUser";
import { customRequest } from "../types/custom";

const userRouter = Router();
const prisma = new PrismaClient();
const jwt_secret = process.env.JWT_SECRET;

if (!jwt_secret) {
  throw new Error("JWT_SECRET not found in environment variables");
}


userRouter.post("/me",authenticate, async (req: customRequest, res: Response): Promise<void> => {
  const userId = req.userId;
   res.status(200).json(userId);
})

userRouter.post("/signup", async (req: Request, res: Response): Promise<void> => {
    const parsedData = userSignupSchema.safeParse(req.body);
    if (!parsedData.success) {
      res.status(400).json("data validation failed");
      return;
    }
  
    try {
      const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);
      await prisma.user.create({
        data: {
          username: parsedData.data.username,
          email: parsedData.data.email,
          password: hashedPassword,
        },
      });
  
      res.status(201).json({ message: "User created successfully, please login!" });
    } catch (error) {
      // prisma unique constraint errors
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          res.status(409).json({ message: "Username or email already exists" });
          return;
        }
      }
  
      res.status(500).json({ message: "Internal server error" });
    }
  });


userRouter.post("/signin", async (req, res) => {
    const parsedData = userSigninSchema.safeParse(req.body);
  
    if (!parsedData.success) {
      res.status(400).json("Data validation failed");
      return;
    }
    try {
      const user = await prisma.user.findUnique({
        where: {
          username: parsedData.data.username,
        },
      });
  
      if (!user) {
        res.status(404).json({ message: "Username or email does not exist" });
        return;
      }
      const isValid = await bcrypt.compare(parsedData.data.password, user.password);
  
      if (!isValid) {
        res.status(401).json("Invalid password");
        return;
      }
      const jwt_token = jwt.sign(
        {
          userId: user.id,
          role: user.role,
        },
        jwt_secret
      );
  
      res.status(200).json({ message: "Login successful", jwt_token });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        res.status(409).json({ message: error.message, code: error.code });
        return;
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
 export default userRouter;