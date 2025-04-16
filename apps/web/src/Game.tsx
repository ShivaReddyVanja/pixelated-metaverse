import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';


interface GameSceneProps {
  width?: number;
  height?: number;
}

class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private collisionLayer!: Phaser.Tilemaps.TilemapLayer;
  collisionGroup!: Phaser.Physics.Arcade.StaticGroup;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // Load the tilemap JSON
    this.load.tilemapTiledJSON('village', '/village_map.json');
    // Load tileset images
    this.load.image('grass', '/grass_img.png');
    this.load.image('objects', '/objects.png');
    this.load.spritesheet('player', '/player2.png', {
      frameWidth: 32,
      frameHeight: 32
    });
  }

  create() {
    // Create the tilemap from the loaded JSON
    const map = this.make.tilemap({ key: 'village' });
    
    //here we are loading images for tilesets, grass and objects
    const objectTileset = map.addTilesetImage('map', 'objects');
    const grassTileset = map.addTilesetImage('grass_img', 'grass');

    console.log('map created successfully', grassTileset);
    const validLayerNames = map.getTileLayerNames();
    console.log('Valid tilemap layer names:', validLayerNames);


    //loading the tile layers
    if (grassTileset && objectTileset && validLayerNames.includes('grass_layer')) {
      map.createLayer('grass_layer', grassTileset);
      map.createLayer('top_layer',objectTileset);
    } else {
      console.error('Layer ground or objects does not exist in tilemap');
    }

  
      //Set the camera bounds to the map size
      this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

      // add the player
      this.player = this.physics.add.sprite(0, 0, 'player');
      this.player.setCollideWorldBounds(true);
      this.cameras.main.startFollow(this.player,true);
      this.cameras.main.setZoom(1); 

      this.collisionGroup = this.physics.add.staticGroup();
      
      // **COLLISION SETUP**
    const collisionLayer = map.getObjectLayer('collisions'); 
    if (collisionLayer) {
      this.collisionGroup = this.physics.add.staticGroup();

      // Loop through objects and create physics bodies
      collisionLayer.objects.forEach(obj => {
          const collisionBox = this.collisionGroup.create(obj.x, obj.y, '')
              .setOrigin(4, 4)
              .setSize(obj.width, obj.height)
              .setVisible(false); // Hide debug boxes
               // Enable collision between player and collision objects
              this.physics.add.collider(this.player, this.collisionGroup);
              collisionBox.setOffset(collisionBox.width/2, collisionBox.height / 2);
      });
    }
      else {
        console.warn('No collision layer found in tilemap.');
    }
    

      
    // Set up keyboard controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
    }
    // Player animations
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 2 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("player", { start: 4, end: 6 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "up",
      frames: this.anims.generateFrameNumbers("player", { start: 8, end: 10 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "down",
      frames: this.anims.generateFrameNumbers("player", { start: 12, end: 14 }),
      frameRate: 10,
      repeat: -1,
    });
    
  }

  update() {
    // Game update logic goes here
    if (this.cursors.left?.isDown) {
      
      this.player.setVelocityX(-160);
      this.player.anims.play("left", true);
        
    } else if (this.cursors.right?.isDown) {
      this.player.setVelocityX(160);
      this.player.anims.play("right", true);
     
    } else if (this.cursors.up?.isDown) {
      this.player.setVelocityY(-160);
      this.player.anims.play("up", true);
     
    } else if (this.cursors.down?.isDown) {
      this.player.setVelocityY(160);
      this.player.anims.play("down", true);
    } else {
      this.player.setVelocity(0, 0);
      this.player.anims.stop();
    }
  }
}

const Game: React.FC<GameSceneProps> = ({ width = 1024, height = 960 }) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const game = useRef<Phaser.Game | null>(null);
  

  useEffect(() => {
    if (gameRef.current && !game.current) {
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width,
        height,
        parent: gameRef.current,
        scene: GameScene,
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
    }
    return () => {
      game.current?.destroy(true);
      game.current = null;
      
    };
  }, [width, height]);

  
  return <div ref={gameRef} />;
};

export default Game;
