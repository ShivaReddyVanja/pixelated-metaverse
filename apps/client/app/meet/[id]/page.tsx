"use client"

import React, { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
import { usePlayersStore } from '@/store/playersStore';
import GameScene from '@/lib/GameScene';
import { useSocketIO } from '@/hooks/useSocket';
import { SocketConnectionData } from '@/types';

interface GameSceneProps {
  width?: number;
  height?: number;
}

const Game: React.FC<GameSceneProps> = ({ width = 1024, height = 960 }) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const game = useRef<Phaser.Game | null>(null);

  const saved:SocketConnectionData = JSON.parse(localStorage.getItem("connectionInfo") || "{}");

  console.log("this is saved data",saved)

  const {isConnected,socketRef} = useSocketIO(saved);
  
  useEffect(() => {
    if (gameRef.current && !game.current) {
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width,
        height,
        parent: gameRef.current,
        physics: {
          default: 'arcade',
          arcade: {
            gravity: {
              y: 0,
              x: 0
            },
            debug: false
          }
        }
      };

      game.current = new Phaser.Game(config);
       // Add the scene instance with constructor parameters
      const gameScene = new GameScene(socketRef.current, saved.userId);
      game.current.scene.add('GameScene', gameScene, true);
    }
    return () => {
      game.current?.destroy(true);
      game.current = null;
      
    };
  }, [width, height]);

  
  return <div ref={gameRef} />;
};

export default Game;
