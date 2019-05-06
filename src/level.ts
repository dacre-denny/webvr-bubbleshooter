import * as BABYLON from "babylonjs";
import { Bubble } from "./bubble";
import { BubbleFactory } from "./bubbleFactory";

const LEVEL_WIDTH = 5;
const LEVEL_DEPTH = 5;
const LEVEL_LAYERS = 10;

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
    material.alpha = 0.5;

    var left = BABYLON.MeshBuilder.CreateBox(
      "left",
      {
        height: LEVEL_LAYERS,
        width: 0.1,
        depth: LEVEL_DEPTH
      },
      scene
    );
    left.position.set(-0.5 * LEVEL_WIDTH, 0, 0.05);
    left.visibility = 0.5;

    var front = BABYLON.MeshBuilder.CreateBox(
      "front",
      {
        height: LEVEL_LAYERS,
        width: LEVEL_DEPTH,
        depth: 0.1
      },
      scene
    );

    front.position.set(-0.05, 0, -0.5 * LEVEL_DEPTH);
    front.visibility = 0.5;
    var back = BABYLON.MeshBuilder.CreateBox(
      "back",
      {
        height: LEVEL_LAYERS,
        width: LEVEL_DEPTH,
        depth: 0.1
      },
      scene
    );

    back.position.set(0.05, 0, 0.5 * LEVEL_DEPTH);
    back.visibility = 0.5;

    var right = BABYLON.MeshBuilder.CreateBox(
      "right",
      {
        height: LEVEL_LAYERS,
        width: 0.1,
        depth: LEVEL_DEPTH
      },
      scene
    );
    right.position.set(0.5 * LEVEL_WIDTH, 0, -0.05);
    right.visibility = 0.5;

    const sides = [front, left, back, right];

    const bounds = new BABYLON.Mesh("bound", scene);

    for (const side of sides) {
      side.position.y += LEVEL_LAYERS * 0.5;
      bounds.addChild(side);
    }

    for (const side of sides) {
      side.physicsImpostor = new BABYLON.PhysicsImpostor(
        side,
        BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 0, damping: 0, friction: 0, restitution: 0 },
        scene
      );
      side.checkCollisions = true;
    }

    bounds.physicsImpostor = new BABYLON.PhysicsImpostor(
      bounds,
      BABYLON.PhysicsImpostor.NoImpostor,
      { mass: 0, damping: 0, friction: 0, restitution: 1 },
      scene
    );
    bounds.checkCollisions = true;

    //boundary = bounds;
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
