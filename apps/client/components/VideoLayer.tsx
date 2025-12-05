"use client"
import { useMediaStore } from "@/store/mediaStore"

export const VideoLayer = ()=>{
    const { remoteStreams } = useMediaStore()
    
  
    return (
        <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            zIndex: 9999,
            pointerEvents: "none",
        }}
        >
            {
                Object.entries(remoteStreams).map(([peerId, stream]) => (
                    <video
                        key={peerId}
                        autoPlay
                        playsInline
                        style={{
                            width: "150px",
                            height: "150px",
                            borderRadius: "10px",
                            marginBottom: "8px",
                        }}
                        ref={(video) => {
                            if (video && video.srcObject !== stream) {
                                video.srcObject = stream;
                            }
                        }}
                    />
                ))
            }
        </div>
    )
}