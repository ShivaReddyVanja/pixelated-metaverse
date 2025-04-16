import { z } from "zod";
import Router from "express";
import dotenv from "dotenv";
import { mapUploadSchema } from "../validation/validationSchema";
import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

dotenv.config();

const prisma = new PrismaClient();
const adminRouter = Router();

adminRouter.post("/upload-map", async (req, res) => {
  const parsedData = mapUploadSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({ message: "Validation failed", error: parsedData.error });
    return;
  }
  try {
    await prisma.map.create({
      data: {
        name: parsedData.data.name,
        width: parsedData.data.width,
        height: parsedData.data.height,
        thumbnail: parsedData.data.thumbnail,
        data: parsedData.data.data,
      },
    });
    res.status(201).json({ message: "Map created successfully" });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      res.status(409).json({ message: "Prisma error: " + error.message, error: error.code });
      return;
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

export default adminRouter;