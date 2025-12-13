import { PlayersMap, usePlayersStore } from "@/store/playersStore";
import { Socket } from "socket.io-client";
import { getMapCollisionData } from "@/utils/getMapData";

class GameScene extends Phaser.Scene {

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private collisionGroup!: Phaser.Physics.Arcade.StaticGroup;
  private playerSprites: Map<string, Phaser.Physics.Arcade.Sprite> = new Map();
  private socket!: Socket;
  private localPlayerId!: string;

  // Grid & movement
  private tileSize = 32;
  private isMoving = false; // Used as a throttle
  private localGridPos: { x: number, y: number } | null = null; // Client-side authority
  private map!: Phaser.Tilemaps.Tilemap;
  private collisionObjects: Phaser.Types.Tilemaps.TiledObject[] = [];
  private playerBlockedIndices: Set<number> = new Set()
  private blockedIndices: Set<number> = new Set();

  constructor(socket: Socket, localPlayerId: string) {
    super({ key: "GameScene" });
    this.socket = socket;
    this.localPlayerId = localPlayerId;
  }

  preload() {
    // Load the tilemap JSON
    this.load.tilemapTiledJSON("map", "/megacity.json");
    // Load tileset images
    this.load.image("tileset", "/tileset.png");
    // this.load.image("objects", "/objects.png");
    this.load.spritesheet("player", "/player2.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
  }

  create() {
    // Create the tilemap from the loaded JSON
    this.map = this.make.tilemap({ key: "map" });

    // Load collision data from the shared utility
    const collisionData = getMapCollisionData();
    this.blockedIndices = new Set(collisionData.blockedTileIndices);

    // load tilesets , first :tileset name(must match with tilemap json), second :image name
    const tileSet = this.map.addTilesetImage("tileset", "tileset")

    // Create layers with proper depth ordering
    let groundLayer, decorsLayer, objectsLayer;

    if (tileSet) {
      // Layer 1: Ground - where user walks (depth 0)
      groundLayer = this.map.createLayer("ground", tileSet);
      if (groundLayer) {
        groundLayer.setDepth(0);
      }

      // Layer 2: Decor - decorative elements (depth 1)
      decorsLayer = this.map.createLayer("decors", tileSet);
      if (decorsLayer) {
        decorsLayer.setDepth(0);
      }

      // Layer 3: Objects - tall objects like buildings (depth 2)
      objectsLayer = this.map.createLayer("objects", tileSet);
      if (objectsLayer) {
        objectsLayer.setDepth(3);
      }
    } else {
      console.error("Tileset not found");
    }

    // Set camera and physics world bounds to match the map
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

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

          if (!this.playerSprites) return;

          let sprite = this.playerSprites.get(id);

          if (!sprite) {
            // --- Player doesn't exist, CREATE them ---
            sprite = this.physics.add.sprite(targetPx, targetPy, "player");
            sprite.setOrigin(0.5, 0.5);
            sprite.setCollideWorldBounds(true); // Prevent going out of bounds

            // Set depth to 1.5 so player appears between decors (1) and objects (2)
            // This allows players to walk behind tall objects like buildings
            sprite.setDepth(1.5);

            // Add collision with the collision group to prevent walking through objects
            this.physics.add.collider(sprite, this.collisionGroup);

            this.playerSprites.set(id, sprite);

            if (id === this.localPlayerId) {
              sprite.setTint(0xccffcc); // Light green tint
              // Configure camera to smoothly follow the local player
              this.cameras.main.startFollow(sprite, true, 0.2, 0.2);
              this.cameras.main.setZoom(2);
              this.cameras.main.roundPixels = true;

              // Initialize local authority position
              this.localGridPos = { x: pos.x ?? 0, y: pos.y ?? 0 };
            } else {
              sprite.setTint(0xffcc00); // Yellow tint for others
            }
          } else {
            // --- Player exists, ANIMATE them to the new position ---

            // OPTIMISTIC MOVE CHANGE:
            // For the local player, we typically ignore server updates to avoid stutter.
            // HOWEVER, we must check for "Rejection" or "Desync".
            if (id === this.localPlayerId) {
              // Server Reconciliation:
              // If our local position is too far from what the server thinks, 
              // the server likely rejected our move (e.g. anti-cheat, collision we missed).
              // We "Snap Back" to the server's truth.
              const serverX = pos.x ?? 0;
              const serverY = pos.y ?? 0;
              const localX = this.localGridPos?.x ?? 0;
              const localY = this.localGridPos?.y ?? 0;

              const dist = Math.abs(serverX - localX) + Math.abs(serverY - localY);

              if (dist > 0) {
                // > 1 tile difference means we are desynced. Snap back.
                console.warn("Reconciliation: Snapping back to server position", { server: pos, local: this.localGridPos });

                this.localGridPos = { x: serverX, y: serverY };

                // Stop existing tweens to prevent fighting
                this.tweens.killTweensOf(sprite);

                // Teleport immediately
                sprite.setPosition(targetPx, targetPy);
                if (sprite && sprite.anims) {
                  sprite.anims.stop();
                }
                this.isMoving = false; // Unlock movement
              }

              // Always return here so we don't double-animate
              return;
            }

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

    // Throttle: If we are currently tweening to the next tile, wait.
    if (this.isMoving) {
      return;
    }

    let targetX: number | null = null;
    let targetY: number | null = null;
    let direction = "";

    // Use LOCAL state, not the store state
    if (!this.localGridPos) return;

    // Check for key presses
    if (this.cursors.left?.isDown) {
      targetX = this.localGridPos.x - 1;
      targetY = this.localGridPos.y;
      direction = "left";
    } else if (this.cursors.right?.isDown) {
      targetX = this.localGridPos.x + 1;
      targetY = this.localGridPos.y;
      direction = "right";
    } else if (this.cursors.up?.isDown) {
      targetX = this.localGridPos.x;
      targetY = this.localGridPos.y - 1;
      direction = "up";
    } else if (this.cursors.down?.isDown) {
      targetX = this.localGridPos.x;
      targetY = this.localGridPos.y + 1;
      direction = "down";
    }

    // If a key is pressed, process the move IMMEDIATELY (Optimistic)
    if (targetX !== null && targetY !== null) {

      // COLLISION CHECK:
      // Don't walk into walls (Objects layer) or other players
      if (!this.isTileWalkable(targetX, targetY) || this.isTileOccupiedByPlayer(targetX, targetY)) {
        // If we hit a wall or another player, stop the animation
        const sprite = this.playerSprites.get(this.localPlayerId);
        if (sprite && sprite.anims.isPlaying) {
          sprite.anims.stop();
        }
        return;
      }



      this.isMoving = true;

      // 1. Update local state immediately
      this.localGridPos = { x: targetX, y: targetY };

      // 2. Send to server
      this.socket.emit("player:move", {
        position: { x: targetX, y: targetY },
      });

      // 3. Helper to get pixel coordinates
      const targetPx = targetX * this.tileSize + this.tileSize / 2;
      const targetPy = targetY * this.tileSize + this.tileSize / 2;

      const sprite = this.playerSprites.get(this.localPlayerId);
      if (!sprite) {
        this.isMoving = false;
        return;
      }

      // 4. Animate and Tween Locallly
      if (direction === "left") sprite.anims.play("left", true);
      else if (direction === "right") sprite.anims.play("right", true);
      else if (direction === "up") sprite.anims.play("up", true);
      else if (direction === "down") sprite.anims.play("down", true);

      this.tweens.add({
        targets: sprite,
        x: targetPx,
        y: targetPy,
        duration: 180, // Keep speed consistent
        ease: 'Linear',
        onComplete: () => {
          // Logic for continuous movement
          const cursors = this.cursors;
          if (
            !cursors.left?.isDown &&
            !cursors.right?.isDown &&
            !cursors.up?.isDown &&
            !cursors.down?.isDown
          ) {
            // Keys released -> stop
            this.isMoving = false;
            sprite.anims.stop();
          } else {
            // Keys held -> keep going immediately
            this.isMoving = false;
            this.update(); // Recursively trigger next move
          }
        }
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

  private isTileWalkable(x: number, y: number): boolean {
    // 1. Check bounds
    if (x < 0 || y < 0 || x >= this.map.width || y >= this.map.height) {
      return false;
    }
    // 2. Check collision set using shared logic
    const index = y * this.map.width + x;
    return !this.blockedIndices.has(index);
  }

  private isTileOccupiedByPlayer(x: number, y: number): boolean {
    // Get current player positions from the store
    const players = usePlayersStore.getState().players;

    // Check if any player (except the local player) is at this position
    for (const [playerId, pos] of Object.entries(players)) {
      // Skip checking against ourselves
      if (playerId === this.localPlayerId) {
        continue;
      }

      // Check if this player is at the target position
      if (pos.x === x && pos.y === y) {
        return true;
      }
    }

    return false;
  }

}

export default GameScene;
