import { response, Router } from "express";
import { createSpaceSchema } from "../validation/validationSchema";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middlewares/authenticateUser";
import { customRequest } from "../types/custom";

const spaceRouter = Router();
const prisma = new PrismaClient();

spaceRouter.post("/create", authenticate, async (req: customRequest, res) => {
  const userId = req.userId;
  if (!userId) {
    throw new Error("No user id received while creating space");
  }

  const parsedData = createSpaceSchema.safeParse(req.body);

  if (!parsedData.success) {
    res.status(400).json({ message: "Validation failed" });
    return;
  }
  try {
    const result = await prisma.$transaction(async (prisma) => {
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
        },
      });
      if (!user) {
        throw new Error("User does not exist");
      }
      const map = await prisma.map.findUnique({
        where: {
          id: parsedData.data.mapId,
        },
      });
      if (!map) {
        throw new Error("Map does not exist");
      }
      const space = await prisma.space.create({
        data: {
          name: parsedData.data.name,
          description: parsedData.data.description,
          width: map.width,
          height: map.height,
          thumbnail: map.thumbnail,
          userId: userId,
          mapId: map.id,
        },
      });
      res.status(201).json({ message: "Space created successfully", space: space });
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

spaceRouter.get("/", authenticate, async (req: customRequest, res) => {
  const userId = req.userId;
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        spaces: true,
      },
    });
    if (!user) {
      res.status(404).json({ message: "User does not exist" });
      return;
    }
    res.status(200).json({ spaces: user.spaces, length: user.spaces.length });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error });
  }
});

spaceRouter.post("/start", async (req, res) => {
  // Implementation pending
  res.status(501).json({ message: "Not implemented" });
});

export default spaceRouter;