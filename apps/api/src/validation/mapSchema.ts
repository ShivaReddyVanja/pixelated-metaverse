import { object, unknown, z } from "zod";

const layerSchema = z.object({
  data: z.array(z.number()).optional(),
  height: z.number().optional(),
  id: z.number(),
  name: z.string(),
  opacity: z.number(),
  type: z.string(),
  visible: z.boolean(),
  width: z.number().optional(),
  x: z.number(),
  y: z.number(),
  draworder: z.string().optional(),
  objects: z.array(
    z.object({
      height: z.number(),
      id: z.number(),
      name: z.string(),
      rotation: z.number(),
      type: z.string(),
      visible: z.boolean(),
      collides: z.boolean().optional(),
      width: z.number(),
      x: z.number(),
      y: z.number(),
    })
  ).optional(),
});

const tilesetSchema = z.object({
  columns: z.number(),
  firstgid: z.number(),
  image: z.string(),
  imageheight: z.number(),
  imagewidth: z.number(),
  margin: z.number(),
  name: z.string(),
  spacing: z.number(),
  tilecount: z.number(),
  tileheight: z.number(),
  tilewidth: z.number(),
});

const mapSchema = z.object({
  compressionlevel: z.number(),
  height: z.number(),
  infinite: z.boolean(),
  layers: z.array(layerSchema),
  nextlayerid: z.number(),
  nextobjectid: z.number(),
  orientation: z.string(),
  renderorder: z.string(),
  tiledversion: z.string(),
  tileheight: z.number(),
  tilesets: z.array(tilesetSchema),
  tilewidth: z.number(),
  type: z.string(),
  version: z.string(),
  width: z.number(),
}).passthrough();

export { mapSchema };
