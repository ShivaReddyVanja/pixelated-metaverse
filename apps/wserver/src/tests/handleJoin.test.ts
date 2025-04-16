import { handleJoin } from "../handlers/handleJoin";
import { RoomManager } from "../RoomManager";
import { Room } from "../Room";

describe("handleJoin", () => {
  let mockWs: any;
  let mockRoom: any;

  beforeEach(() => {
    mockWs = { send: jest.fn() };
    mockRoom = { 
      roomid: "room123", 
      getEmptyPosition: jest.fn().mockReturnValue({ x: 1, y: 1 }), 
      players: new Map(),
      filledPositions: new Set(),
      broadcastMessage: jest.fn()
    };
  });

  it("should allow a user to join an existing room", () => {
    jest.spyOn(RoomManager.getInstance(), "getRoom").mockReturnValue(mockRoom);

    const context = { ws: mockWs, id: "user123" } as any;

    handleJoin(context, {
        spaceId: "space123",
        event: "join",
        token: ""
    });

    expect(mockWs.send).not.toHaveBeenCalledWith(
      JSON.stringify({ status: "error", message: "Room not found" })
    );
    expect(mockRoom.broadcastMessage).toHaveBeenCalled();
  });

  it("should send an error if the room doesn't exist", () => {
    jest.spyOn(RoomManager.getInstance(), "getRoom").mockReturnValue(undefined);

    const context = { ws: mockWs, id: "user123" } as any;

    handleJoin(context, {
        spaceId: "space123",
        event: "join",
        token: ""
    });

    expect(mockWs.send).toHaveBeenCalledWith(
      JSON.stringify({ status: "error", message: "Room not found" })
    );
  });

  it("should send an error if no empty position is found", () => {
    mockRoom.getEmptyPosition.mockReturnValue(null);
    jest.spyOn(RoomManager.getInstance(), "getRoom").mockReturnValue(mockRoom);

    const context = { ws: mockWs, id: "user123" } as any;

    handleJoin(context, {
        spaceId: "space123",
        event: "join",
        token: ""
    });

    expect(mockWs.send).toHaveBeenCalledWith(
      JSON.stringify({ status: "error", message: "Room is full , no empty position found" })
    );
  });
});
