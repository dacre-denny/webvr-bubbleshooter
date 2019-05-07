import * as BABYLON from "babylonjs";
import { Bubble } from "./bubble";
import { BubbleFactory } from "./bubbleFactory";

const LEVEL_WIDTH = 8;
const LEVEL_DEPTH = 8;
const LEVEL_LAYERS = 10;
const WALL_THICKNESS = 0.1;

enum LayerType {
  Inner,
  Outer
}

class Layer {
  public bubbles: Bubble[];
  public type: LayerType;
  public level: number;

  constructor(level: number) {
    this.bubbles = [];
    this.level = level;
  }

  public stepDown() {
    this.level--;

    for (const bubble of this.bubbles) {
      const mesh = bubble.getMesh();
      mesh.position.y = this.level;
    }
  }
}

export class Level {
  //private bubbles: Bubble[];
  private bubbleFactory: BubbleFactory;

  private lattice: Layer[];

  constructor(scene: BABYLON.Scene, bubbleFactory: BubbleFactory) {
    this.lattice = [];
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

  public *getBubbles() {
    for (const layer of this.lattice) {
      for (const bubble of layer.bubbles) {
        yield bubble;
      }
    }
  }

  public getBubbleImposters() {
    const imposters: BABYLON.PhysicsImpostor[] = [];

    for (const bubble of this.getBubbles()) {
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
    /*
    const intPosition = new BABYLON.Vector3(
      position.x - Math.floor(position.x) > 0.5
      ? Math.ceil(position.x)
      : Math.floor(position.x),
      position.y - Math.floor(position.y) > 0.5
      ? Math.ceil(position.y)
        : Math.floor(position.y),
        position.z - Math.floor(position.z) > 0.5
        ? Math.ceil(position.z)
        : Math.floor(position.z)
        );
        */
    const imposter = bubble.getImposter();
    const mesh = bubble.getMesh();
    const position = mesh.position;

    imposter.setMass(0);
    /*
    if (type === LayerType.Inner) {
      mesh.position.set(
        intPosition.x + 0.5,
        intPosition.y,
        intPosition.z + 0.5
      );
    } else {
      mesh.position.set(intPosition.x, intPosition.y, intPosition.z);
    }
    */
  }

  public anyBubblesBeyondBaseline() {
    for (const layer of this.lattice) {
      if (layer.level <= 0) {
        return true;
      }
    }

    return false;
  }

  public insertNextLayer() {
    // Step all layers
    for (const layer of this.lattice) {
      layer.stepDown();
    }

    const type =
      this.lattice.length > 0
        ? this.lattice[0].type === LayerType.Outer
          ? LayerType.Inner
          : LayerType.Outer
        : LayerType.Outer;
    const nWidth = LEVEL_WIDTH - (type === LayerType.Inner ? 1 : 0);
    const nDepth = LEVEL_DEPTH - (type === LayerType.Inner ? 1 : 0);

    const xOffset = type === LayerType.Inner ? 1 : 0.5;
    const zOffset = type === LayerType.Inner ? 1 : 0.5;

    const layer = new Layer(LEVEL_LAYERS);

    for (let w = 0; w < nWidth; w++) {
      for (let d = 0; d < nDepth; d++) {
        const bubble = this.bubbleFactory.createBubble();

        const imposter = bubble.getImposter();
        imposter.setMass(0);

        const mesh = bubble.getMesh();
        const x = w + xOffset - LEVEL_WIDTH * 0.5;
        const z = d + zOffset - LEVEL_DEPTH * 0.5;

        mesh.position.set(x, LEVEL_LAYERS, z);

        layer.bubbles.push(bubble);
      }
    }

    this.lattice.unshift(layer);
  }
}
