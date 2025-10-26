# Socket Events Documentation

This document describes the WebSocket (socket.io) events, the data you should send for each event, and the responses you can expect from the server.

---

## General Notes
- All events are sent as JSON objects.
- Most events require a `token` for authentication (except `create`).
- The `event` field determines the action.

---

## Event: `create`
**Purpose:** Create a new room/space.

### Client → Server
| Field         | Type     | Description                |
|---------------|----------|----------------------------|
| event         | string   | "create"                  |
| name          | string   | Name of the room/space     |
| width         | number   | Width of the room grid     |
| height        | number   | Height of the room grid    |
| spaceId       | string   | Unique ID for the space    |
| objectsArray  | any[]    | Array of object positions  |

**Example:**
```json
{
  "event": "create",
  "name": "Test Room",
  "width": 10,
  "height": 8,
  "spaceId": "abc123",
  "objectsArray": [12, 34, 56]
}
```

### Server → Client
| Field   | Type   | Description                       |
|---------|--------|-----------------------------------|
| event   | string | "create"                         |
| status  | string | "success" or "error"             |
| roomId  | string | Room ID (on success)              |
| message | string | Error message (on error)          |
| spawn   | object | { x: number, y: number } (success)|

**Success Example:**
```json
{
  "event": "create",
  "roomId": "abc123",
  "status": "success",
  "spawn": { "x": 0, "y": 0 }
}
```
**Error Example:**
```json
{
  "event": "create",
  "status": "error",
  "message": "Room already exists"
}
```

---

## Event: `join`
**Purpose:** Join an existing room/space.

### Client → Server
| Field   | Type   | Description                |
|---------|--------|----------------------------|
| event   | string | "join"                     |
| token   | string | JWT authentication token   |
| spaceId | string | ID of the room/space       |

**Example:**
```json
{
  "event": "join",
  "token": "<jwt-token>",
  "spaceId": "abc123"
}
```

### Server → All Clients in Room
| Field     | Type   | Description                       |
|-----------|--------|-----------------------------------|
| event     | string | "join"                           |
| status    | string | "success" or "error"             |
| playerId  | string | ID of the joining player          |
| spawn     | object | { x: number, y: number } (success)|
| message   | string | Error message (on error)          |

**Success Example:**
```json
{
  "event": "join",
  "status": "success",
  "playerId": "user123",
  "spawn": { "x": 1, "y": 2 }
}
```
**Error Example:**
```json
{
  "event": "join",
  "status": "error",
  "message": "Room is full , no empty position found"
}
```

---

## Event: `leave`
**Purpose:** Leave a room/space.

### Client → Server
| Field   | Type   | Description                |
|---------|--------|----------------------------|
| event   | string | "leave"                    |
| token   | string | JWT authentication token   |
| spaceId | string | ID of the room/space       |

**Example:**
```json
{
  "event": "leave",
  "token": "<jwt-token>",
  "spaceId": "abc123"
}
```

### Server → All Clients in Room
| Field     | Type   | Description                       |
|-----------|--------|-----------------------------------|
| event     | string | "leave"                          |
| status    | string | "success" or "error"             |
| playerId  | string | ID of the leaving player          |
| message   | string | Error message (on error)          |

**Success Example:**
```json
{
  "event": "leave",
  "status": "success",
  "playerId": "user123"
}
```
**Error Example:**
```json
{
  "event": "leave",
  "status": "error",
  "message": "User not found in the room"
}
```

---

## Event: `move`
**Purpose:** Move a player within a room.

### Client → Server
| Field   | Type   | Description                |
|---------|--------|----------------------------|
| event   | string | "move"                     |
| token   | string | JWT authentication token   |
| spaceId | string | ID of the room/space       |
| x       | number | New X position             |
| y       | number | New Y position             |

**Example:**
```json
{
  "event": "move",
  "token": "<jwt-token>",
  "spaceId": "abc123",
  "x": 2,
  "y": 3
}
```

### Server → All Clients in Room
| Field     | Type   | Description                       |
|-----------|--------|-----------------------------------|
| event     | string | "move"                           |
| status    | string | "success" or "error"             |
| playerId  | string | ID of the moving player           |
| position  | object | { x: number, y: number } (success)|
| message   | string | Error message (on error)          |

**Success Example:**
```json
{
  "event": "move",
  "status": "success",
  "playerId": "user123",
  "position": { "x": 2, "y": 3 }
}
```
**Error Example:**
```json
{
  "event": "move",
  "status": "error",
  "message": "Invalid move: Position is already occupied"
}
```

---

## Other Server Messages
- If a room is not found or a generic error occurs, the server may send:
```json
{
  "status": "error",
  "message": "Room not found"
}
```
- When a user disconnects, the server may broadcast:
```json
{
  "status": "left",
  "playerId": "user123"
}
```

---

## Summary Table
| Event   | Client → Server Fields                | Server → Client Fields                |
|---------|---------------------------------------|---------------------------------------|
| create  | event, name, width, height, spaceId, objectsArray | event, status, roomId, spawn, message |
| join    | event, token, spaceId                 | event, status, playerId, spawn, message |
| leave   | event, token, spaceId                 | event, status, playerId, message        |
| move    | event, token, spaceId, x, y           | event, status, playerId, position, message | 