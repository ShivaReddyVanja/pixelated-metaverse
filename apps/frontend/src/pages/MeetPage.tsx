import { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import GameScene from '@/lib/GameScene';
import { useSocketIO } from '@/hooks/useSocket';
import type { SocketConnectionData } from '@/types';
import { VideoLayer } from '@/components/VideoLayer';

const MeetPage = () => {
    const gameRef = useRef<HTMLDivElement>(null);
    const game = useRef<Phaser.Game | null>(null);
    const saved: SocketConnectionData = JSON.parse(localStorage.getItem("connectionInfo") || "{}");
    const { socketRef } = useSocketIO(saved);
    console.log(socketRef);
    if(!socketRef){
        return <p>Loading please....</p>
    }
    useEffect(() => {
        if (typeof window !== 'undefined' && gameRef.current && !game.current && socketRef.current ) {
            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                width: window.innerWidth,
                height: window.innerHeight,
                parent: gameRef.current,
                pixelArt: true,
                render: { pixelArt: true },
                physics: {
                    default: 'arcade',
                    arcade: {
                        gravity: {
                            y: 0,
                            x: 0
                        },
                        debug: false
                    }
                },
                scale: {
                    mode: Phaser.Scale.RESIZE,
                    autoCenter: Phaser.Scale.CENTER_BOTH
                }
            };

            game.current = new Phaser.Game(config);
            const gameScene = new GameScene(socketRef.current, saved.userId);
            game.current.scene.add('GameScene', gameScene, true);
        } else {
            console.log("one of these might be the issue:", typeof window,"gamered", gameRef.current, "game!", !game.current, socketRef.current);
        }

        return () => {
            game.current?.destroy(true);
            game.current = null;
        };
    }, [socketRef, saved.userId]);

    return (
        <>
            <div
                ref={gameRef}
                style={{
                    width: '100vw',
                    height: '100vh',
                    overflow: 'hidden',
                    margin: 0,
                    padding: 0
                }}
            />
            <VideoLayer />
        </>
    );
};

export default MeetPage;
