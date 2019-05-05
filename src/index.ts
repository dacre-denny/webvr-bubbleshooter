import * as BABYLON from "babylonjs";

const enum Colors {
  RED,
  BLUE,
  GREEN,
  YELLOW
}

const GAME_WIDTH = 20;
const GAME_DEPTH = 20;
const GAME_HEIGHT = 15;

class Game {
  private canvas: HTMLCanvasElement;
  private engine: BABYLON.Engine;
  private scene: BABYLON.Scene;
  private camera: BABYLON.ArcRotateCamera;
  private light: BABYLON.Light;
  private n: number = 0;

  private debug: BABYLON.Mesh;

  private launcher: BABYLON.Mesh;
  private gameBoard: BABYLON.InstancedMesh[] = [];

  private bubbles: Map<Colors, BABYLON.Mesh>;

  constructor(canvasElement: string) {
    this.canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
    this.engine = new BABYLON.Engine(this.canvas, true);
    this.bubbles = new Map();
  }

  private getBubble(id: number) {
    const bubbleColor = Math.floor(Math.random() * 4) as Colors;
    const bubbleMesh = this.bubbles.get(bubbleColor);

    const instance = bubbleMesh.createInstance(`bubble${id}`);

    const imposter = new BABYLON.PhysicsImpostor(
      instance,
      BABYLON.PhysicsImpostor.SphereImpostor,
      { mass: 1, friction: 0.0, restitution: 0.1, damping: 0 },
      this.scene
    );

    instance.physicsImpostor = imposter;

    return instance;
  }

  private initGameBoard() {
    const gameBoard = new Array<BABYLON.InstancedMesh>(
      GAME_DEPTH * GAME_HEIGHT * GAME_WIDTH
    );

    this.gameBoard = gameBoard;
  }

  private getBubbleIndex(w: number, d: number, h: number) {
    const hOffset = h * GAME_WIDTH * GAME_DEPTH;
    const dOffset = d * GAME_WIDTH;

    return hOffset + dOffset + w;
  }

  private gameBoardStep() {
    // Iterate all bubbles in game board
    for (let k = GAME_HEIGHT - 1 - 1; k >= 0; k--) {
      for (let i = 0; i < GAME_WIDTH; i++) {
        for (let j = 0; j < GAME_DEPTH; j++) {
          const idxSrc = this.getBubbleIndex(i, j, k);
          const idxDst = this.getBubbleIndex(i, j, k + 1);

          const meshSrc = this.gameBoard[idxSrc];

          if (meshSrc) {
            meshSrc.position.y = meshSrc.position.y - 0.5;
          }

          this.gameBoard[idxDst] = meshSrc;
        }
      }
    }

    // Populate next leve of bubbles
    for (let i = 0; i < GAME_WIDTH; i++) {
      for (let j = 0; j < GAME_DEPTH; j++) {
        const x = i - GAME_WIDTH / 2;
        const z = j - GAME_DEPTH / 2;

        const bubble = this.getBubble(this.n++);
        bubble.position.y = GAME_HEIGHT * 0.5;
        bubble.position.x = x;
        bubble.position.z = z;

        this.gameBoard[this.getBubbleIndex(i, j, 0)] = bubble;
      }
    }
  }

  private initBubbleTypes() {
    this.bubbles.clear();

    const mapping = new Map<Colors, BABYLON.Color3>();
    mapping.set(Colors.RED, BABYLON.Color3.Red());
    mapping.set(Colors.BLUE, BABYLON.Color3.Blue());
    mapping.set(Colors.GREEN, BABYLON.Color3.Green());
    mapping.set(Colors.YELLOW, BABYLON.Color3.Yellow());

    for (const [key, color] of mapping.entries()) {
      const material = new BABYLON.StandardMaterial(
        `material${key}`,
        this.scene
      );

      material.diffuseColor = color;

      let mesh = BABYLON.MeshBuilder.CreateIcoSphere(
        `mesh${key}`,
        { radius: 0.25, subdivisions: 1 },
        this.scene
      );

      mesh.isVisible = false;
      mesh.material = material;

      this.bubbles.set(key, mesh);
    }
    /** BABYLON.MeshBuilder.CreateIcoSphere(
      `Box${this.n++}`,
      { radius: 0.5, subdivisions: 1 },
      this.scene
    ); */
  }

  shoot() {
    var box = BABYLON.MeshBuilder.CreateIcoSphere(
      `Box${this.n++}`,
      { radius: 0.5, subdivisions: 1 },
      this.scene
    );

    const imposter = new BABYLON.PhysicsImpostor(
      box,
      BABYLON.PhysicsImpostor.SphereImpostor,
      { mass: 1, friction: 0.0, restitution: 1, damping: 0 },
      this.scene
    );

    var forceDirection = this.launcher.getDirection(
      new BABYLON.Vector3(0, 1, 0)
    );
    //var forceDirection = new BABYLON.Vector3(1, 1, 1);

    imposter.applyForce(forceDirection.scale(550), BABYLON.Vector3.Zero());

    box.physicsImpostor = imposter;
  }

  createLauncher() {
    //Create ribbon with updatable parameter set to true for later changes
    var launcherTube = BABYLON.MeshBuilder.CreateCylinder(
      "launcherTube",
      {
        height: 2,
        diameter: 0.5,
        tessellation: 5,
        arc: Math.PI * 2,
        enclose: false
      },
      this.scene
    ).convertToFlatShadedMesh();
    launcherTube.position.y = 1;

    let launcherBase = BABYLON.MeshBuilder.CreateIcoSphere(
      "launcherBase",

      { radius: 1, subdivisions: 1 },
      this.scene
    );

    const launcher = new BABYLON.Mesh("launcher");
    launcher.addChild(launcherBase);
    launcher.addChild(launcherTube);

    this.launcher = launcher;
  }

  createExtents() {
    // new BABYLON.PhysicsImpostor(null, BABYLON.PhysicsImpostor.MeshImpostor, )

    const material = new BABYLON.StandardMaterial(
      "materialGameboard",
      this.scene
    );

    material.diffuseColor = BABYLON.Color3.White();
    material.alpha = 0.5;
    // // Add and manipulate meshes in the scene

    var left = BABYLON.MeshBuilder.CreateBox(
      "left",
      {
        height: GAME_HEIGHT,
        width: 0.1,
        depth: GAME_DEPTH
      },
      this.scene
    );
    left.position.x = -0.5 * GAME_WIDTH;
    left.visibility = 0.5;
    var front = BABYLON.MeshBuilder.CreateBox(
      "front",
      {
        height: GAME_HEIGHT,
        width: GAME_DEPTH,
        depth: 0.1
      },
      this.scene
    );

    front.position.z = -0.5 * GAME_DEPTH;
    front.visibility = 0.5;
    var back = BABYLON.MeshBuilder.CreateBox(
      "back",
      {
        height: GAME_HEIGHT,
        width: GAME_DEPTH,
        depth: 0.1
      },
      this.scene
    );

    back.position.z = 0.5 * GAME_DEPTH;
    back.visibility = 0.5;

    var right = BABYLON.MeshBuilder.CreateBox(
      "right",
      {
        height: GAME_HEIGHT,
        width: 0.1,
        depth: GAME_DEPTH
      },
      this.scene
    );
    right.position.x = 0.5 * GAME_WIDTH;
    right.visibility = 0.5;

    const sides = [front, left, back, right];

    const bounds = new BABYLON.Mesh("bound", this.scene);

    for (const side of sides) {
      bounds.addChild(side);
    }

    for (const side of sides) {
      side.physicsImpostor = new BABYLON.PhysicsImpostor(
        side,
        BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 0, damping: 0, friction: 0, restitution: 0 },
        this.scene
      );
    }

    bounds.physicsImpostor = new BABYLON.PhysicsImpostor(
      bounds,
      BABYLON.PhysicsImpostor.NoImpostor,
      { mass: 0, damping: 0, friction: 0, restitution: 1 },
      this.scene
    );
  }

  createScene(): void {
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.enablePhysics(null, new BABYLON.AmmoJSPlugin());

    this.debug = BABYLON.MeshBuilder.CreateBox(
      "debug",
      {
        height: 0.1,
        width: 0.1,
        depth: 0.1
      },
      this.scene
    );

    const physicsEngine = this.scene.getPhysicsEngine();
    physicsEngine.setGravity(new BABYLON.Vector3(0, 0, 0));

    //
    this.initBubbleTypes();
    this.initGameBoard();
    this.createExtents();
    this.createLauncher();

    this.gameBoardStep();
    setInterval(() => {
      //this.gameBoardStep();
    }, 1000);
    var environment = this.scene.createDefaultEnvironment({
      enableGroundShadow: true,
      groundYBias: 1
    });
    environment.setMainColor(BABYLON.Color3.FromHexString("#74b9ff"));

    // const vrHelper = this._scene.createDefaultVRExperience({
    //   createDeviceOrientationCamera: false
    // });
    // vrHelper.enableTeleportation({ floorMeshes: [environment.ground] });

    // Create a FreeCamera, and set its position to (x:0, y:5, z:-10).
    this.camera = new BABYLON.ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 4,
      20,
      new BABYLON.Vector3(0, 3, 0),
      this.scene
    );

    // Attach the camera to the canvas.
    this.camera.attachControl(this.canvas, false);

    // Create light
    new BABYLON.HemisphericLight(
      "light",
      new BABYLON.Vector3(0, 1, 0),
      this.scene
    );
  }

  doRender(): void {
    // Run the render loop.
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });

    // The canvas/window resize event handler.
    window.addEventListener("resize", () => {
      this.engine.resize();
    });

    window.addEventListener("click", () => {
      this.shoot();
    });

    window.addEventListener("mousemove", (event: MouseEvent) => {
      const x = event.x / document.body.clientWidth - 0.5;
      const y = event.y / document.body.clientHeight - 0.5;

      const dir = new BABYLON.Vector3(x, 1, y).normalize().scale(10);

      if (this.launcher) {
        this.debug.position.copyFrom(dir);
        this.debug.position.y = 0;

        this.launcher.lookAt(dir);
      }
    });
  }
}

window.addEventListener("DOMContentLoaded", () => {
  // Create the game using the 'renderCanvas'.
  let game = new Game("canvas");

  // Create the scene.
  game.createScene();

  // Start render loop.
  game.doRender();
});
