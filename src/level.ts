import * as BABYLON from "babylonjs";
import { Bubble } from "./bubble";
import { BubbleFactory } from "./bubbleFactory";
import { clamp } from "./utilities";

const LEVEL_WIDTH = 4;
const LEVEL_DEPTH = 4;
const LEVEL_LAYERS = 5;
const WALL_THICKNESS = 0.1;

const xOffset = 0.5;
const zOffset = 0.5;

export class Level {
  //private bubbleFactory: BubbleFactory;

  private lattice: Map<string, Bubble>;
  private level: BABYLON.Mesh;

  public static belowBaseline(bubble: Bubble): boolean {
    return bubble.getMesh().position.y <= 0;
  }

  constructor() {
    this.lattice = new Map();
  }

  private dispose() {
    if (this.level) {
      this.level.physicsImpostor.dispose();
      this.level.dispose(false, true);
      this.level = null;
    }

    for (const bubble of this.lattice.values()) {
      if (bubble) {
        bubble.dispose();
      }
    }

    this.lattice.clear();
  }

  public create(scene: BABYLON.Scene) {
    this.dispose();

    const material = new BABYLON.StandardMaterial("level.material", scene);
    material.diffuseColor = BABYLON.Color3.White();

    interface Wall {
      height: number;
      width: number;
      depth: number;
      position: BABYLON.Vector3;
    }

    const walls: Wall[] = [
      {
        height: LEVEL_LAYERS,
        width: WALL_THICKNESS,
        depth: LEVEL_DEPTH * 2,
        position: new BABYLON.Vector3(
          -LEVEL_WIDTH - xOffset,
          0,
          WALL_THICKNESS * 0.5 - zOffset
        )
      },
      {
        height: LEVEL_LAYERS,
        width: LEVEL_DEPTH * 2,
        depth: WALL_THICKNESS,
        position: new BABYLON.Vector3(
          -WALL_THICKNESS * 0.5 - xOffset,
          0,
          -LEVEL_DEPTH - zOffset
        )
      },
      {
        height: LEVEL_LAYERS,
        width: LEVEL_WIDTH * 2,
        depth: WALL_THICKNESS,
        position: new BABYLON.Vector3(
          WALL_THICKNESS * 0.5 - xOffset,
          0,
          LEVEL_DEPTH - zOffset
        )
      },
      {
        height: LEVEL_LAYERS,
        width: WALL_THICKNESS,
        depth: LEVEL_DEPTH * 2,
        position: new BABYLON.Vector3(
          LEVEL_WIDTH - xOffset,
          0,
          -WALL_THICKNESS * 0.5 - zOffset
        )
      }
    ];

    const level = new BABYLON.Mesh("level", scene);

    walls.forEach((wall, index) => {
      var mesh = BABYLON.MeshBuilder.CreateBox(`level.${index}`, wall, scene);
      mesh.position.set(wall.position.x, LEVEL_LAYERS * 0.5, wall.position.z);
      mesh.visibility = 0.5;

      const imposter = new BABYLON.PhysicsImpostor(
        mesh,
        BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 0, damping: 0, friction: 0, restitution: 0 },
        scene
      );

      mesh.physicsImpostor = imposter;
      mesh.checkCollisions = true;

      level.addChild(mesh);
    });

    const impostor = new BABYLON.PhysicsImpostor(
      level,
      BABYLON.PhysicsImpostor.NoImpostor,
      { mass: 0, damping: 0, friction: 0, restitution: 1 },
      scene
    );
    level.physicsImpostor = impostor;
    level.checkCollisions = true;

    this.level = level;
  }

  public getBubbles(): Bubble[] {
    const bubbles: Bubble[] = [];
    for (const value of this.lattice.values()) {
      if (value) {
        bubbles.push(value);
      }
    }
    return bubbles;
  }

  public getBubbleImposters() {
    const imposters: BABYLON.PhysicsImpostor[] = [];

    for (const bubble of this.getBubbles()) {
      imposters.push(bubble.getImposter());
    }

    return imposters;
  }

  public getLocalBubblesOfColor(bubble: Bubble) {
    const dirs = [
      BABYLON.Vector3.Left(),
      BABYLON.Vector3.Right(),
      BABYLON.Vector3.Down(),
      BABYLON.Vector3.Up()
    ];

    const localWithColor = new Set<Bubble>();
    /*
    const searchAround = (bub: Bubble) => {
      if (bub.getColor() !== bubble.getColor()) {
        return;
      }

      if (localWithColor.has(bub)) {
        return;
      }
      localWithColor.add(bub);

      const coords = this.getKeyBubble(bub);
      if (!coords) {
        return;
      }

      for (const dir of dirs) {
        const coordDir = coords.add(dir);
        const coordBubble = this.getBubble(coordDir);
        if (coordBubble) {
          searchAround(coordBubble);
        }
      }
    };

    searchAround(bubble);
*/
    return Array.from(localWithColor.values());
  }

  public insertBubble(bubble: Bubble) {
    const position = bubble.getMesh().position;
    const x = Math.round(position.x);
    const y = Math.round(position.y);
    const z = Math.round(position.z);

    const imposter = bubble.getImposter();
    imposter.setMass(0);

    position.x = x;
    position.y = y;
    position.z = z;

    this.lattice.set(this.getKey(x, y, z), bubble);
    return true;
  }

  private getKey(x: number, y: number, z: number) {
    x = clamp(x, -LEVEL_WIDTH, LEVEL_WIDTH);
    y = clamp(y, 0, LEVEL_LAYERS);
    z = clamp(z, -LEVEL_DEPTH, LEVEL_DEPTH);
    return `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
  }

  public removeBubble(bubble: Bubble) {
    for (const [key, value] of this.lattice.entries()) {
      if (bubble === value) {
        this.lattice.delete(key);
      }
    }
  }

  public insertNextLayer(bubbleFactory: BubbleFactory) {
    function place(bubble: Bubble, x: number, y: number, z: number) {
      if (!bubble) {
        return;
      }
      const { position } = bubble.getMesh();

      position.x = x;
      position.z = z;
      position.y = y;
    }

    // Clear any bubbles at base layer
    for (let x = -LEVEL_WIDTH; x < LEVEL_WIDTH; x++) {
      for (let z = -LEVEL_DEPTH; z < LEVEL_DEPTH; z++) {
        const key = this.getKey(x, 0, z);
        const bubble = this.lattice.get(key);

        if (bubble) {
          bubble.dispose();
          this.lattice.delete(key);
        }
      }
    }

    // Increment all bubbles through inner layers
    for (let y = 0; y < LEVEL_LAYERS; y++) {
      for (let x = -LEVEL_WIDTH; x < LEVEL_WIDTH; x++) {
        for (let z = -LEVEL_DEPTH; z < LEVEL_DEPTH; z++) {
          const keySrc = this.getKey(x, y + 1, z);
          const keyDest = this.getKey(x, y, z);

          const bubble = this.lattice.get(keySrc);
          if (bubble) {
            this.lattice.set(keyDest, bubble);
          }
          this.lattice.set(keySrc, null);

          place(bubble, x, y, z);
        }
      }
    }

    // Insert new bubbles at top layer
    for (let x = -LEVEL_WIDTH; x < LEVEL_WIDTH; x++) {
      for (let z = -LEVEL_DEPTH; z < LEVEL_DEPTH; z++) {
        const key = this.getKey(x, LEVEL_LAYERS - 1, z);
        const bubble = bubbleFactory.createBubble();

        bubble.getImposter().setMass(0);

        this.lattice.set(key, bubble);
        place(bubble, x, LEVEL_LAYERS, z);
      }
    }
  }
}
