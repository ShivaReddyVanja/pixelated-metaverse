import { createRoom, addUser, removeUser, moveUser, getPlayersInRoom, checkIfRoomExists } from '../actions';
import RedisClient from '../../RedisInstance';
import { createTestRoomData } from '../../__tests__/utils/testHelpers';
import { MockRedisClient } from '../../__tests__/utils/mockRedis';

// Mock the RedisInstance
jest.mock('../../RedisInstance');

// Mock the RoomManager
jest.mock('../../RoomManager', () => ({
    RoomManager: {
        serverId: 'test-server-id-123',
    },
}));

describe('Redis Actions', () => {
    let mockRedis: MockRedisClient;

    beforeEach(() => {
        mockRedis = new MockRedisClient();
        (RedisClient.getInstance as jest.Mock).mockResolvedValue(mockRedis);
        jest.clearAllMocks();
    });

    afterEach(() => {
        mockRedis.clear();
    });

    describe('createRoom', () => {
        it('should create a new room with user', async () => {
            const roomData = createTestRoomData('room1', 10, 10, []);
            const userId = 'user1';
            const socketId = 'socket1';

            // Mock the addUser lua script result
            mockRedis.invokeScript = jest.fn().mockResolvedValue([5, 5]); // return position [5, 5]

            const result = await createRoom(roomData, userId, socketId);

            // Verify room metadata was set
            const roomHash = await mockRedis.hgetall(`room:${roomData.roomId}`);
            expect(roomHash.length).toBeGreaterThan(0);

            // Verify result contains position
            expect(result).toEqual({ x: 5, y: 5 });
        });

        it('should not create duplicate room', async () => {
            const roomData = createTestRoomData('room1', 10, 10, []);
            const userId = 'user1';
            const socketId = 'socket1';

            // Create room first time
            mockRedis.invokeScript = jest.fn().mockResolvedValue([5, 5]);
            await createRoom(roomData, userId, socketId);

            // Try creating again
            mockRedis.invokeScript = jest.fn().mockResolvedValue(0); // user already exists
            const result = await createRoom(roomData, userId, socketId);

            expect(result).toBe(0);
        });

        it('should return null when room is full', async () => {
            const roomData = createTestRoomData('room1', 10, 10, []);
            const userId = 'user1';
            const socketId = 'socket1';

            mockRedis.invokeScript = jest.fn().mockResolvedValue(null); // no free positions

            const result = await createRoom(roomData, userId, socketId);
            expect(result).toBeNull();
        });
    });

    describe('addUser', () => {
        it('should add user to room successfully', async () => {
            const roomId = 'room1';
            const userId = 'user1';
            const socketId = 'socket1';

            mockRedis.invokeScript = jest.fn().mockResolvedValue([3, 4]);

            const result = await addUser(roomId, userId, socketId);

            expect(result).toEqual({ x: 3, y: 4 });
            expect(mockRedis.invokeScript).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    keys: expect.arrayContaining([
                        `room:${roomId}:players:${userId}`,
                        `room:${roomId}:emptypos`,
                        `room:${roomId}:occupiedbyplayers`,
                        `room:${roomId}:players`,
                        `${userId}`, // KEYS[5] - user-server mapping
                    ]),
                    args: [userId, socketId, 'test-server-id-123'], // ARGV[3] is serverId
                })
            );
        });

        it('should return 0 when user already exists', async () => {
            const roomId = 'room1';
            const userId = 'user1';
            const socketId = 'socket1';

            mockRedis.invokeScript = jest.fn().mockResolvedValue(0);

            const result = await addUser(roomId, userId, socketId);
            expect(result).toBe(0);
        });

        it('should return null when room is full', async () => {
            const roomId = 'room1';
            const userId = 'user1';
            const socketId = 'socket1';

            mockRedis.invokeScript = jest.fn().mockResolvedValue(null);

            const result = await addUser(roomId, userId, socketId);
            expect(result).toBeNull();
        });

        it('should return -1 when room does not exist', async () => {
            const roomId = 'nonexistent';
            const userId = 'user1';
            const socketId = 'socket1';

            mockRedis.invokeScript = jest.fn().mockResolvedValue(-1);

            const result = await addUser(roomId, userId, socketId);
            expect(result).toBe(-1);
        });
    });

    describe('removeUser', () => {
        it('should remove user from room', async () => {
            const roomId = 'room1';
            const userId = 'user1';

            mockRedis.invokeScript = jest.fn().mockResolvedValue(1);
            mockRedis.scard = jest.fn().mockResolvedValue(1); // room still has players

            const result = await removeUser(roomId, userId, 'socket1');

            expect(result).toBe(true);
            expect(mockRedis.invokeScript).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    keys: expect.arrayContaining([
                        `room:${roomId}:players:${userId}`,
                        `room:${roomId}:emptypos`,
                        `room:${roomId}:occupiedbyplayers`,
                        `room:${roomId}:players`,
                        `socket1`, // KEYS[5] - user-server mapping
                    ]),
                    args: [userId],
                })
            );
        });

        it('should clean up room when last player leaves', async () => {
            const roomId = 'room1';
            const userId = 'user1';

            mockRedis.invokeScript = jest.fn().mockResolvedValue(1);
            mockRedis.scard = jest.fn().mockResolvedValue(0); // no players left
            const deleteSpy = jest.spyOn(mockRedis, 'del');

            const result = await removeUser(roomId, userId, 'socket1');

            expect(result).toBe(true);
            expect(deleteSpy).toHaveBeenCalledWith(
                expect.arrayContaining([
                    `room:${roomId}`,
                    `room:${roomId}:players`,
                    `room:${roomId}:emptypos`,
                    `room:${roomId}:occupiedbyplayers`,
                    `room:${roomId}:occupiedbyobjects`,
                    `room:${roomId}:freepos`,
                ])
            );
        });

        it('should return null when user not found', async () => {
            const roomId = 'room1';
            const userId = 'nonexistent';

            mockRedis.invokeScript = jest.fn().mockResolvedValue(null);

            const result = await removeUser(roomId, userId, 'socket1');
            expect(result).toBeNull();
        });
    });

    describe('moveUser', () => {
        it('should move user successfully', async () => {
            const roomId = 'room1';
            const userId = 'user1';
            const newX = 5;
            const newY = 6;

            mockRedis.invokeScript = jest.fn().mockResolvedValue({
                moved: 1,
                x: newX,
                y: newY,
            });

            const result = await moveUser(roomId, userId, newX, newY);

            expect(result).toEqual({ moved: 1, x: newX, y: newY });
            expect(mockRedis.invokeScript).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    keys: expect.arrayContaining([
                        `room:${roomId}:players:${userId}`,
                        `room:${roomId}:emptypos`,
                        `room:${roomId}:occupiedbyplayers`,
                    ]),
                    args: [roomId, userId, newX.toString(), newY.toString()],
                })
            );
        });

        it('should reject invalid move (collision)', async () => {
            const roomId = 'room1';
            const userId = 'user1';
            const newX = 5;
            const newY = 6;

            mockRedis.invokeScript = jest.fn().mockResolvedValue({
                moved: 0,
                x: 3, // old position
                y: 4,
            });

            const result = await moveUser(roomId, userId, newX, newY);

            expect(result).toEqual({ moved: 0, x: 3, y: 4 });
        });

        it('should return -1 when room does not exist', async () => {
            const roomId = 'nonexistent';
            const userId = 'user1';

            mockRedis.invokeScript = jest.fn().mockResolvedValue(-1);

            const result = await moveUser(roomId, userId, 5, 6);
            expect(result).toBe(-1);
        });

        it('should return 0 when user does not exist', async () => {
            const roomId = 'room1';
            const userId = 'nonexistent';

            mockRedis.invokeScript = jest.fn().mockResolvedValue(0);

            const result = await moveUser(roomId, userId, 5, 6);
            expect(result).toBe(0);
        });
    });

    describe('getPlayersInRoom', () => {
        it('should return all players in room', async () => {
            const roomId = 'room1';
            const mockPlayers = {
                user1: { x: 3, y: 4, socketId: 'socket1' },
                user2: { x: 5, y: 6, socketId: 'socket2' },
            };

            mockRedis.invokeScript = jest.fn().mockResolvedValue(mockPlayers);

            const result = await getPlayersInRoom(roomId);

            expect(result).toEqual(mockPlayers);
            expect(mockRedis.invokeScript).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    keys: [`room:${roomId}:players`],
                    args: [roomId],
                })
            );
        });

        it('should return null when room not found', async () => {
            const roomId = 'nonexistent';

            mockRedis.invokeScript = jest.fn().mockResolvedValue(null);

            const result = await getPlayersInRoom(roomId);
            expect(result).toBeNull();
        });

        it('should return empty object when room has no players', async () => {
            const roomId = 'room1';

            mockRedis.invokeScript = jest.fn().mockResolvedValue({});

            const result = await getPlayersInRoom(roomId);
            expect(result).toEqual({});
        });
    });

    describe('checkIfRoomExists', () => {
        it('should return true when room exists', async () => {
            const roomId = 'room1';

            mockRedis.hgetall = jest.fn().mockResolvedValue([
                { field: 'roomId', value: roomId },
                { field: 'name', value: 'Test Room' },
            ]);

            const result = await checkIfRoomExists(roomId);
            expect(result).toBe(true);
        });

        it('should return false when room does not exist', async () => {
            const roomId = 'nonexistent';

            mockRedis.hgetall = jest.fn().mockResolvedValue([]);

            const result = await checkIfRoomExists(roomId);
            expect(result).toBe(false);
        });
    });
});
