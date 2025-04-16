import { handleCreate } from "../handlers/handleCreate";
import { RoomManager } from "../RoomManager";
import { Room } from "../Room";

describe("handleCreate", () => {
  let mockWs: any;

  beforeEach(() => {
    mockWs = { send: jest.fn() };
  });

  it("should create a new room if it does not exist", () => {
    jest.spyOn(RoomManager.getInstance(), "getRoom").mockReturnValue(undefined);
    jest.spyOn(RoomManager.getInstance(), "setRoom");

    const context = { ws: mockWs, id: "user123" } as any;

    handleCreate(context, {
      event:"create",
      spaceId: "space123",
      name: "Test Room",
      width: 10,
      height: 10,
      objectsArray: []
    });

    expect(RoomManager.getInstance().setRoom).toHaveBeenCalled();
    expect(mockWs.send).toHaveBeenCalledWith(
      expect.stringContaining('"status":"success"')
    );
  });

  it("should send an error if the room already exists", () => {
    jest.spyOn(RoomManager.getInstance(), "getRoom").mockReturnValue(
        new Room({ name: "Test Room",
            width: 10,
            height: 10,
            creatorId:"bsdbdbdbd",
            spaceId: "space123",
            objectsArray: []}));

    const context = { ws: mockWs, id: "user123" } as any;

    handleCreate(context, {
      event:"create",
      spaceId: "space123",
      name: "Test Room",
      width: 10,
      height: 10,
      objectsArray: []
    });

    expect(mockWs.send).toHaveBeenCalledWith(
      JSON.stringify({ status: "error", message: "Room already exists" })
    );
  });
});
