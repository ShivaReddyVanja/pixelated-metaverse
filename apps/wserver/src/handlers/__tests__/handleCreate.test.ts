import { handleCreate } from '../handleCreate';
import { createRoom, checkIfRoomExists, addUser } from '../../redisHandlers/actions';
import { RoomManager } from '../../RoomManager';
import { createMockIo, createMockSocket, createMockCallback, createTestRoomData } from '../../__tests__/utils/testHelpers';

// Mock dependencies
jest.mock('../../redisHandlers/redisActions');
jest.mock('../../RoomManager');

describe('handleCreate', () => {
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

    it('should create a new room successfully', async () => {
        const roomData = {
            token: 'test-token',
            name: 'Test Room',
            width: 10,
            height: 10,
            spaceId: 'test-room',
            objectsArray: [],
        };

        (checkIfRoomExists as jest.Mock).mockResolvedValue(false);
        (createRoom as jest.Mock).mockResolvedValue({ x: 5, y: 5 });

        await handleCreate(mockIo, mockSocket, roomData, mockCallback);

        expect(checkIfRoomExists).toHaveBeenCalledWith('test-room');
        expect(createRoom).toHaveBeenCalledWith(
            expect.objectContaining({
                roomId: 'test-room',
                name: 'Test Room',
                width: 10,
                height: 10,
                creatorId: 'test-user',
            }),
            'test-user',
            mockSocket.id
        );
        expect(mockSocket.join).toHaveBeenCalledWith('test-room');
        expect(mockSocket.data.user.roomId).toBe('test-room');
        expect(mockSocket.emit).toHaveBeenCalledWith('room:created', {
            playerId: 'test-user',
            roomId: 'test-room',
            spawn: { x: 5, y: 5 },
        });
        expect(mockCallback).toHaveBeenCalledWith({
            status: 'success',
            roomId: 'test-room',
            spawn: { x: 5, y: 5 },
        });
    });

    it('should join existing room instead of creating', async () => {
        const roomData = {
            token: 'test-token',
            name: 'Test Room',
            width: 10,
            height: 10,
            spaceId: 'test-room',
            objectsArray: [],
        };

        (checkIfRoomExists as jest.Mock).mockResolvedValue(true);
        (addUser as jest.Mock).mockResolvedValue({ x: 3, y: 4 });

        // handleJoin will be called, which we need to mock differently
        const { handleJoin } = require('../handleJoin');
        jest.mock('../handleJoin');

        await handleCreate(mockIo, mockSocket, roomData, mockCallback);

        expect(checkIfRoomExists).toHaveBeenCalledWith('test-room');
        // Should NOT call createRoom
        expect(createRoom).not.toHaveBeenCalled();
    });

    it('should handle room full error', async () => {
        const roomData = {
            token: 'test-token',
            name: 'Test Room',
            width: 10,
            height: 10,
            spaceId: 'test-room',
            objectsArray: [],
        };

        (checkIfRoomExists as jest.Mock).mockResolvedValue(false);
        (createRoom as jest.Mock).mockResolvedValue(null); // room full

        await handleCreate(mockIo, mockSocket, roomData, mockCallback);

        expect(mockSocket.emit).toHaveBeenCalledWith('error', {
            event: 'create',
            message: 'Room already exists, currently its full',
        });
    });

    it('should handle user already in room error', async () => {
        const roomData = {
            token: 'test-token',
            name: 'Test Room',
            width: 10,
            height: 10,
            spaceId: 'test-room',
            objectsArray: [],
        };

        (checkIfRoomExists as jest.Mock).mockResolvedValue(false);
        (createRoom as jest.Mock).mockResolvedValue(0); // user already exists

        await handleCreate(mockIo, mockSocket, roomData, mockCallback);

        expect(mockSocket.emit).toHaveBeenCalledWith('error', {
            event: 'create',
            message: 'Room already exists, you are in the room',
        });
    });

    it('should handle room creation error', async () => {
        const roomData = {
            token: 'test-token',
            name: 'Test Room',
            width: 10,
            height: 10,
            spaceId: 'test-room',
            objectsArray: [],
        };

        (checkIfRoomExists as jest.Mock).mockResolvedValue(false);
        (createRoom as jest.Mock).mockResolvedValue(-1); // error

        await handleCreate(mockIo, mockSocket, roomData, mockCallback);

        expect(mockSocket.emit).toHaveBeenCalledWith('error', {
            event: 'create',
            message: 'Room created, error while adding to the room',
        });
    });

    it('should handle internal server error', async () => {
        const roomData = {
            token: 'test-token',
            name: 'Test Room',
            width: 10,
            height: 10,
            spaceId: 'test-room',
            objectsArray: [],
        };

        (checkIfRoomExists as jest.Mock).mockRejectedValue(new Error('Redis error'));

        await handleCreate(mockIo, mockSocket, roomData, mockCallback);

        expect(mockSocket.emit).toHaveBeenCalledWith('error', {
            event: 'create',
            message: 'Internal server error',
        });
        expect(mockCallback).toHaveBeenCalledWith({
            status: 'error',
            event: 'create',
            message: 'Internal server error',
        });
    });

    it('should update socket room tracking', async () => {
        const roomData = {
            token: 'test-token',
            name: 'Test Room',
            width: 10,
            height: 10,
            spaceId: 'test-room',
            objectsArray: [],
        };

        (checkIfRoomExists as jest.Mock).mockResolvedValue(false);
        (createRoom as jest.Mock).mockResolvedValue({ x: 5, y: 5 });

        await handleCreate(mockIo, mockSocket, roomData, mockCallback);

        expect(mockRoom.addSocket).toHaveBeenCalledWith('test-user', mockSocket.id);
    });
});
