import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { generateTestJWT } from '../utils/testHelpers';
import { verifyToken } from '@shared/jwt';

// Mock JWT verification
jest.mock('@shared/jwt');

describe('WebSocket Server - Authentication', () => {
    let httpServer: any;
    let io: Server;
    let serverPort: number;

    beforeAll((done) => {
        httpServer = createServer();
        io = new Server(httpServer, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            },
        });

        // Setup authentication middleware
        io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    return next(new Error('Authentication error: No token in cookies'));
                }
                const decoded = await verifyToken(token);
                socket.data.user = decoded;
                next();
            } catch (err) {
                next(new Error('Authentication error: Invalid token'));
            }
        });

        httpServer.listen(() => {
            serverPort = (httpServer.address() as any).port;
            done();
        });
    });

    afterAll((done) => {
        io.close();
        httpServer.close(done);
    });

    it('should authenticate with valid JWT token', (done) => {
        const validUser = {
            userId: 'test-user',
            name: 'Test User',
            roomId: '',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
        };

        (verifyToken as jest.Mock).mockResolvedValue(validUser);

        const token = generateTestJWT('test-user', 'Test User');
        const client: ClientSocket = ioClient(`http://localhost:${serverPort}`, {
            auth: { token },
        });

        client.on('connect', () => {
            expect(client.connected).toBe(true);
            client.disconnect();
            done();
        });

        client.on('connect_error', (err) => {
            done(new Error(`Should not fail: ${err.message}`));
        });
    });

    it('should reject connection with invalid JWT token', (done) => {
        (verifyToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));

        const client: ClientSocket = ioClient(`http://localhost:${serverPort}`, {
            auth: { token: 'invalid-token' },
        });

        client.on('connect', () => {
            client.disconnect();
            done(new Error('Should not connect with invalid token'));
        });

        client.on('connect_error', (err) => {
            expect(err.message).toContain('Authentication error: Invalid token');
            done();
        });
    });

    it('should reject connection without JWT token', (done) => {
        const client: ClientSocket = ioClient(`http://localhost:${serverPort}`, {
            auth: {},
        });

        client.on('connect', () => {
            client.disconnect();
            done(new Error('Should not connect without token'));
        });

        client.on('connect_error', (err) => {
            expect(err.message).toContain('Authentication error: No token in cookies');
            done();
        });
    });

    it('should populate socket.data.user with decoded JWT', (done) => {
        const validUser = {
            userId: 'user123',
            name: 'John Doe',
            roomId: '',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
        };

        (verifyToken as jest.Mock).mockResolvedValue(validUser);

        io.on('connection', (socket) => {
            expect(socket.data.user).toEqual(validUser);
            socket.disconnect();
            done();
        });

        const token = generateTestJWT('user123', 'John Doe');
        const client: ClientSocket = ioClient(`http://localhost:${serverPort}`, {
            auth: { token },
        });

        client.on('connect_error', (err) => {
            done(new Error(`Should not fail: ${err.message}`));
        });
    });

    it('should reject expired JWT token', (done) => {
        (verifyToken as jest.Mock).mockRejectedValue(new Error('Token expired'));

        const client: ClientSocket = ioClient(`http://localhost:${serverPort}`, {
            auth: { token: 'expired-token' },
        });

        client.on('connect', () => {
            client.disconnect();
            done(new Error('Should not connect with expired token'));
        });

        client.on('connect_error', (err) => {
            expect(err.message).toContain('Authentication error: Invalid token');
            done();
        });
    });
});
