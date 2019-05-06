import * as BABYLON from "babylonjs";
import { Bubble } from "./bubble";
import { BubbleFactory } from "./bubbleFactory";

const LEVEL_WIDTH = 5;
const LEVEL_DEPTH = 5;
const LEVEL_LAYERS = 10;
const WALL_THICKNESS = 0.1;

enum LayerType {
  Inner,
  Outer
}

interface Layer {
  bubbles: Bubble[];
  type: LayerType;
}

export class Level {
  private layers: Layer[];
  private bubbleFactory: BubbleFactory;

  constructor(scene: BABYLON.Scene, bubbleFactory: BubbleFactory) {
    this.layers = [];
    this.bubbleFactory = bubbleFactory;

    this.create(scene);
  }

  public create(scene: BABYLON.Scene) {
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
        depth: LEVEL_DEPTH,
        position: new BABYLON.Vector3(
          -0.5 * LEVEL_WIDTH,
          0,
          0.5 * WALL_THICKNESS
        )
      },
      {
        height: LEVEL_LAYERS,
        width: LEVEL_DEPTH,
        depth: WALL_THICKNESS,
        position: new BABYLON.Vector3(
          -0.5 * WALL_THICKNESS,
          0,
          -0.5 * LEVEL_DEPTH
        )
      },
      {
        height: LEVEL_LAYERS,
        width: LEVEL_WIDTH,
        depth: WALL_THICKNESS,
        position: new BABYLON.Vector3(
          0.5 * WALL_THICKNESS,
          0,
          0.5 * LEVEL_DEPTH
        )
      },
      {
        height: LEVEL_LAYERS,
        width: WALL_THICKNESS,
        depth: LEVEL_DEPTH,
        position: new BABYLON.Vector3(
          0.5 * LEVEL_WIDTH,
          0,
          -0.5 * WALL_THICKNESS
        )
      }
    ];

    const level = new BABYLON.Mesh("level", scene);

    for (const wall of walls) {
      var mesh = BABYLON.MeshBuilder.CreateBox("level.left", wall, scene);
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
    }

    const impostor = new BABYLON.PhysicsImpostor(
      level,
      BABYLON.PhysicsImpostor.NoImpostor,
      { mass: 0, damping: 0, friction: 0, restitution: 1 },
      scene
    );
    level.physicsImpostor = impostor;
    level.checkCollisions = true;
  }

  public getBubbleImposters() {
    const imposters: BABYLON.PhysicsImpostor[] = [];

    for (const layer of this.layers) {
      for (const bubble of layer.bubbles) {
        imposters.push(bubble.getImposter());
      }
    }

    return imposters;
  }

  public step() {
    /**
     * // Iterate all bubbles in game board
    for (let k = LEVEL_HEIGHT - 1 - 1; k >= 0; k--) {
      for (let i = 0; i < LEVEL_WIDTH; i++) {
        for (let j = 0; j < LEVEL_DEPTH; j++) {
          const idxSrc = this.getBubbleIndex(i, j, k);
          const idxDst = this.getBubbleIndex(i, j, k + 1);

          const bubble = this.bubbles[idxSrc];

          if (bubble) {
            const mesh = bubble.getMesh();
            mesh.position.y = mesh.position.y - 1;
          }

          this.bubbles[idxDst] = bubble;
        }
      }
    }

    // Populate next leve of bubbles
    for (let i = 0; i < LEVEL_WIDTH; i++) {
      for (let j = 0; j < LEVEL_DEPTH; j++) {
        const x = i - LEVEL_WIDTH / 2;
        const z = j - LEVEL_DEPTH / 2;

        const bubble = this.bubbleFactory.createBubble();
        const mesh = bubble.getMesh();
        mesh.position.y = LEVEL_HEIGHT;
        mesh.position.x = x + 0.5;
        mesh.position.z = z + 0.5;

        this.bubbles[this.getBubbleIndex(i, j, 0)] = bubble;
      }
    }
     */
  }

  private shiftLayers() {
    for (const layer of this.layers) {
      for (const bubble of layer.bubbles) {
        const mesh = bubble.getMesh();
        mesh.position.addInPlace(BABYLON.Vector3.Down());
      }
    }
  }

  public insertNextLayer() {
    this.shiftLayers();

    const type =
      this.layers.length > 0 && this.layers[0].type === LayerType.Inner
        ? LayerType.Outer
        : LayerType.Inner;

    const bubbles: Bubble[] = [];

    const nWidth = LEVEL_WIDTH - (type === LayerType.Inner ? 1 : 0);
    const nDepth = LEVEL_DEPTH - (type === LayerType.Inner ? 1 : 0);

    const xOffset = type === LayerType.Inner ? 1 : 0.5;
    const zOffset = type === LayerType.Inner ? 1 : 0.5;

    for (let w = 0; w < nWidth; w++) {
      for (let d = 0; d < nDepth; d++) {
        const bubble = this.bubbleFactory.createBubble();

        const imposter = bubble.getImposter();
        imposter.setMass(0);

        const mesh = bubble.getMesh();
        const x = w + xOffset - LEVEL_WIDTH * 0.5;
        const z = d + zOffset - LEVEL_DEPTH * 0.5;

        mesh.position.set(x, LEVEL_LAYERS, z);

        bubbles.push(bubble);
      }
    }

    const layer: Layer = {
      type,
      bubbles
    };

    this.layers.unshift(layer);
  }
}
