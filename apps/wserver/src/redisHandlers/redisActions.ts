import { AddUserResult, RoomData } from "../types"
import RedisClient from "../RedisInstance"
import { getAllUsersScript, getMovePlayerScript, getRemoveUserScript, getUserAddScript } from "./luaScripts";
import { getFreePositions, getObjectsFilledPositions } from "./utils";


type RawLuaResult = number[] | null | 0 | -1;

type createRoomResult = 1 | 0
export const createRoom = async (roomData: RoomData, userId: string, userSocketId: string) => {
  const redis = await RedisClient.getInstance();
  const alreadyExists = await checkIfRoomExists(roomData.roomId);

  if (!alreadyExists) {
    const objectPositions = getObjectsFilledPositions(roomData.objectsArray, roomData.width);
    const freePositions = getFreePositions(objectPositions, roomData.width, roomData.height);
    const roomDataAsArray = Object.entries(roomData).map(([key, value]) => ({ field: key, value: String(value) }));
    //metdata,objects data, free positions
    await redis.hset(`room:${roomData.roomId}`, roomDataAsArray);
    await redis.sadd(`room:${roomData.roomId}:occupiedbyobjects`, objectPositions);
    await redis.sadd(`room:${roomData.roomId}:freepos`, freePositions);
    // Initialize empty players set
    // await redis.sadd(`room:${roomData.roomId}:players`, ["__placeholder__"]);
    // await redis.srem(`room:${roomData.roomId}:players`, ["__placeholder__"]);
  }
  const result = await addUser(roomData.roomId, userId, userSocketId);

  return result;

}

export const addUser = async (roomId: string, userId: string, userSocketId: string): Promise<AddUserResult> => {

  //get the redis client
  const redis = await RedisClient.getInstance();
  const addUserScript = getUserAddScript();

  const keys = [
    `room:${roomId}:players:${userId}`,     // KEYS[1]
    `room:${roomId}:emptypos`,              // KEYS[2] 
    `room:${roomId}:occupiedbyplayers`,     // KEYS[3]
    `room:${roomId}:players`                // KEYS[4] - players set
  ];

  const args = [
    userId,     // ARGV[1]
    userSocketId // ARGV[2]
  ];

  //result = null when user already exists or already exists
  const result = await redis.invokeScript(addUserScript, { keys, args }) as RawLuaResult;
  if (result === 0) return 0;
  if (result === null) return null;
  if (result === -1) return -1;

  return {
    x: Number(result[0]),
    y: Number(result[1])
  };

}

export const removeUser = async (roomId: string, userId: string) => {

  const redis = await RedisClient.getInstance();
  const removeUserScript = getRemoveUserScript();

  const keys = [
    `room:${roomId}:players:${userId}`,      // KEYS[1] - player hash
    `room:${roomId}:emptypos`,               // KEYS[2] - empty positions set
    `room:${roomId}:occupiedbyplayers`,      // KEYS[3] - occupied positions set
    `room:${roomId}:players`                 // KEYS[4] - players set
  ];

  const args = [
    userId      // ARGV[1]
  ];

  const result = await redis.invokeScript(removeUserScript, { keys, args }) as null | 1;

  if (result) {
    // Check if room is now empty
    const playerCount = await redis.scard(`room:${roomId}:players`);

    if (playerCount === 0) {
      // Room is empty, clean up all room data
      await redis.del([
        `room:${roomId}`,                       // Room metadata
        `room:${roomId}:players`,               // Players set
        `room:${roomId}:emptypos`,              // Empty positions
        `room:${roomId}:occupiedbyplayers`,     // Occupied positions by players
        `room:${roomId}:occupiedbyobjects`,     // Occupied positions by objects
        `room:${roomId}:freepos`                // Free positions
      ]);
      console.log(`Room ${roomId} cleaned up (empty)`);
    }
  }

  return result ? true : null;
}

export const checkIfRoomExists = async (roomId: string) => {
  const redis = await RedisClient.getInstance();
  const room = await redis.hgetall(`room:${roomId}`);
  if (room.length === 0) {
    return false;
  }
  return true;
}

type PlayerState = {
  x: number;
  y: number;
  socketId: string;
};

type PlayersObject = Record<string, PlayerState>;

export const getPlayersInRoom = async (roomId: string) => {
  const redis = await RedisClient.getInstance();
  const script = getAllUsersScript();
  const keys = [
    `room:${roomId}:players`  // Fixed key format
  ]
  const args = [
    roomId
  ]
  const result = await redis.invokeScript(script, { keys, args }) as PlayersObject | null;
  return result
}


type moved = 0 | 1
type position = { moved: moved, x: number, y: number }
type moveUserResult = -1 | 0 | position

export const moveUser = async (roomId: string, userId: string, newX: number, newY: number) => {
  const redis = await RedisClient.getInstance();
  const script = getMovePlayerScript();
  const keys = [
    `room:${roomId}:players:${userId}`,      // KEYS[1] - player hash
    `room:${roomId}:emptypos`,               // KEYS[2] - empty positions set
    `room:${roomId}:occupiedbyplayers`       // KEYS[3] - occupied positions set
  ]
  const args = [
    roomId,
    userId,
    newX.toString(),
    newY.toString()
  ]
  const result = await redis.invokeScript(script, { keys, args }) as moveUserResult;
  //0 means players doesnt exist or positions doesnt exist
  //-1 room doesnt exist
  // {0,x,y} when move is not valid, {1,x,y} when move is valid
  return result;
}
