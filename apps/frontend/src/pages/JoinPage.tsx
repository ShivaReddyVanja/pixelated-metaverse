import { api } from '@/services/api';
import type { SocketConnectionData } from '@/types';
import axios from 'axios';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';

const ArrowLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="m12 19-7-7 7-7" />
        <path d="M19 12H5" />
    </svg>
);

export default function JoinPage() {
    const [searchParams] = useSearchParams();
    const initialRoomId = searchParams.get('roomid') || "";

    const [name, setName] = useState("");
    const [roomId, setRoomId] = useState(initialRoomId);
    const [connectionData, setConnectionData] = useState<SocketConnectionData | null>(null);
    const navigate = useNavigate();

    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!name || !roomId) {
            console.error("Name and Room ID are required.");
            return;
        }

        try {
            const response = await api.post("/join", { name, roomId });
            const data = response.data;
            setConnectionData(data);

            localStorage.setItem("connectionInfo", JSON.stringify({
                userId: data.userId,
                roomId: data.roomId,
                socket: data.socket,
                token: data.token
            }));

            navigate(`/meet?id=${roomId}`);
        } catch (e: unknown) {
            if (axios.isAxiosError(e)) {
                console.error(e.response?.data?.message ?? e.message);
            } else if (e instanceof Error) {
                console.error(e.message);
            } else {
                console.error(e);
            }
        }
    };

    return (
        <div className="bg-slate-900 text-white min-h-screen flex flex-col">
            <header className="container mx-auto px-6 lg:px-8 py-4">
                <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
                    PixelMeet
                </Link>
            </header>

            <main className="flex-grow flex items-center justify-center p-4">
                <div className="w-full max-w-md mx-auto bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-lg shadow-pink-500/10">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold mb-2">Join a meeting</h1>
                        <p className="text-slate-400 mb-8">Enter your name and the Room ID to connect.</p>
                    </div>

                    <form onSubmit={handleFormSubmit}>
                        <div className="mb-4">
                            <label htmlFor="roomId" className="block text-sm font-medium text-slate-300 mb-2">
                                Meeting Room ID
                            </label>
                            <input
                                type="text"
                                id="roomId"
                                name="roomId"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                required
                                placeholder="e.g., abc-123-xyz"
                                className="w-full px-4 py-3 bg-slate-700 text-white border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition duration-200"
                            />
                        </div>

                        <div className="mb-6">
                            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                                Your Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                placeholder="e.g., Alex Doe"
                                className="w-full px-4 py-3 bg-slate-700 text-white border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition duration-200"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 duration-300"
                        >
                            Join Meet
                        </button>
                    </form>

                    <div className="text-center mt-6">
                        <Link to="/" className="text-sm text-slate-400 hover:text-pink-400 transition duration-200 inline-flex items-center gap-2">
                            <ArrowLeftIcon className="h-4 w-4" />
                            Back to Home
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
