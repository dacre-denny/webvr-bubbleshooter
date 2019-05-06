import * as BABYLON from "babylonjs";
import { Bubble } from "./bubble";
import { BubbleFactory } from "./bubbleFactory";
import { Layer } from "babylonjs";

const LEVEL_WIDTH = 5;
const LEVEL_DEPTH = 5;
const LEVEL_LAYERS = 10;
const WALL_THICKNESS = 0.1;

enum LayerType {
  Inner,
  Outer
}

// interface Layer {
//   bubbles: Bubble[];
//   type: LayerType;
// }

export class Level {
  private bubbles: Bubble[];
  private bubbleFactory: BubbleFactory;
  private type: LayerType;

  constructor(scene: BABYLON.Scene, bubbleFactory: BubbleFactory) {
    this.type = LayerType.Inner;
    this.bubbles = [];
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

    for (const bubble of this.bubbles) {
      imposters.push(bubble.getImposter());
    }

    return imposters;
  }

  public getLocalBubblesWithSameColor(bubble: Bubble) {
    // const bubbleLayerIdx = this.layers.findIndex(layer =>
    //   layer.bubbles.includes(bubble)
    // );
    // if (bubbleLayerIdx < 0) {
    //   return;
    // }
  }

  public onBubbleCollide(bubble: Bubble) {
    const position = bubble.getMesh().position;
    const [x, y, z] = position.asArray().map(Math.floor);

    // Assumes vertical step amount is 1.0
    const type = y % 2 === 0 ? LayerType.Inner : LayerType.Outer;

    const imposter = bubble.getImposter();
    const mesh = bubble.getMesh();

    imposter.setMass(0);

    if (type === LayerType.Inner) {
      mesh.position.set(x + 0.5, y, z + 0.5);
    } else {
      mesh.position.set(x, y, z);
    }

    this.bubbles.push(bubble);
  }

  private shiftLayers() {
    for (const bubble of this.bubbles) {
      const mesh = bubble.getMesh();
      mesh.position.addInPlace(BABYLON.Vector3.Down());
    }
  }

  public anyBubblesBeyondBaseline() {
    return this.bubbles.some(bubble => {
      return bubble.getMesh().position.y < 0;
    });
  }

  public insertNextLayer() {
    this.shiftLayers();

    const nWidth = LEVEL_WIDTH - (this.type === LayerType.Inner ? 1 : 0);
    const nDepth = LEVEL_DEPTH - (this.type === LayerType.Inner ? 1 : 0);

    const xOffset = this.type === LayerType.Inner ? 1 : 0.5;
    const zOffset = this.type === LayerType.Inner ? 1 : 0.5;

    for (let w = 0; w < nWidth; w++) {
      for (let d = 0; d < nDepth; d++) {
        const bubble = this.bubbleFactory.createBubble();

        const imposter = bubble.getImposter();
        imposter.setMass(0);

        const mesh = bubble.getMesh();
        const x = w + xOffset - LEVEL_WIDTH * 0.5;
        const z = d + zOffset - LEVEL_DEPTH * 0.5;

        mesh.position.set(x, LEVEL_LAYERS, z);

        this.bubbles.push(bubble);
      }
    }

    // const layer: Layer = {
    //   type,
    //   bubbles
    // };

    this.type =
      this.type === LayerType.Inner ? LayerType.Outer : LayerType.Inner;
  }
}
