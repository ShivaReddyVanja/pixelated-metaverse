import Router from "express";
import { PrismaClient } from "@prisma/client";
import adminRouter from "./admin";
import spaceRouter from "./space";
import userRouter from "./user";
import { mapSchema } from "../validation/mapSchema";

const router = Router();
const prisma = new PrismaClient();
const jwt_secret = process.env.JWT_SECRET;

if (!jwt_secret) {
  throw new Error("JWT_SECRET not found in environment variables");
}

router.get("/maps", async (req, res) => {
  try {
    const maps = await prisma.map.findMany({
      select: {
        id: true,
        name: true,
        thumbnail: true,
        width: true,
        height: true,
      },
    });
    res.status(200).json({ maps });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
});

router.get("/map/collisions/:id", async (req, res) => {
  const mapId = req.params.id;
  try {
    const map = await prisma.map.findUnique({
      where: {
        id: mapId,
      },
      select: {
        data: true,
      },
    });
    if (!map) {
      res.status(404).send("Invalid map id");
      return;
    }

    const parsedMap = mapSchema.parse(map.data);
    const collisionLayer = parsedMap.layers.find(layer =>
      layer.name == "top_layer"
    );

    if (!collisionLayer ) {
      res.status(404).json({message:"No collisions layer found in the map",data:parsedMap.layers});
      return;
    }

    res.status(200).json({ data: collisionLayer });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
});

router.use("/user", userRouter);
router.use("/space", spaceRouter);
router.use("/admin", adminRouter);

export default router;