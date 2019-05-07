import * as BABYLON from "babylonjs";
import { BubbleFactory } from "./bubbleFactory";
import { Bubble } from "./bubble";
import { Level } from "./level";

const GAME_WIDTH = 5;
const GAME_DEPTH = 5;
const GAME_HEIGHT = 10;

class Game {
  private canvas: HTMLCanvasElement;
  private engine: BABYLON.Engine;
  private scene: BABYLON.Scene;
  private camera: BABYLON.ArcRotateCamera;

  private debug: BABYLON.Mesh;

  private launcher: BABYLON.Mesh;
  /*
  private bubbles: Bubble[] = [];
*/
  private level: Level;
  private bubbleFactory: BubbleFactory;

  constructor(canvasElement: string) {
    this.canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
    this.engine = new BABYLON.Engine(this.canvas, false);

    this.scene = new BABYLON.Scene(this.engine);
    this.scene.enablePhysics(null, new BABYLON.AmmoJSPlugin());

    this.bubbleFactory = new BubbleFactory(this.scene);
    this.level = new Level(this.scene, this.bubbleFactory);
  }

  //   private initGameBoard() {
  //     const gameBoard = new Array<Bubble>(GAME_DEPTH * GAME_HEIGHT * GAME_WIDTH);

  //     this.bubbles = gameBoard;
  //   }

  shoot() {
    //   this.launcher.lookAt(new BABYLON.Vector3(0, 2, 0.25));

    const bubble = this.bubbleFactory.createBubble();
    const imposter = bubble.getImposter();

    const imposters = Array.from(this.level.getBubbleImposters());

    console.log(`imposters: ${imposters.length}`);

    const handler = (
      collider: BABYLON.PhysicsImpostor,
      other: BABYLON.PhysicsImpostor
    ) => {
      imposter.unregisterOnPhysicsCollide(imposters, handler);

      const colliderBubble = (collider.object as any).bubble as Bubble;
      const otherBubble = (other.object as any).bubble as Bubble;

      this.level.onBubbleCollide(colliderBubble, otherBubble);
    };

    imposter.registerOnPhysicsCollide(imposters, handler);

    var forceDirection = this.launcher.getDirection(
      new BABYLON.Vector3(0, 1, 0)
    );

    imposter.applyForce(forceDirection.scale(550), BABYLON.Vector3.Zero());
  }

  createLauncher() {
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

  createScene(): void {
    /*
    setInterval(() => {
      if (this.level.anyBubblesBeyondBaseline()) {
      } else {
        this.level.insertNextLayer();
      }
    }, 1000);
*/
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

    this.createLauncher();

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

  doRender(): void {
    // Run the render loop.
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });

    // The canvas/window resize event handler.
    window.addEventListener("resize", () => {
      this.engine.resize();
    });

    window.addEventListener("keyup", e => {
      if (e.keyCode === 32) {
        this.level.insertNextLayer();
      } else {
        if (!this.level.anyBubblesBeyondBaseline()) {
          this.shoot();
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

        // this.launcher.lookAt(dir);
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
