import { handleLeave } from "../handlers/handleLeave";
import { RoomManager } from "../RoomManager";

describe("handleLeave", () => {
  let mockWs: any;
  let mockRoom: any;

  beforeEach(() => {
    mockWs = { send: jest.fn() };
    mockRoom = {
      roomid: "room123",
      removeUser: jest.fn().mockReturnValue(true),
      broadcastMessage: jest.fn()
    };
  });

  it("should remove the user from the room", () => {
    jest.spyOn(RoomManager.getInstance(), "getRoom").mockReturnValue(mockRoom);

    const context = { ws: mockWs, id: "user123" } as any;

    handleLeave(context, {
        spaceId: "space123",
        event: "join",
        token: ""
    });

    expect(mockRoom.removeUser).toHaveBeenCalledWith("user123");
    expect(mockRoom.broadcastMessage).toHaveBeenCalledWith(
      JSON.stringify({ status: "left", playerId: "user123" })
    );
  });

  it("should send an error if the user is not found in the room", () => {
    mockRoom.removeUser.mockReturnValue(false);
    jest.spyOn(RoomManager.getInstance(), "getRoom").mockReturnValue(mockRoom);

    const context = { ws: mockWs, id: "user123" } as any;

    handleLeave(context, {
        spaceId: "space123",
        event: "join",
        token: ""
    });

    expect(mockWs.send).toHaveBeenCalledWith(
      JSON.stringify({ status: "error", message: "User not found in the room" })
    );
  });
});
