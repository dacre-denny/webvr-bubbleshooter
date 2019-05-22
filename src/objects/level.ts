import * as BABYLON from "babylonjs";
import { Bubble } from "./bubble";
import { BubbleFactory } from "../bubbleFactory";
import { clamp, applyColors } from "../utilities";

const LEVEL_WIDTH = 4;
const LEVEL_DEPTH = 4;
const LEVEL_LAYERS = 5;
const OFFSET_X = 0.5;
const OFFSET_Z = 0.5;
const ROTATE_SPEED = 0.00125;

interface Wall {
  height: number;
  width: number;
  position: BABYLON.Vector3;
}

export class Level {
  static readonly BASELINE = 1;

  private lattice: Map<string, Bubble>;
  private level: BABYLON.Mesh;
  private top: BABYLON.Mesh;

  public static belowBaseline(bubble: Bubble): boolean {
    return bubble.getMesh().position.y <= Level.BASELINE;
  }

  public static isImposterTop(imposter: BABYLON.PhysicsImpostor) {
    return (imposter.object as BABYLON.Mesh).name === `level.top`;
  }

  public static isWall(mesh: BABYLON.AbstractMesh): boolean {
    return !!(mesh as any).wall;
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

  private createSphere(scene: BABYLON.Scene) {
    var sphere = BABYLON.MeshBuilder.CreateSphere(
      "sphere",
      {
        segments: 4,
        diameter: 200,
        updatable: true,
        sideOrientation: BABYLON.Mesh.BACKSIDE
      },
      scene
    );

    //If no colors add colors to sphere
    var colors = sphere.getVerticesData(BABYLON.VertexBuffer.ColorKind);
    if (!colors) {
      colors = [];

      var positions = sphere.getVerticesData(BABYLON.VertexBuffer.PositionKind);

      for (var p = 0; p < positions.length / 3; p++) {
        const g = Math.sin(positions[p * 3 + 0]) * 0.5 + 0.5;
        const b = Math.cos(positions[p * 3 + 2]) * 0.5 + 0.5;
        const r = Math.cos(1.7 + positions[p * 3 + 2]) * 0.5 + 0.5;

        colors.push(r, g, b, 1);
      }
    }

    sphere.setVerticesData(BABYLON.VertexBuffer.ColorKind, colors);

    const material = new BABYLON.StandardMaterial("level.material", scene);
    material.diffuseColor = BABYLON.Color3.White();
    material.disableLighting = true;
    material.emissiveColor = BABYLON.Color3.White();

    sphere.material = material;

    scene.onBeforeRenderObservable.add(() => {
      sphere.rotate(BABYLON.Vector3.Up(), ROTATE_SPEED);
    });
  }

  public create(scene: BABYLON.Scene) {
    this.dispose();

    this.createSphere(scene);

    const material = new BABYLON.StandardMaterial("level.material", scene);
    material.diffuseColor = BABYLON.Color3.White();
    material.emissiveColor = BABYLON.Color3.White();
    material.disableLighting = true;

    const walls: Wall[] = [
      {
        height: LEVEL_LAYERS,
        width: LEVEL_DEPTH * 2,
        position: new BABYLON.Vector3(
          -LEVEL_WIDTH,
          LEVEL_LAYERS * 0.5 + Bubble.RADIUS,
          0
        )
      },
      {
        height: LEVEL_LAYERS,
        width: LEVEL_DEPTH * 2,
        position: new BABYLON.Vector3(
          0,
          LEVEL_LAYERS * 0.5 + Bubble.RADIUS,
          -LEVEL_DEPTH
        )
      },
      {
        height: LEVEL_LAYERS,
        width: LEVEL_WIDTH * 2,
        position: new BABYLON.Vector3(
          0,
          LEVEL_LAYERS * 0.5 + Bubble.RADIUS,
          LEVEL_DEPTH
        )
      },
      {
        height: LEVEL_LAYERS,
        width: LEVEL_WIDTH * 2,
        position: new BABYLON.Vector3(
          LEVEL_WIDTH,
          LEVEL_LAYERS * 0.5 + Bubble.RADIUS,
          0
        )
      }
    ];

    const level = new BABYLON.Mesh("level", scene);

    walls.forEach((wall, index) => {
      const direction = new BABYLON.Vector3(
        -wall.position.x,
        0,
        -wall.position.z
      ).normalize();

      var mesh = BABYLON.MeshBuilder.CreatePlane(`plane.${index}`, {
        sourcePlane: BABYLON.Plane.FromPositionAndNormal(
          BABYLON.Vector3.Zero(),
          direction
        ),
        width: wall.width,
        height: wall.height
      });
      // BABYLON.MeshBuilder.CreateBox(`level.${index}`, wall, scene);
      mesh.position.set(
        wall.position.x - OFFSET_X,
        wall.position.y,
        wall.position.z - OFFSET_Z
      );
      mesh.visibility = 0.5;

      applyColors(
        mesh,
        new BABYLON.Color3(mesh.position.x, mesh.position.y, mesh.position.z)
      );

      const imposter = new BABYLON.PhysicsImpostor(
        mesh,
        BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 0, damping: 0, friction: 0, restitution: 0 },
        scene
      );

      mesh.material = material;
      mesh.physicsImpostor = imposter;
      mesh.checkCollisions = true;
      (mesh as any).wall = true;

      level.addChild(mesh);
    });
    {
      var mesh = BABYLON.MeshBuilder.CreatePlane(
        `level.top`,
        {
          sourcePlane: BABYLON.Plane.FromPositionAndNormal(
            BABYLON.Vector3.Zero(),
            BABYLON.Vector3.Down()
          ),
          width: LEVEL_DEPTH * 2,
          height: LEVEL_WIDTH * 2
        },
        scene
      );
      mesh.position.set(-OFFSET_X, LEVEL_LAYERS + Bubble.RADIUS, -OFFSET_Z);
      mesh.visibility = 0.5;

      applyColors(
        mesh,
        new BABYLON.Color3(mesh.position.x, mesh.position.y, mesh.position.z)
      );

      const imposter = new BABYLON.PhysicsImpostor(
        mesh,
        BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 0, damping: 0, friction: 0, restitution: 0 },
        scene
      );

      mesh.physicsImpostor = imposter;
      mesh.checkCollisions = true;
      mesh.material = material;

      (mesh as any).wall = true;

      this.top = mesh;
    }

    const impostor = new BABYLON.PhysicsImpostor(
      level,
      BABYLON.PhysicsImpostor.NoImpostor,
      { mass: 0, damping: 0, friction: 0, restitution: 1 },
      scene
    );
    level.physicsImpostor = impostor;
    level.checkCollisions = true;

    (level as any).wall = true;

    this.level = level;
  }

  public reset() {
    for (const [key, bubble] of this.lattice.entries()) {
      if (bubble) {
        bubble.dispose();
      }
    }

    this.lattice.clear();
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

  private getBubbleImposters() {
    const imposters: BABYLON.PhysicsImpostor[] = [this.top.physicsImpostor]; //[this.top.physicsImpostor];

    for (const bubble of this.getBubbles()) {
      imposters.push(bubble.getImposter());
    }

    return imposters;
  }

  public pluckLocalBubblesOfSameColor(key: string) {
    const options = [
      [0, +1, 0],
      [0, -1, 0],
      [0, 0, +1],
      [0, 0, -1],
      [+1, 0, 0],
      [-1, 0, 0]
    ];

    let indicies = this.getIndicies(key);
    const bubble = this.lattice.get(key);

    if (!indicies) {
      return;
    }

    // const bubbles = new Set<Bubble>();
    const keys = new Set<string>();

    const iterate = (x: number, y: number, z: number) => {
      const key = this.getKey(x, y, z);
      const b = this.lattice.get(key);

      if (!b) {
        return;
      }

      if (b.getColor() !== bubble.getColor()) {
        return;
      }

      if (keys.has(key)) {
        return;
      }

      keys.add(key);
      for (const [i, j, k] of options) {
        iterate(i + x, j + y, k + z);
      }
    };
    iterate(indicies[0], indicies[1], indicies[2]);

    const bubbles = new Set<Bubble>();

    if (keys.size > 1) {
      for (const key of keys) {
        bubbles.add(this.lattice.get(key));
        this.lattice.delete(key);
      }
    }

    return Array.from(bubbles);
  }

  public insertBubble(bubble: Bubble) {
    const { position } = bubble.getMesh();
    const x = Math.round(position.x);
    const y = Math.round(position.y);
    const z = Math.round(position.z);

    const key = this.getKey(x, y, z);

    const imposter = bubble.getImposter();
    imposter.setMass(0);

    position.x = x;
    position.y = y;
    position.z = z;

    this.lattice.set(key, bubble);

    return key;
  }

  private getKey(x: number, y: number, z: number) {
    x = clamp(x, -LEVEL_WIDTH, LEVEL_WIDTH);
    y = clamp(y, 0, LEVEL_LAYERS);
    z = clamp(z, -LEVEL_DEPTH, LEVEL_DEPTH);
    return `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
  }

  private getIndicies(key: string): [number, number, number] {
    return key.split(",").map(i => Number.parseInt(i)) as [
      number,
      number,
      number
    ];
  }

  public removeBubble(bubble: Bubble) {
    for (const [key, value] of this.lattice.entries()) {
      if (bubble === value) {
        this.lattice.delete(key);
      }
    }
  }

  public insertBubbleLayer(bubbleFactory: BubbleFactory) {
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
        const key = this.getKey(x, Level.BASELINE, z);
        const bubble = this.lattice.get(key);

        if (bubble) {
          console.log(x);
          bubble.dispose();
          this.lattice.delete(key);
        }
      }
    }

    // Increment all bubbles through inner layers
    for (let y = Level.BASELINE; y < LEVEL_LAYERS; y++) {
      for (let x = -LEVEL_WIDTH; x < LEVEL_WIDTH; x++) {
        for (let z = -LEVEL_DEPTH; z < LEVEL_DEPTH; z++) {
          const keySrc = this.getKey(x, y + 1, z);
          const keyDest = this.getKey(x, y, z);

          const bubble = this.lattice.get(keySrc);
          if (bubble) {
            place(bubble, x, y, z);
            this.lattice.set(keyDest, bubble);
          }
          this.lattice.set(keySrc, null);
        }
      }
    }

    // Insert new bubbles at top layer
    for (let x = -LEVEL_WIDTH; x < LEVEL_WIDTH; x++) {
      for (let z = -LEVEL_DEPTH; z < LEVEL_DEPTH; z++) {
        const key = this.getKey(x, LEVEL_LAYERS, z);
        const bubble = bubbleFactory.createBubble();

        bubble.getImposter().setMass(0);

        this.lattice.set(key, bubble);
        place(bubble, x, LEVEL_LAYERS, z);
      }
    }
  }

  public registerCollision(bubble: Bubble, handler: () => void) {
    const imposter = bubble.getImposter();
    const imposters = this.getBubbleImposters();

    const handleCollide = () => {
      imposter.unregisterOnPhysicsCollide(imposters, handleCollide);
      handler();
    };

    imposter.registerOnPhysicsCollide(imposters, handleCollide);
  }
}
