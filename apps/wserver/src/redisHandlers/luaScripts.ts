import { Script } from "@valkey/valkey-glide";
export const getCreateRoomScript = () => {
  const createRoomScript = `
  -- KEYS
-- 1 = room:{roomId}                      (room metadata hash)
-- 2 = room:{roomId}:occupiedbyobjects   (set)
-- 3 = room:{roomId}:freepos              (set)

-- ARGV
-- 1 = flat array for HSET (field, value, field, value...)
-- 2 = object positions (varargs)
-- 3 = free positions (varargs)

-- 1. check if room already exists
if redis.call("EXISTS", KEYS[3]) == 1 then
  return 0
end

-- 2. create room metadata
redis.call("HSET", KEYS[1], unpack(ARGV[1]))

-- 3. add occupied-by-objects positions
if #ARGV[2] > 0 then
  redis.call("SADD", KEYS[2], unpack(ARGV[2]))
end

-- 4. add free positions
if #ARGV[3] > 0 then
  redis.call("SADD", KEYS[3], unpack(ARGV[3]))
end

-- room successfully created
return 1
`
  return new Script(createRoomScript);
}

export const getUserAddScript = () => {
  const addUserLua = `
-- KEYS
-- 1 = room:{roomId}:players:{userId}
-- 2 = room:{roomId}:emptypos
-- 3 = room:{roomId}:occupiedbyplayers
-- 4 = room:{roomId}:players
-- 5 = {userId}

-- ARGV
-- 1 = userId
-- 2 = socketId
-- 3 = serverId

-- we use emptypos as the room existence marker
if redis.call("EXISTS", KEYS[2]) == 0 then
  return -1
end

-- reject if user already exists
if redis.call("HLEN", KEYS[1]) ~= 0 then
  return 0
end

-- pop a free slot
local slot = redis.call("SPOP", KEYS[2])
if not slot then
  return nil
end

-- mark slot as occupied
redis.call("SADD", KEYS[3], slot)

-- parse x,y
local sep = string.find(slot, ",")
local x = tonumber(string.sub(slot, 1, sep - 1))
local y = tonumber(string.sub(slot, sep + 1))

-- write player data
redis.call(
  "HSET",
  KEYS[1],
  "id", ARGV[1],
  "x", x,
  "y", y,
  "socketId", ARGV[2]
)

-- add user to players set
redis.call("SADD", KEYS[4], ARGV[1])

-- add a mapping of player to server
redis.call("SET", KEYS[5], ARGV[3])

-- return assigned position
return { x, y }
`;

  return new Script(addUserLua);
}

export const getRemoveUserScript = () => {
  const REMOVE_USER_LUA = `
-- KEYS
-- 1 = room:{roomId}:players:{userId} 
-- 2 = room:{roomId}:emptypos
-- 3 = room:{roomId}:occupiedbyplayers
-- 4 = room:{roomId}:players
-- 5 = {userId}

-- ARGV
-- 1 = userId

-- Check if user exists
if redis.call("HLEN", KEYS[1]) == 0 then
  return nil
end

-- Get user position
local x = redis.call("HGET", KEYS[1], "x")
local y = redis.call("HGET", KEYS[1], "y")
local userId = redis.call("HGET", KEYS[1], "id")

-- Create slot string "x,y"
local slot = x .. "," .. y

-- Remove from occupied positions
redis.call("SREM", KEYS[3], slot)

-- Add back to empty positions
redis.call("SADD", KEYS[2], slot)

-- Remove from players set
redis.call("SREM", KEYS[4], userId)

-- Delete user hash completely
redis.call("DEL", KEYS[1])

-- Remove user:server map 
redis.call('DEL', KEYS[5])

-- Return freed position
return 1
`;

  return new Script(REMOVE_USER_LUA);
};

export const getAllUsersScript = () => {

  const getAllUsers = `
-- KEYS
-- 1 = room:{roomId}:players (SET of userIds)

-- ARGV
-- 1 = roomId

if redis.call("EXISTS", KEYS[1]) == 0 then
  return {}
end

local playerIds = redis.call("SMEMBERS", KEYS[1])
local result = {}

for _, userId in ipairs(playerIds) do
  local playerKey = "room:" .. ARGV[1] .. ":players:" .. userId
  local playerData = redis.call("HGETALL", playerKey)

  if #playerData > 0 then
    table.insert(result, userId)
    table.insert(result, playerData)
  end
end

return result
`
  return new Script(getAllUsers);

}


export const getMovePlayerScript = () => {
  const movePlayerScipt = `
  -- KEYS
-- 1 = room:{roomId}:players:{userId}
-- 2 = room:{roomId}:emptypos
-- 3 = room:{roomId}:occupiedbyplayers

-- ARGV
-- 1 = roomId
-- 2 = userId
-- 3 = newX
-- 4 = newY

-- 1. check if room exists
if redis.call("EXISTS", KEYS[2]) == 0 then
  return -1
end

-- 2. check if player exists
if redis.call("EXISTS", KEYS[1]) == 0 then
  return 0
end

-- current position
local oldX = redis.call("HGET", KEYS[1], "x")
local oldY = redis.call("HGET", KEYS[1], "y")

if not oldX or not oldY then
  return 0
end

oldX = tonumber(oldX)
oldY = tonumber(oldY)

local newX = tonumber(ARGV[3])
local newY = tonumber(ARGV[4])

local oldPos = oldX .. "," .. oldY
local newPos = newX .. "," .. newY

-- 3. movement validity check (adjacent only)
local dx = math.abs(oldX - newX)
local dy = math.abs(oldY - newY)

if dx + dy ~= 1 then
  -- invalid move → stay in place
  return { 0, oldX, oldY }
end

-- 4. check if requested position is free
if redis.call("SISMEMBER", KEYS[2], newPos) == 0 then
  return { 0, oldX, oldY }
end

-- 5. lock new position
redis.call("SREM", KEYS[2], newPos)
redis.call("SADD", KEYS[3], newPos)

-- 6. free old position
redis.call("SREM", KEYS[3], oldPos)
redis.call("SADD", KEYS[2], oldPos)

-- 7. update player position
redis.call(
  "HSET",
  KEYS[1],
  "x", newX,
  "y", newY
)

-- 8. return moved = true
return { 1, newX, newY }

`

  return new Script(movePlayerScipt);
}
