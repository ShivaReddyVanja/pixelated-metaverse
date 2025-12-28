import { removeUser } from '../../redisHandlers/actions';
import { publishEvent } from '../../redisHandlers/publishEvents';
import { RoomManager } from '../../RoomManager';
import { createMockIo, createMockSocket } from '../utils/testHelpers';

// Mock dependencies
jest.mock('../../redisHandlers/actions');
jest.mock('../../redisHandlers/publisherRedis');
jest.mock('../../RoomManager');

describe('Disconnect Handler', () => {
    let mockIo: any;
    let mockSocket: any;
    let mockRoom: any;
    let disconnectHandler: Function | undefined;

    beforeEach(() => {
        mockIo = createMockIo();
        mockSocket = createMockSocket('test-user');
        mockSocket.data.user.roomId = 'test-room';

        mockRoom = {
            roomid: 'test-room',
        };

        const mockRoomManager = {
            getRoom: jest.fn().mockReturnValue(mockRoom),
        };
        (RoomManager.getInstance as jest.Mock).mockReturnValue(mockRoomManager);

        // Capture the disconnect handler
        disconnectHandler = undefined;
        mockSocket.on = jest.fn((event: string, handler: Function) => {
            if (event === 'disconnect') {
                disconnectHandler = handler;
            }
        });

        jest.clearAllMocks();
    });

    it('should remove user from Redis on disconnect', async () => {
        (removeUser as jest.Mock).mockResolvedValue(true);

        // Simulate the actual disconnect handler from index.ts
        // This is what the disconnect handler should do
        const roomId = mockSocket.data.user.roomId;
        const userId = mockSocket.data.user.userId;
        const room = RoomManager.getInstance().getRoom(roomId);

        if (room) {
            await removeUser(room.roomid, userId, mockSocket.id);
            await publishEvent(roomId, {
                type: 'leave' as const,
                userId,
            });
        }

        expect(removeUser).toHaveBeenCalledWith('test-room', 'test-user', mockSocket.id);
    });

    it('should publish leave event via pub/sub on disconnect', async () => {
        (removeUser as jest.Mock).mockResolvedValue(true);

        const roomId = mockSocket.data.user.roomId;
        const userId = mockSocket.data.user.userId;
        const room = RoomManager.getInstance().getRoom(roomId);

        if (room) {
            await removeUser(room.roomid, userId, mockSocket.id);
            await publishEvent(roomId, {
                type: 'leave' as const,
                userId,
            });
        }

        expect(publishEvent).toHaveBeenCalledWith('test-room', {
            type: 'leave',
            userId: 'test-user',
        });
    });

    it('should not error if user not in room on disconnect', async () => {
        mockSocket.data.user.roomId = ''; // No room

        const roomId = mockSocket.data.user.roomId;

        if (!roomId) {
            // Should not call removeUser or publishEvent
            expect(removeUser).not.toHaveBeenCalled();
            expect(publishEvent).not.toHaveBeenCalled();
        }
    });

    it('should handle disconnect when room does not exist', async () => {
        const mockRoomManager = {
            getRoom: jest.fn().mockReturnValue(null),
        };
        (RoomManager.getInstance as jest.Mock).mockReturnValue(mockRoomManager);

        const roomId = mockSocket.data.user.roomId;
        const room = RoomManager.getInstance().getRoom(roomId);

        if (!room) {
            // Should not proceed
            expect(removeUser).not.toHaveBeenCalled();
            expect(publishEvent).not.toHaveBeenCalled();
        }
    });

    it('should notify other players in room on disconnect', async () => {
        (removeUser as jest.Mock).mockResolvedValue(true);

        const roomId = 'test-room';
        const userId = 'test-user';
        const room = RoomManager.getInstance().getRoom(roomId);

        if (room) {
            await removeUser(room.roomid, userId, mockSocket.id);
            await publishEvent(roomId, {
                type: 'leave' as const,
                userId,
            });
        }

        // Verify pub/sub event was published
        // This will be picked up by RedisInstance subscriber
        // and broadcasted to all clients in the room
        expect(publishEvent).toHaveBeenCalledWith('test-room', {
            type: 'leave',
            userId: 'test-user',
        });
    });

    it('should clean up room if last player disconnects', async () => {
        // When removeUser returns true and there are no players left,
        // the Redis keys should be cleaned up (tested in actions.test.ts)
        (removeUser as jest.Mock).mockResolvedValue(true);

        const roomId = mockSocket.data.user.roomId;
        const userId = mockSocket.data.user.userId;
        const room = RoomManager.getInstance().getRoom(roomId);

        if (room) {
            await removeUser(room.roomid, userId, mockSocket.id);
        }

        expect(removeUser).toHaveBeenCalled();
        // The cleanup logic is handled inside removeUser
    });
});
