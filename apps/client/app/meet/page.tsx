"use client"

import React, { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
import { usePlayersStore } from '@/store/playersStore';
import GameScene from '@/lib/GameScene';
import { useSocketIO } from '@/hooks/useSocket';
import { SocketConnectionData } from '@/types';
import { VideoLayer } from '@/components/VideoLayer';

interface GameSceneProps {
  width?: number;
  height?: number;
}

const Game: React.FC<GameSceneProps> = () => {
  
  const gameRef = useRef<HTMLDivElement>(null);
  const game = useRef<Phaser.Game | null>(null);

  const saved: SocketConnectionData = JSON.parse(localStorage.getItem("connectionInfo") || "{}");

 

  const { isConnected, socketRef } = useSocketIO(saved);

  useEffect(() => {
    if (typeof window !== 'undefined' && gameRef.current && !game.current) {
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
      // Add the scene instance with constructor parameters
      //@ts-ignore
      const gameScene = new GameScene(socketRef.current, saved.userId);
      game.current.scene.add('GameScene', gameScene, true);
    }
    return () => {
      game.current?.destroy(true);
      game.current = null;

    };
  }, []);


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
    <VideoLayer/>
    </>
  );
};

export default Game;
