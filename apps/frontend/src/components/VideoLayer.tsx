"use client";

import { useMediaStore } from "@/store/mediaStore";
import { FadeTransition } from "./FadeTransition";

export const VideoLayer = () => {
    const { remoteStreams, localStream } = useMediaStore();

    return (
        <div className="absolute top-0 left-0 w-screen h-screen flex flex-col z-[9999] pointer-events-none items-center">

            {/* Horizontal Row Container (All videos go here) */}
            <div className="w-3/4 flex items-center justify-center h-[200px] space-x-4 mt-20 pointer-events-auto">

                {/* ---- Local Stream First ---- */}
                <FadeTransition show={!!localStream}>
                    <VideoTile stream={localStream} isLocal />
                </FadeTransition>

                {/* ---- Remote Streams ---- */}
                {Object.entries(remoteStreams).map(([peerId, stream]) => (
                    <FadeTransition key={peerId} show={!!stream}>
                        <VideoTile stream={stream} isLocal={false}/>
                    </FadeTransition>
                ))}

            </div>
        </div>
    );
};


const VideoTile = ({ stream, isLocal = false }: { stream:MediaStream|null, isLocal:boolean}) => {
    return (
        <div className="w-full h-full rounded-[10px] mb-2 bg-gray-800 relative overflow-hidden flex items-center justify-center shadow-md
        ">
            {/* Fallback */}
            {!stream && (
                <div className="absolute text-sm text-gray-400 z-[5]">
                    waiting for video...
                </div>
            )}

            {/* Video Element */}
            <video
                autoPlay
                playsInline
                muted={isLocal}        // Only local stream should be muted
                className={
                    isLocal
                        ? "w-full h-full object-cover -scale-x-100 z-[1]" // mirror effect for self-view
                        : "w-full h-full object-cover z-[1]"
                }
                ref={(video) => {
                    if (video && stream && video.srcObject !== stream) {
                        video.srcObject = stream;
                    }
                }}
            />
        </div>
    );
};
