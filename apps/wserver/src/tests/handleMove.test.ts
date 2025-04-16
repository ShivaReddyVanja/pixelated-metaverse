import { handleMove } from "../handlers/handleMove";
import { RoomManager } from "../RoomManager";
import { Room } from "../Room";

describe("handleMove", () => {
  let mockWs: any;
  let mockRoom: any;

  beforeEach(() => {
    mockWs = { send: jest.fn() };
    mockRoom = { 
      roomid: "room123",
      players: new Map([["user123", { x: 1, y: 1 }]]),
      filledPositions: new Set(),
      checkMove: jest.fn().mockReturnValue(true),
      broadcastMessage: jest.fn()
    };
  });

  it("should allow a valid move", () => {
    jest.spyOn(RoomManager.getInstance(), "getRoom").mockReturnValue(mockRoom);

    const context = { ws: mockWs, id: "user123" } as any;

    handleMove(context, {
        spaceId: "space123", x: 2, y: 1,
        event: "move",
        token: ""
    });

    expect(mockRoom.broadcastMessage).toHaveBeenCalledWith(
      expect.stringContaining('"status":"moved"')
    );
  });

  it("should send an error if the player is not in the room", () => {
    mockRoom.players.delete("user123");
    jest.spyOn(RoomManager.getInstance(), "getRoom").mockReturnValue(mockRoom);

    const context = { ws: mockWs, id: "user123" } as any;

    handleMove(context, {
        spaceId: "space123", x: 2, y: 1,
        event: "move",
        token: ""
    });

    expect(mockWs.send).toHaveBeenCalledWith(
      JSON.stringify({ status: "error", message: "Player not found in the room" })
    );
  });

  it("should send an error for an invalid move", () => {
    mockRoom.checkMove.mockReturnValue(false);
    jest.spyOn(RoomManager.getInstance(), "getRoom").mockReturnValue(mockRoom);

    const context = { ws: mockWs, id: "user123" } as any;

    handleMove(context, {
        spaceId: "space123", x: 3, y: 3,
        event: "move",
        token: ""
    });

    expect(mockWs.send).toHaveBeenCalledWith(
      JSON.stringify({ status: "error", message: "Invalid move: You can only move one step in any direction" })
    );
  });
});
