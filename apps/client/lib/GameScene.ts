import Game from "@/components/GameScene";
import { PlayersMap, usePlayersStore } from "@/store/playersStore";
import { Socket } from "socket.io-client";

class GameScene extends Phaser.Scene {
  private localPlayer!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private collisionGroup!: Phaser.Physics.Arcade.StaticGroup;
  private otherPlayers: Map<string, Phaser.Physics.Arcade.Sprite> = new Map();
  private socket!: Socket;
  private localPlayerId!: string;

  // Grid & movement
  private tileSize = 32;
  private isMoving = false;
  private moveDir = { x: 0, y: 0 }; // direction currently walking (-1/0/1)
  private targetPos = { x: 0, y: 0 }; // pixel target
  private moveSpeed = 160; // pixels per second
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

    // Local Player - spawn at top-left tile center (you can change spawn tile)
    // We'll place at tile (0,0) center: (tileSize/2, tileSize/2)
    this.localPlayer = this.physics.add.sprite(this.tileSize / 2, this.tileSize / 2, "player");
    this.localPlayer.setCollideWorldBounds(true);
    this.localPlayer.setOrigin(0.5, 0.5);
    this.cameras.main.startFollow(this.localPlayer, true);
    this.cameras.main.setZoom(1);

    // Add actual physics collider between player and collision group (prevents overlapping)
    this.physics.add.collider(this.localPlayer, this.collisionGroup);

    // Set up keyboard controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
    }

    // Player animations
    this.createAnimations();

    // Subscribe to Zustand store for remote players
    usePlayersStore.subscribe(
      (state) => state.players,
      (players: PlayersMap) => {
        Object.entries(players).forEach(([id, pos]) => {
          console.log(id,pos)
          if (id === this.localPlayerId) return;

          // Assume pos is grid coordinates {x: tileX, y: tileY}
          // Convert to pixel center positions
          const px = (pos.x ?? 0) * this.tileSize + this.tileSize / 2;
          const py = (pos.y ?? 0) * this.tileSize + this.tileSize / 2;

          let sprite = this.otherPlayers.get(id);
          if (!sprite) {
            sprite = this.physics.add.sprite(px, py, "player");
            sprite.setTint(0x00ff00);
            sprite.setOrigin(0.5, 0.5);
            console.log("sprite origin set to 0.5")
            this.otherPlayers.set(id, sprite);
          } else {
            console.log("sprite origin set to custom")
            sprite.setPosition(px, py);
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
    if (!this.localPlayer || !this.socket || !this.cursors) return;

    // Use actual delta for frame-rate independence
    const delta = this.game.loop.delta; // ms since last frame
    const step = (this.moveSpeed * delta) / 1000; // pixels to move this frame

    // If currently moving, continue interpolation toward target
    if (this.isMoving) {
      const dx = this.targetPos.x - this.localPlayer.x;
      const dy = this.targetPos.y - this.localPlayer.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > step) {
        const angle = Math.atan2(dy, dx);
        this.localPlayer.x += Math.cos(angle) * step;
        this.localPlayer.y += Math.sin(angle) * step;
      } else {
        // Reached target exactly
        this.localPlayer.x = this.targetPos.x;
        this.localPlayer.y = this.targetPos.y;
        this.isMoving = false;

        // Emit integer grid position (tile coords)
        const gridX = Math.round(this.localPlayer.x / this.tileSize - 0.5); // convert center to tile index
        const gridY = Math.round(this.localPlayer.y / this.tileSize - 0.5);
        this.socket.emit("player:move", {
          playerId: this.localPlayerId,
          position: { x: gridX, y: gridY },
        });

        // After finishing tile: if holding same direction, continue automatically
        this.handleContinuousMove();
      }

      return;
    }

    // If idle and a key is pressed, start movement (holding will continue)
    if (this.cursors.left?.isDown) {
      this.startMove(-1, 0, "left");
    } else if (this.cursors.right?.isDown) {
      this.startMove(1, 0, "right");
    } else if (this.cursors.up?.isDown) {
      this.startMove(0, -1, "up");
    } else if (this.cursors.down?.isDown) {
      this.startMove(0, 1, "down");
    } else {
      // idle - ensure animation stopped
      this.localPlayer.setVelocity(0, 0);
      this.localPlayer.anims.stop();
    }
  }

  // Start one tile move in direction dx,dy (dx/dy in -1/0/1)
  private startMove(dx: number, dy: number, anim: string) {
    if (this.isMoving) return;

    // compute next tile target in pixels (we keep positions as centers)
    const newX = this.localPlayer.x + dx * this.tileSize;
    const newY = this.localPlayer.y + dy * this.tileSize;

    // collision check: test target against collision objects
    if (this.isTileBlocked(newX, newY)) {
      // cannot start move; stop any animation
      this.localPlayer.anims.stop();
      return;
    }

    this.isMoving = true;
    this.moveDir = { x: dx, y: dy };
    this.targetPos = { x: newX, y: newY };
    this.localPlayer.anims.play(anim, true);
  }

  // If after finishing a tile the movement key is still held, continue in same dir
  private handleContinuousMove() {
    // Continue only if the same direction key is currently held
    if (this.moveDir.x === -1 && this.cursors.left?.isDown) {
      this.startMove(-1, 0, "left");
    } else if (this.moveDir.x === 1 && this.cursors.right?.isDown) {
      this.startMove(1, 0, "right");
    } else if (this.moveDir.y === -1 && this.cursors.up?.isDown) {
      this.startMove(0, -1, "up");
    } else if (this.moveDir.y === 1 && this.cursors.down?.isDown) {
      this.startMove(0, 1, "down");
    } else {
      // No continuation — stop anim
      this.localPlayer.anims.stop();
    }
  }

  // Check if the target pixel center (x,y) intersects any collision object.
  // We assume collisionObjects are rectangles (from Tiled). This checks tile-center against obj bbox.
  private isTileBlocked(px: number, py: number): boolean {
    // Convert center px/py to a simple point.
    for (const obj of this.collisionObjects) {
      const ox = obj.x ?? 0;
      const oy = obj.y ?? 0;
      const ow = obj.width ?? this.tileSize;
      const oh = obj.height ?? this.tileSize;

      // Tiled object origin: usually top-left (obj.x, obj.y). We'll treat as top-left.
      const left = ox;
      const top = oy;
      const right = ox + ow;
      const bottom = oy + oh;

      // px/py are centers, so check if center point lies within object rectangle
      if (px >= left && px <= right && py >= top && py <= bottom) {
        return true;
      }
    }

    // Additionally, check world bounds
    if (px - this.tileSize / 2 < 0 || py - this.tileSize / 2 < 0) return true;
    if (px + this.tileSize / 2 > this.map.widthInPixels || py + this.tileSize / 2 > this.map.heightInPixels) return true;

    return false;
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
