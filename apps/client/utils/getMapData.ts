import megacity from '@/public/clean.json';

// --- Tiled Map Type Definitions (Using your provided types) ---

interface TiledPoint {
    x: number;
    y: number;
}

interface TiledCollisionObject {
    id: number;
    name: string;
    type: string;
    x: number; // Pixel coordinate of the object's top-left anchor
    y: number; // Pixel coordinate of the object's top-left anchor
    width: number; // Pixel width
    height: number; // Pixel height
    rotation: number;
    ellipse?: boolean;
    polygon?: TiledPoint[];
    polyline?: TiledPoint[];
}

interface TiledObjectLayer {
    name: 'collisions';
    type: 'objectgroup';
    objects: TiledCollisionObject[];
}

interface TiledTileLayer {
    name: string;
    type: 'tilelayer';
    data: number[];
}

interface TiledMapData {
    width: number; // Map width in tiles
    height: number; // Map height in tiles
    tilewidth: number; // Tile pixel width
    tileheight: number; // Tile pixel height
    layers: (TiledTileLayer | TiledObjectLayer)[];
}

interface MapCollisionResult {
    mapWidth: number;
    mapHeight: number;
    blockedTileIndices: number[];
}

// Use a type assertion for megacity since it's imported dynamically
const mapData = megacity as TiledMapData;

// Define the assumed tile size from the Tiled map settings.
const TILE_SIZE: number = mapData.tilewidth || 16;

/**
 * Converts a tile coordinate (X, Y) into a single-dimensional array index.
 */
const coordToIndex = (x: number, y: number, mapWidth: number): number => {
    return y * mapWidth + x;
};

/**
 * Iterates over the boundaries of a bounding box (in pixels) and marks all
 * overlapping grid cells as blocked tiles.
 */
const processBoundingBox = (
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    blockedTiles: Set<number>,
    mapWidth: number,
    mapHeight: number
): void => {
    // Convert pixel boundaries to tile grid boundaries (inclusive)
    const startTileX = Math.floor(minX / TILE_SIZE);
    // Note: Max is inclusive. We must check the tile grid position of the final pixel.
    // Subtracting 1 ensures that a box extending exactly to the tile boundary only covers 
    // the tiles fully inside it.
    const endTileX = Math.floor((maxX - 1) / TILE_SIZE); 
    
    const startTileY = Math.floor(minY / TILE_SIZE);
    const endTileY = Math.floor((maxY - 1) / TILE_SIZE);

    // Iterate over all tiles covered by the bounding box
    for (let y = startTileY; y <= endTileY; y++) {
        for (let x = startTileX; x <= endTileX; x++) {
            // Check bounds to ensure the tile is actually within the map limits
            if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
                blockedTiles.add(coordToIndex(x, y, mapWidth));
            }
        }
    }
};

/**
 * Parses the Tiled collision layer objects and converts them into a 1D array of blocked tile indices.
 * It intelligently handles rectangles, ellipses (as bounding boxes), and polyline/polygons (as bounding boxes).
 */
export const getMapCollisionData = (): MapCollisionResult => {
    const mapWidth = mapData.width;
    const mapHeight = mapData.height;
    
    // Find the collision layer and assert its type
    const collisionLayer = mapData.layers.find(layer => layer.name === 'collisions') as TiledObjectLayer | undefined;
    
    if (!mapWidth || !mapHeight || !collisionLayer || collisionLayer.type !== 'objectgroup') {
        
        // --- Fallback to 'objects' layer logic is retained as a robust safety net ---
        const objectsLayer = mapData.layers.find(layer => layer.name === 'objects') as TiledTileLayer | undefined;

        if (objectsLayer && objectsLayer.data) {
            console.warn("No 'collisions' object group found. Falling back to blocking non-zero GIDs in 'objects' tile layer.");
            const fallbackBlockedTiles: number[] = [];
            objectsLayer.data.forEach((gid, index) => {
                if (gid > 0) {
                    fallbackBlockedTiles.push(index);
                }
            });
            return { mapWidth, mapHeight, blockedTileIndices: fallbackBlockedTiles };
        }

        console.error("Map data is missing dimensions or a valid collision layer.");
        return { mapWidth: 0, mapHeight: 0, blockedTileIndices: [] };
    }

    // Use a Set internally to manage uniqueness efficiently
    const blockedTiles: Set<number> = new Set();

    collisionLayer.objects.forEach((obj: TiledCollisionObject) => {
        let minX: number;
        let minY: number;
        let maxX: number;
        let maxY: number;

        // Start with the object's anchor point as the initial bounds
        minX = obj.x;
        minY = obj.y;
        maxX = obj.x;
        maxY = obj.y;

        // If it's a regular rectangle/ellipse, use width and height to define bounds
        if (obj.width > 0 && obj.height > 0 && !obj.polyline && !obj.polygon) {
            maxX = obj.x + obj.width;
            maxY = obj.y + obj.height;
        }
        // Handle Polylines and Polygons
        else if (obj.polyline || obj.polygon) {
            let valid :TiledPoint[] =[]
            if(obj.polygon){
                valid =obj.polygon
            }else if (obj.polyline){
                valid = obj.polyline
            }
            const points: TiledPoint[] = valid
            
            // Calculate the actual bounding box based on all relative points
            points.forEach((point: TiledPoint) => {
                const globalX = obj.x + point.x;
                const globalY = obj.y + point.y;
                
                minX = Math.min(minX, globalX);
                minY = Math.min(minY, globalY);
                maxX = Math.max(maxX, globalX);
                maxY = Math.max(maxY, globalY);
            });
        }
        
        // Important: Ensure we only process objects with a non-zero area. 
        // This check implicitly handles "ghost points" that don't define a shape.
        if (minX !== maxX || minY !== maxY) {
             // Apply processing to the resulting bounding box
            processBoundingBox(minX, minY, maxX, maxY, blockedTiles, mapWidth, mapHeight);
        }
    });
   
    // Convert the Set back to a sorted array before returning
    const finalBlockedIndices = Array.from(blockedTiles).sort((a, b) => a - b);
    
 
    
    return {
        mapWidth,
        mapHeight,
        blockedTileIndices: finalBlockedIndices
    };
};