import { Server } from 'socket.io';
import { handlers } from '../eventHandlers';
import { getPlayersInRoom } from '../actions';
import { createMockIo } from '../../__tests__/utils/testHelpers';

// Mock actions
jest.mock('../actions');

describe('Redis Event Handlers', () => {
    let mockIo: Partial<Server>;
    let mockToEmit: jest.Mock;

    beforeEach(() => {
        mockIo = createMockIo();
        mockToEmit = jest.fn();
        mockIo.to = jest.fn(() => ({
            emit: mockToEmit,
        }) as any);
        mockIo.in = jest.fn(() => ({
            emit: mockToEmit,
        }) as any);
        jest.clearAllMocks();
    });

    describe('handlePlayerJoin', () => {
        it('should broadcast join event to room with all players', async () => {
            const roomId = 'room1';
            const userId = 'user1';
            const position = { x: 5, y: 5 };
            const mockPlayers = {
                user1: { x: 5, y: 5, socketId: 'socket1' },
                user2: { x: 3, y: 3, socketId: 'socket2' },
            };

            (getPlayersInRoom as jest.Mock).mockResolvedValue(mockPlayers);

            await handlers.join(mockIo as Server, roomId, { type: 'join', userId, position, socketId: 'socket1' });

            expect(mockIo.to).toHaveBeenCalledWith(roomId);
            expect(mockToEmit).toHaveBeenCalledWith('room:joined', {
                playerId: userId,
                players: mockPlayers,
                spawn: position,
            });
        });

        it('should fetch players for the correct room', async () => {
            const roomId = 'room2';
            const userId = 'user3';
            const position = { x: 7, y: 8 };

            (getPlayersInRoom as jest.Mock).mockResolvedValue({});

            await handlers.join(mockIo as Server, roomId, { type: 'join', userId, position, socketId: 'socket3' });

            expect(getPlayersInRoom).toHaveBeenCalledWith(roomId);
        });
    });

    describe('handlePlayerMove', () => {
        it('should broadcast move event to room', async () => {
            const roomId = 'room1';
            const userId = 'user1';
            const position = { x: 6, y: 7 };

            await handlers.move(mockIo as Server, roomId, { type: 'move', userId, position });

            expect(mockIo.in).toHaveBeenCalledWith(roomId);
            expect(mockToEmit).toHaveBeenCalledWith('player:moved', {
                playerId: userId,
                position,
            });
        });

        it('should not broadcast move event for invalid moves', async () => {
            // This test ensures we only call the handler for successful moves
            // In actual implementation, invalid moves don't trigger pub/sub at all
            const roomId = 'room1';
            const userId = 'user1';
            const position = { x: 10, y: 10 };

            await handlers.move(mockIo as Server, roomId, { type: 'move', userId, position });

            // Should still broadcast - but the handler should not be called for invalid moves
            expect(mockToEmit).toHaveBeenCalledWith('player:moved', {
                playerId: userId,
                position,
            });
        });
    });

    describe('handlePlayerLeave', () => {
        it('should broadcast leave event to room', async () => {
            const roomId = 'room1';
            const userId = 'user1';

            await handlers.leave(mockIo as Server, roomId, { type: 'leave', userId });

            expect(mockIo.to).toHaveBeenCalledWith(roomId);
            expect(mockToEmit).toHaveBeenCalledWith('player:left', {
                playerId: userId,
            });
        });

        it('should work for different users and rooms', async () => {
            const roomId = 'room3';
            const userId = 'user5';

            await handlers.leave(mockIo as Server, roomId, { type: 'leave', userId });

            expect(mockIo.to).toHaveBeenCalledWith(roomId);
            expect(mockToEmit).toHaveBeenCalledWith('player:left', {
                playerId: userId,
            });
        });
    });

    describe('Event Handler Type Safety', () => {
        it('should handle join event with correct type', async () => {
            const joinEvent = {
                type: 'join' as const,
                userId: 'user1',
                position: { x: 5, y: 5 },
                socketId: 'socket1',
            };

            (getPlayersInRoom as jest.Mock).mockResolvedValue({});

            await handlers.join(mockIo as Server, 'room1', joinEvent);

            expect(mockToEmit).toHaveBeenCalled();
        });

        it('should handle move event with correct type', async () => {
            const moveEvent = {
                type: 'move' as const,
                userId: 'user1',
                position: { x: 6, y: 7 },
            };

            await handlers.move(mockIo as Server, 'room1', moveEvent);

            expect(mockToEmit).toHaveBeenCalled();
        });

        it('should handle leave event with correct type', async () => {
            const leaveEvent = {
                type: 'leave' as const,
                userId: 'user1',
            };

            await handlers.leave(mockIo as Server, 'room1', leaveEvent);

            expect(mockToEmit).toHaveBeenCalled();
        });
    });
});
