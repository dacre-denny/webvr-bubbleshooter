import * as BABYLON from "babylonjs";
import { BubbleFactory } from "./bubbleFactory";
import { Bubble } from "./bubble";
import { Level } from "./level";
import { Launcher } from "./launcher";

const enum GameState {
  IDLE,
  PLAYING,
  SCOREBOARD
}

export class Game {
  static readonly SHOOT_POWER = 600;

  private canvas: HTMLCanvasElement;
  private engine: BABYLON.Engine;
  private scene: BABYLON.Scene;
  private camera: BABYLON.ArcRotateCamera;

  private state: GameState;

  private debug: BABYLON.Mesh;

  private launcher: Launcher;
  private level: Level;
  private bubbleFactory: BubbleFactory;
  private bubble: Bubble;
  private bubblesToBurst: Array<Bubble>;

  constructor(canvasElement: string) {
    this.canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
    this.engine = new BABYLON.Engine(this.canvas, false);

    this.scene = new BABYLON.Scene(this.engine);
    this.scene.enablePhysics(null, new BABYLON.AmmoJSPlugin());

    this.bubble = null;
    this.bubbleFactory = new BubbleFactory(this.scene);
    this.level = new Level(this.scene, this.bubbleFactory);
    this.launcher = new Launcher(this.scene, this.level, this.bubbleFactory);
  }

  private beforeFrame() {
    if (this.bubblesToBurst.length > 0) {
      const bubble = this.bubblesToBurst.pop();

      bubble.destroy();
    }
  }

  public shootBubble() {
    if (this.bubble) {
      return;
    }

    if (this.bubblesToBurst.length > 0) {
      return;
    }

    const imposters = this.level.getBubbleImposters();

    const handleCollide = (
      collider: BABYLON.PhysicsImpostor,
      other: BABYLON.PhysicsImpostor
    ) => {
      collider.unregisterOnPhysicsCollide(imposters, handleCollide);

      const colliderBubble = Bubble.fromImposter(collider);
      const otherBubble = Bubble.fromImposter(other);

      const bubblesToPop = this.level.onBubbleCollide(
        colliderBubble,
        otherBubble
      );

      this.bubblesToBurst.push(...bubblesToPop);
    };

    const direction = this.launcher.getDirection();
    const force = direction.scale(Game.SHOOT_POWER);

    const bubble = this.bubbleFactory.createBubble();
    const imposter = bubble.getImposter();

    imposter.registerOnPhysicsCollide(imposters, handleCollide);
    imposter.applyForce(force, BABYLON.Vector3.Zero());

    this.bubble = bubble;
  }

  createScene(): void {
    this.level.insertNextLayer();
    // this.level.insertNextLayer();

    this.scene.executeWhenReady(() => {});

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

    /*
      const vrHelper = this.scene.createDefaultVRExperience({
        createDeviceOrientationCamera: false
      });
      vrHelper.enableTeleportation({ floorMeshes: [environment.ground] });
      */

    // Create a FreeCamera, and set its position to (x:0, y:5, z:-10).
    this.camera = new BABYLON.ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 2,
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

  launch(): void {
    // Run the render loop.
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });

    // this.engine.enableVR()
    // this.engine.initWebVR()

    this.scene.onAfterPhysicsObservable.add(this.beforeFrame);

    // The canvas/window resize event handler.
    window.addEventListener("resize", () => {
      this.engine.resize();
    });

    window.addEventListener("keyup", e => {
      if (e.keyCode === 32) {
        this.level.insertNextLayer();
      } else {
        if (!this.level.anyBubblesBeyondBaseline()) {
          this.shootBubble();
        }
      }
    });

    window.addEventListener("mousemove", (event: MouseEvent) => {
      const x = event.x / document.body.clientWidth - 0.5;
      const y = event.y / document.body.clientHeight - 0.5;

      const dir = new BABYLON.Vector3(x, 1, y).normalize().scale(10);

      if (this.launcher) {
        this.debug.position.copyFrom(dir);
        this.debug.position.y = 0;

        this.launcher.setDirection(dir);
      }
    });
  }
}
