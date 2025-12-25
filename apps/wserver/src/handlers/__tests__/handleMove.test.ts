import { handleMove } from '../handleMove';
import { moveUser } from '../../redisHandlers/actions';
import { publishEvent } from '../../redisHandlers/publisherRedis';
import { RoomManager } from '../../RoomManager';
import { createMockIo, createMockSocket, createMockCallback } from '../../__tests__/utils/testHelpers';

// Mock dependencies
jest.mock('../../redisHandlers/actions');
jest.mock('../../redisHandlers/publisherRedis');
jest.mock('../../RoomManager');

describe('handleMove', () => {
    let mockIo: any;
    let mockSocket: any;
    let mockCallback: jest.Mock;
    let mockRoom: any;

    beforeEach(() => {
        mockIo = createMockIo();
        mockSocket = createMockSocket('test-user');
        mockSocket.data.user.roomId = 'test-room'; // User is in a room
        mockCallback = createMockCallback();

        mockRoom = {
            roomid: 'test-room',
        };

        const mockRoomManager = {
            getRoom: jest.fn().mockReturnValue(mockRoom),
        };
        (RoomManager.getInstance as jest.Mock).mockReturnValue(mockRoomManager);

        jest.clearAllMocks();
    });

    it('should move player successfully', async () => {
        const moveData = {
            playerId: 'test-user',
            position: { x: 6, y: 7 },
        };

        (moveUser as jest.Mock).mockResolvedValue({
            moved: 1,
            x: 6,
            y: 7,
        });

        await handleMove(mockIo, mockSocket, moveData, mockCallback);

        expect(moveUser).toHaveBeenCalledWith('test-room', 'test-user', 6, 7);
        expect(publishEvent).toHaveBeenCalledWith('test-room', {
            type: 'move',
            userId: 'test-user',
            position: { x: 6, y: 7 },
        });
        expect(mockCallback).toHaveBeenCalledWith({
            status: 'success',
            position: { x: 6, y: 7 },
        });
    });

    it('should reject invalid move (collision)', async () => {
        const moveData = {
            playerId: 'test-user',
            position: { x: 10, y: 10 },
        };

        (moveUser as jest.Mock).mockResolvedValue({
            moved: 0, // move rejected
            x: 5, // old position
            y: 5,
        });

        await handleMove(mockIo, mockSocket, moveData, mockCallback);

        expect(moveUser).toHaveBeenCalledWith('test-room', 'test-user', 10, 10);
        // Should send correction to player
        expect(mockSocket.emit).toHaveBeenCalledWith('player:moved', {
            playerId: 'test-user',
            position: { x: 5, y: 5 },
        });
        expect(mockCallback).toHaveBeenCalledWith({
            status: 'rejected',
            position: { x: 5, y: 5 },
        });
        // Should NOT publish to pub/sub
        expect(publishEvent).not.toHaveBeenCalled();
    });

    it('should handle room not found error', async () => {
        const moveData = {
            playerId: 'test-user',
            position: { x: 6, y: 7 },
        };

        (moveUser as jest.Mock).mockResolvedValue(-1); // room not found

        await handleMove(mockIo, mockSocket, moveData, mockCallback);

        expect(mockSocket.emit).toHaveBeenCalledWith('error', {
            event: 'move',
            message: 'Room not found',
        });
        expect(mockCallback).toHaveBeenCalledWith({
            status: 'error',
            event: 'move',
            message: 'Room not found',
        });
        expect(publishEvent).not.toHaveBeenCalled();
    });

    it('should handle player not found error', async () => {
        const moveData = {
            playerId: 'test-user',
            position: { x: 6, y: 7 },
        };

        (moveUser as jest.Mock).mockResolvedValue(0); // player not found

        await handleMove(mockIo, mockSocket, moveData, mockCallback);

        expect(mockSocket.emit).toHaveBeenCalledWith('error', {
            event: 'move',
            message: 'Player Not found',
        });
        expect(mockCallback).toHaveBeenCalledWith({
            status: 'error',
            event: 'move',
            message: 'Player Not found',
        });
        expect(publishEvent).not.toHaveBeenCalled();
    });

    it('should handle user not in room', async () => {
        mockSocket.data.user.roomId = ''; // User not in any room

        const moveData = {
            playerId: 'test-user',
            position: { x: 6, y: 7 },
        };

        const mockRoomManager = {
            getRoom: jest.fn().mockReturnValue(null),
        };
        (RoomManager.getInstance as jest.Mock).mockReturnValue(mockRoomManager);

        await handleMove(mockIo, mockSocket, moveData, mockCallback);

        expect(mockSocket.emit).toHaveBeenCalledWith('error', {
            event: 'move',
            message: 'Room not found',
        });
        expect(moveUser).not.toHaveBeenCalled();
    });

    it('should handle internal server error', async () => {
        const moveData = {
            playerId: 'test-user',
            position: { x: 6, y: 7 },
        };

        (moveUser as jest.Mock).mockRejectedValue(new Error('Redis error'));

        await handleMove(mockIo, mockSocket, moveData, mockCallback);

        expect(mockSocket.emit).toHaveBeenCalledWith('error', {
            event: 'move',
            message: 'Internal server error',
        });
        expect(mockCallback).toHaveBeenCalledWith({
            status: 'error',
            event: 'move',
            message: 'Internal server error',
        });
    });

    it('should only publish event for successful moves', async () => {
        const moveData1 = {
            playerId: 'test-user',
            position: { x: 6, y: 7 },
        };

        (moveUser as jest.Mock).mockResolvedValue({
            moved: 1,
            x: 6,
            y: 7,
        });

        await handleMove(mockIo, mockSocket, moveData1, mockCallback);
        expect(publishEvent).toHaveBeenCalledTimes(1);

        jest.clearAllMocks();

        const moveData2 = {
            playerId: 'test-user',
            position: { x: 10, y: 10 },
        };

        (moveUser as jest.Mock).mockResolvedValue({
            moved: 0,
            x: 6,
            y: 7,
        });

        await handleMove(mockIo, mockSocket, moveData2, mockCallback);
        expect(publishEvent).not.toHaveBeenCalled();
    });
});
