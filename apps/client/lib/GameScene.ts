import Game from "@/components/GameScene";
import { PlayersMap, usePlayersStore } from "@/store/playersStore";
import { Socket } from "socket.io-client";

class GameScene extends Phaser.Scene {

  private localPlayer!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private collisionLayer!: Phaser.Tilemaps.TilemapLayer;
  collisionGroup!: Phaser.Physics.Arcade.StaticGroup;
  private otherPlayers: Map<string, Phaser.Physics.Arcade.Sprite> = new Map();
  private socket!: Socket;
  private localPlayerId!: string;
  private prevInput: { x: number; y: number } = { x: 0, y: 0 };


  constructor(socket: Socket, localPlayerId: string) {
    super({ key: 'GameScene' });
    this.socket = socket;
    this.localPlayerId = localPlayerId;

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
    const validLayerNames = map.getTileLayerNames();

    //loading the tile layers
    if (grassTileset && objectTileset && validLayerNames.includes('grass_layer')) {
      map.createLayer('grass_layer', grassTileset);
      map.createLayer('top_layer',objectTileset);
    } else {
      console.error('Layer ground or objects does not exist in tilemap');
    }

    //Set the camera bounds to the map size
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // Local Player
    this.localPlayer = this.physics.add.sprite(0, 0, 'player');
    this.localPlayer.setCollideWorldBounds(true);
    this.cameras.main.startFollow(this.localPlayer,true);
    this.cameras.main.setZoom(1); 
    
    //---collision---
    this.collisionGroup = this.physics.add.staticGroup();
    const collisionLayer = map.getObjectLayer('collisions'); 
    if (collisionLayer) {
      // Loop through objects and create physics bodies
      collisionLayer.objects.forEach(obj => {
          const collisionBox = this.collisionGroup.create(obj.x, obj.y, '')
              .setOrigin(4, 4)
              .setSize(obj.width, obj.height)
              .setVisible(false); // Hide debug boxes
               // Enable collision between player and collision objects
              this.physics.add.collider(this.localPlayer, this.collisionGroup);
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
    
    //--player animations---
    this.createAnimations();

    // --- Subscribe to Zustand store for remote players ---
    const usub = usePlayersStore.subscribe(
  (state) => state.players,
  (players: PlayersMap) => {
    Object.entries(players).forEach(([id, pos]) => {
      if (id === this.localPlayerId) {
        return;
      }
      let sprite = this.otherPlayers.get(id);
      if (!sprite) {
        sprite = this.physics.add.sprite(pos.x, pos.y, "player");
        sprite.setTint(0x00ff00);
        this.otherPlayers.set(id, sprite);
      } else {
        sprite.setPosition(pos.x, pos.y);
      }
    });

    // Remove players who left
    this.otherPlayers.forEach((sprite, id) => {
      if (!players[id]) {
        sprite.destroy();
        this.otherPlayers.delete(id);
      }
    });
  }
);

  }

  update() {
    if (!this.localPlayer || !this.socket) return;
    let moved = false;

    // Game update logic goes here
    if (this.cursors.left?.isDown) {
      this.localPlayer.setVelocityX(-160);
      this.localPlayer.anims.play("left", true);
      moved = true;
        
    } else if (this.cursors.right?.isDown) {
      this.localPlayer.setVelocityX(160);
      this.localPlayer.anims.play("right", true);
      moved = true;
     
    } else if (this.cursors.up?.isDown) {
      this.localPlayer.setVelocityY(-160);
      this.localPlayer.anims.play("up", true);
      moved = true;
     
    } else if (this.cursors.down?.isDown) {
      this.localPlayer.setVelocityY(160);
      this.localPlayer.anims.play("down", true);
      moved = true;

    } else {
      this.localPlayer.setVelocity(0, 0);
      this.localPlayer.anims.stop();
    }

    if (moved) {
    this.socket.emit("player:moved", {
      playerId: this.localPlayerId,
      position: { x: this.localPlayer.x, y: this.localPlayer.y },
    });
  }
  }

   private createAnimations() {
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
}

export default GameScene;