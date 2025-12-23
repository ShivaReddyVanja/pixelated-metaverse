import { handleLeave } from '../handleLeave';
import { removeUser } from '../../redisHandlers/actions';
import { publishEvent } from '../../redisHandlers/publisherRedis';
import { createMockIo, createMockSocket } from '../../__tests__/utils/testHelpers';

// Mock dependencies
jest.mock('../../redisHandlers/redisActions');
jest.mock('../../redisHandlers/redisPublisher');

describe('handleLeave', () => {
    let mockIo: any;
    let mockSocket: any;

    beforeEach(() => {
        mockIo = createMockIo();
        mockSocket = createMockSocket('test-user');
        mockSocket.data.user.roomId = 'test-room'; // User is in a room

        jest.clearAllMocks();
    });

    it('should leave room successfully', async () => {
        const leaveData = {
            token: 'test-token',
            spaceId: 'test-room',
        };

        (removeUser as jest.Mock).mockResolvedValue(true);

        await handleLeave(mockIo, mockSocket, leaveData);

        expect(removeUser).toHaveBeenCalledWith('test-room', 'test-user');
        expect(mockSocket.leave).toHaveBeenCalledWith('test-room');
        expect(mockSocket.data.user.roomId).toBe('');
        expect(publishEvent).toHaveBeenCalledWith('test-room', {
            type: 'leave',
            userId: 'test-user',
        });
    });

    it('should handle room not found error', async () => {
        const leaveData = {
            token: 'test-token',
            spaceId: 'test-room',
        };

        (removeUser as jest.Mock).mockResolvedValue(null); // room not found

        await handleLeave(mockIo, mockSocket, leaveData);

        expect(mockSocket.emit).toHaveBeenCalledWith('error', {
            event: 'leave',
            message: 'Room not found',
        });
        expect(mockSocket.leave).not.toHaveBeenCalled();
        expect(publishEvent).not.toHaveBeenCalled();
    });

    it('should handle internal server error', async () => {
        const leaveData = {
            token: 'test-token',
            spaceId: 'test-room',
        };

        (removeUser as jest.Mock).mockRejectedValue(new Error('Redis error'));

        await handleLeave(mockIo, mockSocket, leaveData);

        expect(mockSocket.emit).toHaveBeenCalledWith('error', {
            event: 'leave',
            message: 'Internal server error',
        });
    });

    it('should clear socket room tracking', async () => {
        const leaveData = {
            token: 'test-token',
            spaceId: 'test-room',
        };

        mockSocket.data.user.roomId = 'test-room';
        (removeUser as jest.Mock).mockResolvedValue(true);

        await handleLeave(mockIo, mockSocket, leaveData);

        expect(mockSocket.data.user.roomId).toBe('');
    });

    it('should publish leave event via pub/sub', async () => {
        const leaveData = {
            token: 'test-token',
            spaceId: 'test-room',
        };

        (removeUser as jest.Mock).mockResolvedValue(true);

        await handleLeave(mockIo, mockSocket, leaveData);

        expect(publishEvent).toHaveBeenCalledWith('test-room', {
            type: 'leave',
            userId: 'test-user',
        });
    });

    it('should not publish event if removal failed', async () => {
        const leaveData = {
            token: 'test-token',
            spaceId: 'test-room',
        };

        (removeUser as jest.Mock).mockResolvedValue(null);

        await handleLeave(mockIo, mockSocket, leaveData);

        expect(publishEvent).not.toHaveBeenCalled();
    });
});
