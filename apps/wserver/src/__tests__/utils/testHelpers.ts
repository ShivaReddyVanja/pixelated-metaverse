import { Server, Socket } from 'socket.io';
import { sign } from 'jsonwebtoken';
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from '../../types/events';
import { RoomData } from '../../types';

type IoServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

/**
 * Generate a valid JWT token for testing
 */
export function generateTestJWT(userId: string = 'test-user', name: string = 'Test User'): string {
    const secret = process.env.JWT_SECRET || 'test-secret';
    return sign(
        {
            userId,
            name,
            roomId: '',
        },
        secret,
        { expiresIn: '1h' }
    );
}

/**
 * Create mock Socket.IO socket for testing
 */
export function createMockSocket(userId: string = 'test-user'): Partial<IoSocket> {
    const eventHandlers: Record<string, Function[]> = {};

    const socket: Partial<IoSocket> = {
        id: `socket-${userId}`,
        data: {
            user: {
                userId,
                name: 'Test User',
                roomId: '',
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 3600,
            }
        },
        handshake: {
            auth: {
                token: generateTestJWT(userId),
            }
        } as any,
        on: jest.fn((event: string, handler: Function) => {
            if (!eventHandlers[event]) {
                eventHandlers[event] = [];
            }
            eventHandlers[event].push(handler);
            return socket as any;
        }),
        emit: jest.fn(),
        join: jest.fn(),
        leave: jest.fn(),
        to: jest.fn(() => socket as any),
        in: jest.fn(() => socket as any),
        disconnect: jest.fn(),
    };

    return socket;
}

/**
 * Create mock Socket.IO server for testing
 */
export function createMockIo(): Partial<IoServer> {
    const rooms: Map<string, Set<string>> = new Map();

    const io: Partial<IoServer> = {
        on: jest.fn(),
        emit: jest.fn(),
        to: jest.fn(() => ({
            emit: jest.fn(),
        } as any)),
        in: jest.fn(() => ({
            emit: jest.fn(),
        } as any)),
        sockets: {
            sockets: new Map(),
        } as any,
        use: jest.fn(),
    };

    return io;
}

/**
 * Create test room data
 */
export function createTestRoomData(
    roomId: string = 'test-room',
    width: number = 10,
    height: number = 10,
    objectsArray: number[] = []
): RoomData {
    return {
        roomId,
        name: `Test Room ${roomId}`,
        width,
        height,
        gridSize: width * height,
        creatorId: 'test-creator',
        objectsArray,
    };
}

/**
 * Wait for a promise to resolve with a timeout
 */
export function waitFor(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a mock callback function with type safety
 */
export function createMockCallback<T = any>(): jest.Mock<void, [T]> {
    return jest.fn<void, [T]>();
}

/**
 * Helper to verify emit was called with specific event and data
 */
export function expectEmit(
    mockEmit: jest.Mock,
    event: string,
    dataMatcher?: any
): void {
    const calls = mockEmit.mock.calls;
    const call = calls.find(c => c[0] === event);

    if (!call) {
        throw new Error(
            `Expected emit to be called with event "${event}", but it was not. ` +
            `Actual events: ${calls.map(c => c[0]).join(', ')}`
        );
    }

    if (dataMatcher !== undefined) {
        expect(call[1]).toMatchObject(dataMatcher);
    }
}

/**
 * Helper to verify emit was NOT called with specific event
 */
export function expectNoEmit(mockEmit: jest.Mock, event: string): void {
    const calls = mockEmit.mock.calls;
    const call = calls.find(c => c[0] === event);

    if (call) {
        throw new Error(
            `Expected emit NOT to be called with event "${event}", but it was called with: ` +
            JSON.stringify(call[1])
        );
    }
}
