import Game from "@/components/GameScene";
import { PlayersMap, usePlayersStore } from "@/store/playersStore";
import { Socket } from "socket.io-client";
import { gameEmitter } from '@/lib/GameEmitter';

class GameScene extends Phaser.Scene {

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private collisionGroup!: Phaser.Physics.Arcade.StaticGroup;
  private playerSprites: Map<string, Phaser.Physics.Arcade.Sprite> = new Map();
  private socket!: Socket;
  private localPlayerId!: string;

  // Grid & movement
  private tileSize = 32;
  private isMoving = false; // Used as a throttle
  private lastMoveIntentTime = 0;
  private moveIntentCooldown = 200;
  private map!: Phaser.Tilemaps.Tilemap;
  private collisionObjects: Phaser.Types.Tilemaps.TiledObject[] = [];

  constructor(socket: Socket, localPlayerId: string) {
    super({ key: "GameScene" });
    this.socket = socket;
    this.localPlayerId = localPlayerId;
  }

  preload() {
    // Load the tilemap JSON
    this.load.tilemapTiledJSON("village", "/village_map.json");
    // Load tileset images
    this.load.image("grass", "/grass_img.png");
    this.load.image("objects", "/objects.png");
    this.load.spritesheet("player", "/player2.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
  }

  create() {
    // Create the tilemap from the loaded JSON
    this.map = this.make.tilemap({ key: "village" });

    // load tilesets (names must match the Tiled tileset names)
    const objectTileset = this.map.addTilesetImage("map", "objects");
    const grassTileset = this.map.addTilesetImage("grass_img", "grass");
    const validLayerNames = this.map.getTileLayerNames();

    if (grassTileset && objectTileset && validLayerNames.includes("grass_layer")) {
      this.map.createLayer("grass_layer", grassTileset);
      this.map.createLayer("top_layer", objectTileset);
    } else {
      console.error("Layer ground or objects does not exist in tilemap");
    }

    // camera bounds
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    // Create collision objects (from object layer "collisions")
    const collisionsLayer = this.map.getObjectLayer("collisions");
    this.collisionGroup = this.physics.add.staticGroup();

    if (collisionsLayer && collisionsLayer.objects) {
      this.collisionObjects = collisionsLayer.objects;
      // create invisible static bodies for physics collisions (optional)
      collisionsLayer.objects.forEach((obj) => {
        // Tiled object coordinates may treat y as bottom or top; use width/height and center
        const cx = obj.x! + (obj.width ? obj.width / 2 : 0);
        const cy = obj.y! + (obj.height ? obj.height / 2 : 0);
        const w = obj.width ?? this.tileSize;
        const h = obj.height ?? this.tileSize;
        const collisionBox = this.collisionGroup.create(cx, cy, "") as Phaser.Physics.Arcade.Sprite;
        collisionBox.setOrigin(0.5, 0.5);
        collisionBox.setSize(w, h);
        collisionBox.setVisible(false);
        // offset if required (we used origin center)
        collisionBox.setOffset(-(w / 2), -(h / 2));
      });
    } else {
      console.warn("No collision layer found in tilemap.");
    }

    // Set up keyboard controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
    }

    // Player animations
    this.createAnimations();



// Subscribe to Zustand store for ALL players
usePlayersStore.subscribe(
  (state) => state.players,
  (players: PlayersMap) => {
    Object.entries(players).forEach(([id, pos]) => {
      // Convert grid position to pixel center position
      const targetPx = (pos.x ?? 0) * this.tileSize + this.tileSize / 2;
      const targetPy = (pos.y ?? 0) * this.tileSize + this.tileSize / 2;

      let sprite = this.playerSprites.get(id);
      console.log("sprite", sprite)
      if (!sprite) {
        // --- Player doesn't exist, CREATE them ---
        console.log("creating sprite",targetPx,targetPy, id)
        sprite = this.physics.add.sprite(targetPx, targetPy, "player");
        sprite.setOrigin(0.5, 0.5);
        this.playerSprites.set(id, sprite);

        if (id === this.localPlayerId) {
          sprite.setTint(0xccffcc); // Light green tint
          this.cameras.main.startFollow(sprite, true);
          this.cameras.main.setZoom(1);
        } else {
          sprite.setTint(0xffcc00); // Yellow tint for others
        }
      } else {
        // --- Player exists, ANIMATE them to the new position ---
        // Calculate direction for animation (except for local player)
    
          const dx = targetPx - sprite.x;
          const dy = targetPy - sprite.y;

          if (dx > 0) sprite.anims.play("right", true);
          else if (dx < 0) sprite.anims.play("left", true);
          else if (dy > 0) sprite.anims.play("down", true);
          else if (dy < 0) sprite.anims.play("up", true);
        
        const isAlreadyAtTarget = (sprite.x === targetPx && sprite.y === targetPy);
        // Create the tween
        this.tweens.add({
          targets: sprite,
          x: targetPx,
          y: targetPy,
          duration: 180, 
          ease: 'Linear',
          onComplete: () => {
            // If it's not the local player, stop their animation
            if (id !== this.localPlayerId) {
             // Add a check here too for safety
              if (sprite && sprite.anims) {
                sprite.anims.stop();
              }
            }

            // If this is the local player, reset the 'isMoving' throttle
            if (id === this.localPlayerId) {
              if (!sprite) {
                console.log("No spriote")
                return
              };
              // Check if a key is *still* held down
              const cursors = this.cursors;
              if (
                !cursors.left?.isDown &&
                !cursors.right?.isDown &&
                !cursors.up?.isDown &&
                !cursors.down?.isDown
              ) {
                // --- THIS IS THE FIX ---
                // Keys are up, so stop the animation and unlock movement
                this.isMoving = false;
                if (sprite && sprite.anims) {
                  sprite.anims.stop(); // <-- Add this line
                }
              } else {
                // Key is still held, immediately allow next move
                this.isMoving = false;
                // We must call update manually once to trigger
                // the next "held key" movement
                this.update(); 
              }
            }
          }
        });
      }
    });

    // --- Remove players who left ---
    this.playerSprites.forEach((sprite, id) => {
      if (!players[id]) {
        sprite.destroy();
        this.playerSprites.delete(id);
      }
    });
  },
  // This equality check is important for performance
  {
    fireImmediately: true
  }
);
  }

 update() {
  if (!this.socket || !this.cursors) return;

  // --- This is the key change ---
  // If we are 'moving' (waiting for a server response), don't send new requests.
  if (this.isMoving) {
    console.log("yes moving")
    return;
  }

  let targetX: number | null = null;
  let targetY: number | null = null;
  let direction = "";

  // Get the local player's CURRENT grid position from the store
  const allPlayers = usePlayersStore.getState().players;
  const localPlayerPos = allPlayers[this.localPlayerId];

  if (!localPlayerPos) return; // Local player isn't in the store yet

  // Check for key presses
  if (this.cursors.left?.isDown) {
    targetX = localPlayerPos.x - 1;
    targetY = localPlayerPos.y;
    direction = "left";
  } else if (this.cursors.right?.isDown) {
    targetX = localPlayerPos.x + 1;
    targetY = localPlayerPos.y;
    direction = "right";
  } else if (this.cursors.up?.isDown) {
    targetX = localPlayerPos.x;
    targetY = localPlayerPos.y - 1;
    direction = "up";
  } else if (this.cursors.down?.isDown) {
    targetX = localPlayerPos.x;
    targetY = localPlayerPos.y + 1;
    direction = "down";
  }

  // If a key is pressed, send the move event
  if (targetX !== null && targetY !== null) {
    // Set throttle. We are now 'moving' and waiting for the server.
    this.isMoving = true;

    // Send the event your server is listening for
    this.socket.emit("player:move", {
      position: { x: targetX, y: targetY },
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
