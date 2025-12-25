import { handleJoin } from '../handleJoin';
import { addUser, getPlayersInRoom } from '../../redisHandlers/actions';
import { publishEvent } from '../../redisHandlers/publisherRedis';
import { RoomManager } from '../../RoomManager';
import { createMockIo, createMockSocket, createMockCallback } from '../../__tests__/utils/testHelpers';

// Mock dependencies
jest.mock('../../redisHandlers/actions');
jest.mock('../../redisHandlers/publisherRedis');
jest.mock('../../RoomManager');

describe('handleJoin', () => {
    let mockIo: any;
    let mockSocket: any;
    let mockCallback: jest.Mock;
    let mockRoom: any;

    beforeEach(() => {
        mockIo = createMockIo();
        mockSocket = createMockSocket('test-user');
        mockCallback = createMockCallback();

        mockRoom = {
            roomid: 'test-room',
            addSocket: jest.fn(),
        };

        const mockRoomManager = {
            getRoom: jest.fn().mockReturnValue(mockRoom),
        };
        (RoomManager.getInstance as jest.Mock).mockReturnValue(mockRoomManager);

        jest.clearAllMocks();
    });

    it('should join room successfully', async () => {
        const joinData = {
            token: 'test-token',
            spaceId: 'test-room',
        };

        const mockPlayers = {
            'test-user': { x: 5, y: 5, socketId: 'socket-test-user' },
            'other-user': { x: 3, y: 3, socketId: 'socket-other' },
        };

        (addUser as jest.Mock).mockResolvedValue({ x: 5, y: 5 });
        (getPlayersInRoom as jest.Mock).mockResolvedValue(mockPlayers);

        await handleJoin(mockIo, mockSocket, joinData, mockCallback);

        expect(addUser).toHaveBeenCalledWith('test-room', 'test-user', mockSocket.id);
        expect(mockSocket.join).toHaveBeenCalledWith('test-room');
        expect(mockSocket.data.user.roomId).toBe('test-room');
        expect(publishEvent).toHaveBeenCalledWith('test-room', {
            type: 'join',
            userId: 'test-user',
            position: { x: 5, y: 5 },
        });
        expect(mockCallback).toHaveBeenCalledWith({
            status: 'success',
            position: { x: 5, y: 5 },
        });
    });

    it('should handle room not found error', async () => {
        const joinData = {
            token: 'test-token',
            spaceId: 'nonexistent-room',
        };

        (addUser as jest.Mock).mockResolvedValue(-1); // room not found

        await handleJoin(mockIo, mockSocket, joinData, mockCallback);

        expect(mockSocket.emit).toHaveBeenCalledWith('error', {
            event: 'join',
            message: 'Room Not found',
        });
        expect(mockCallback).toHaveBeenCalledWith({
            status: 'error',
            event: 'join',
            message: 'Room Not found',
        });
        expect(publishEvent).not.toHaveBeenCalled();
    });

    it('should handle room full error', async () => {
        const joinData = {
            token: 'test-token',
            spaceId: 'test-room',
        };

        (addUser as jest.Mock).mockResolvedValue(null); // room full

        await handleJoin(mockIo, mockSocket, joinData, mockCallback);

        expect(mockSocket.emit).toHaveBeenCalledWith('error', {
            event: 'join',
            message: 'Room is full',
        });
        expect(mockCallback).toHaveBeenCalledWith({
            status: 'error',
            event: 'join',
            message: 'Room is full',
        });
        expect(publishEvent).not.toHaveBeenCalled();
    });

    it('should handle already in room error', async () => {
        const joinData = {
            token: 'test-token',
            spaceId: 'test-room',
        };

        (addUser as jest.Mock).mockResolvedValue(0); // already in room

        await handleJoin(mockIo, mockSocket, joinData, mockCallback);

        expect(mockSocket.emit).toHaveBeenCalledWith('error', {
            event: 'join',
            message: 'Already in the room',
        });
        expect(mockCallback).toHaveBeenCalledWith({
            status: 'error',
            event: 'join',
            message: 'Already in the room',
        });
        expect(publishEvent).not.toHaveBeenCalled();
    });

    it('should handle getPlayersInRoom failure', async () => {
        const joinData = {
            token: 'test-token',
            spaceId: 'test-room',
        };

        (addUser as jest.Mock).mockResolvedValue({ x: 5, y: 5 });
        (getPlayersInRoom as jest.Mock).mockResolvedValue(null); // failed to get players

        await handleJoin(mockIo, mockSocket, joinData, mockCallback);

        expect(mockSocket.emit).toHaveBeenCalledWith('error', {
            event: 'join',
            message: 'No room found, while trying to fetch the players',
        });
        expect(mockCallback).toHaveBeenCalledWith({
            status: 'error',
            event: 'join',
            message: 'No room found, while trying to fetch the players',
        });
    });

    it('should handle internal server error', async () => {
        const joinData = {
            token: 'test-token',
            spaceId: 'test-room',
        };

        (addUser as jest.Mock).mockRejectedValue(new Error('Redis error'));

        await handleJoin(mockIo, mockSocket, joinData, mockCallback);

        expect(mockSocket.emit).toHaveBeenCalledWith('error', {
            event: 'join',
            message: 'Internal server error',
        });
        expect(mockCallback).toHaveBeenCalledWith({
            status: 'error',
            event: 'join',
            message: 'Internal server error',
        });
    });

    it('should publish join event via pub/sub', async () => {
        const joinData = {
            token: 'test-token',
            spaceId: 'test-room',
        };

        (addUser as jest.Mock).mockResolvedValue({ x: 7, y: 8 });
        (getPlayersInRoom as jest.Mock).mockResolvedValue({});

        await handleJoin(mockIo, mockSocket, joinData, mockCallback);

        expect(publishEvent).toHaveBeenCalledWith('test-room', {
            type: 'join',
            userId: 'test-user',
            position: { x: 7, y: 8 },
        });
    });
});
