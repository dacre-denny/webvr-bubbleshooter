import * as BABYLON from "babylonjs";
import { Bubble } from "./bubble";
import { BubbleFactory } from "./bubbleFactory";

const LEVEL_WIDTH = 8;
const LEVEL_DEPTH = 8;
const LEVEL_LAYERS = 10;
const WALL_THICKNESS = 0.1;

export class Level {
  private bubbleFactory: BubbleFactory;

  private lattice: Map<string, Bubble>;

  public static belowBaseline(bubble: Bubble): boolean {
    return bubble.getMesh().position.y <= 0;
  }

  constructor(scene: BABYLON.Scene, bubbleFactory: BubbleFactory) {
    this.lattice = new Map();
    this.bubbleFactory = bubbleFactory;

    this.create(scene);
  }

  public dispose() {

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

  public getBubbles() {
    return Array.from(this.lattice.values());
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

  private clamp(coord: BABYLON.Vector3) {
    const max = new BABYLON.Vector3(
      LEVEL_WIDTH - 1,
      LEVEL_LAYERS - 1,
      LEVEL_DEPTH - 1
    );
    const min = new BABYLON.Vector3();

    return BABYLON.Vector3.Clamp(coord, min, max);
  }

  public getLocalBubblesOfColor(bubble: Bubble) {
    const dirs = [
      BABYLON.Vector3.Left(),
      BABYLON.Vector3.Right(),
      BABYLON.Vector3.Down(),
      BABYLON.Vector3.Up()
    ];

    const localWithColor = new Set<Bubble>();

    const searchAround = (bub: Bubble) => {
      if (bub.getColor() !== bubble.getColor()) {
        return;
      }

      if (localWithColor.has(bub)) {
        return;
      }
      localWithColor.add(bub);

      const coords = this.getCoords(bub);
      if (!coords) {
        return;
      }

      for (const dir of dirs) {
        const coordDir = coords.add(dir);
        const coordBubble = this.getBubble(coordDir);
        if (coordBubble) {
          this.removeBubble(coordDir);
          searchAround(coordBubble);
        }
      }
    };

    searchAround(bubble);
    /*
    for (const b of localWithColor.values()) {
      const c = this.getCoords(b);
      if (c) {
        this.removeBubble(c);
      }
    }
    */

    return Array.from(localWithColor.values());
  }

  public insertBubble(bubble: Bubble, other: Bubble) {
    const coords = this.getCoords(other);
    if (!coords) {
      return;
    }

    const imposter = bubble.getImposter();
    imposter.setMass(0);

    if (!this.hasBubble(coords)) {
      this.setBubble(coords, bubble);
    } else if (!this.hasBubble(coords.subtract(BABYLON.Vector3.Left()))) {
      this.setBubble(coords.subtract(BABYLON.Vector3.Left()), bubble);
    } else if (!this.hasBubble(coords.subtract(BABYLON.Vector3.Right()))) {
      this.setBubble(coords.subtract(BABYLON.Vector3.Right()), bubble);
    } else if (!this.hasBubble(coords.subtract(BABYLON.Vector3.Forward()))) {
      this.setBubble(coords.subtract(BABYLON.Vector3.Forward()), bubble);
    } else if (!this.hasBubble(coords.subtract(BABYLON.Vector3.Backward()))) {
      this.setBubble(coords.subtract(BABYLON.Vector3.Backward()), bubble);
    }

    const below = coords.add(BABYLON.Vector3.Down());

    if (!this.hasBubble(below)) {
      this.setBubble(below, bubble);
    } else if (!this.hasBubble(below.subtract(BABYLON.Vector3.Left()))) {
      this.setBubble(below.subtract(BABYLON.Vector3.Left()), bubble);
    } else if (!this.hasBubble(below.subtract(BABYLON.Vector3.Right()))) {
      this.setBubble(below.subtract(BABYLON.Vector3.Right()), bubble);
    } else if (!this.hasBubble(below.subtract(BABYLON.Vector3.Forward()))) {
      this.setBubble(below.subtract(BABYLON.Vector3.Forward()), bubble);
    } else if (!this.hasBubble(below.subtract(BABYLON.Vector3.Backward()))) {
      this.setBubble(below.subtract(BABYLON.Vector3.Backward()), bubble);
    }
  }

  private removeBubble(coords: BABYLON.Vector3) {
    return this.lattice.delete(`${coords.x},${coords.y},${coords.z}`);
  }

  private getBubble(coords: BABYLON.Vector3) {
    return this.lattice.get(`${coords.x},${coords.y},${coords.z}`);
  }

  private setBubble(coords: BABYLON.Vector3, bubble: Bubble) {
    this.lattice.set(`${coords.x},${coords.y},${coords.z}`, bubble);

    if (bubble) {
      const xOffset = 0.5;
      const zOffset = 0.5;

      const x = coords.x + xOffset - LEVEL_WIDTH * 0.5;
      const z = coords.z + zOffset - LEVEL_DEPTH * 0.5;

      bubble.getMesh().position.set(x, coords.y, z);
    }
  }

  private hasBubble(coords: BABYLON.Vector3) {
    return !!this.lattice.get(`${coords.x},${coords.y},${coords.z}`);
  }

  private getCoords(bubble: Bubble) {
    for (const [key, value] of this.lattice.entries()) {
      if (value === bubble) {
        const [x, y, z] = key.split(",").map(v => Number.parseInt(v));
        return this.clamp(new BABYLON.Vector3(x, y, z));
      }
    }
  }

  public insertNextLayer() {
    // Step all layers
    for (let l = 0; l < LEVEL_LAYERS; l++) {
      for (let w = 0; w < LEVEL_WIDTH; w++) {
        for (let d = 0; d < LEVEL_DEPTH; d++) {
          const coordThis = new BABYLON.Vector3(w, l, d);
          const coordAbove = new BABYLON.Vector3(w, l + 1, d);
          const bubbleAbove = this.getBubble(coordAbove);
          const bubbleThis = this.getBubble(coordThis);

          this.setBubble(coordThis, null);

          if (bubbleAbove) {
            this.setBubble(coordThis, bubbleAbove);
          }

          if (l === 0 && bubbleThis) {
            bubbleThis.dispose();
          }
        }
      }
    }

    for (let w = 0; w < LEVEL_WIDTH; w++) {
      for (let d = 0; d < LEVEL_DEPTH; d++) {
        const bubble = this.bubbleFactory.createBubble();
        bubble.getImposter().setMass(0);
        const coordThis = new BABYLON.Vector3(w, LEVEL_LAYERS, d);
        this.setBubble(coordThis, bubble);
      }
    }
  }
}
