import * as BABYLON from "babylonjs";
import { Bubble } from "./bubble";
import { BubbleFactory } from "./bubbleFactory";
import { Launcher } from "./launcher";
import { Level } from "./level";
import { UI } from "./ui";

const enum GameState {
  MENU,
  PLAYING,
  GAMEOVER
}

export class Game {
  static readonly SHOOT_POWER = 10;
  static readonly SHOT_ATTEMPTS = 3;

  private canvas: HTMLCanvasElement;
  private engine: BABYLON.Engine;
  private scene: BABYLON.Scene;
  private camera: BABYLON.Camera;
  private ui: UI;

  private gameState: GameState;
  private gameShotAttempts: number;
  private gameNextBubble: Bubble;

  private launcher: Launcher;
  private level: Level;

  private bubbleFactory: BubbleFactory;
  private bubbleShot: Bubble;
  private bubbleBurstQueue: Array<Bubble>;

  constructor(canvasElement: string) {
    this.canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
    this.engine = new BABYLON.Engine(this.canvas, false);

    this.scene = new BABYLON.Scene(this.engine);
    this.scene.enablePhysics(null, new BABYLON.AmmoJSPlugin());

    this.canvas.addEventListener("pointerdown", () => {});

    // Create light
    new BABYLON.HemisphericLight(
      "light",
      new BABYLON.Vector3(0, 1, 0),
      this.scene
    );

    this.bubbleFactory = new BubbleFactory(this.scene);
    this.level = new Level();
    this.launcher = new Launcher();
    this.ui = new UI(this.scene);

    this.gameState = GameState.MENU;
    this.gameShotAttempts = Game.SHOT_ATTEMPTS;

    this.bubbleShot = null;
    this.bubbleBurstQueue = [];

    this.launch();
  }

  private beforeFrame() {
    this.ui.updatePlacement(
      this.camera.position,
      this.camera.getDirection(BABYLON.Vector3.Forward()),
      5
    );

    if (this.bubbleShot) {
      if (
        BABYLON.Vector3.Distance(
          this.bubbleShot.getMesh().position,
          this.launcher.getPosition()
        ) > 50
      ) {
        this.bubbleShot.dispose();
        this.bubbleShot = null;
      }
    }

    if (this.bubbleBurstQueue.length > 0) {
      const bubble = this.bubbleBurstQueue.pop();

      this.level.removeBubble(bubble);

      bubble.dispose();
    }
  }

  private onBubbleLanded() {
    const { level, bubbleShot } = this;

    if (!bubbleShot) {
      return;
    }
    // Insert bubble into level
    const insertKey = level.insertBubble(bubbleShot);
    const burstBubbles = level.getLocalBubblesOfColor(insertKey);

    if (burstBubbles.length > 1) {
      // If bubbles to burst have been found, add to the burst queue
      this.bubbleBurstQueue.push(...burstBubbles);

      // Reset shot attempts
      this.gameShotAttempts = Game.SHOT_ATTEMPTS;
    } else {
      // If not bubbles to burst, then decrement shot attempts
      this.gameShotAttempts--;

      // If no shots remaining then add bubble layer to level and
      // reset shot attempts
      if (this.gameShotAttempts <= 0) {
        this.level.insertNextLayer(this.bubbleFactory);

        if (this.level.getBubbles().some(Level.belowBaseline)) {
          // If any bubble exists below baseline, then game is over
          this.onGameOver();
          return;
        } else {
          // If all bubbles above baseline, continue game and reset
          // shot count
          this.gameShotAttempts = Game.SHOT_ATTEMPTS;
        }
      }
    }

    this.level.insertNextLayer(this.bubbleFactory);
    this.bubbleShot = null;
  }

  public shootBubble() {
    if (this.bubbleShot) {
      return;
    }

    if (this.bubbleBurstQueue.length > 0) {
      return;
    }

    const imposters = this.level.getBubbleImposters();

    const handleCollide = () => {
      const imposter = this.bubbleShot.getImposter();
      imposter.unregisterOnPhysicsCollide(imposters, handleCollide);

      this.scene.onBeforeRenderObservable.addOnce(() => {
        this.onBubbleLanded();
      });
    };

    const direction = this.launcher.getDirection();
    const force = direction.scale(Game.SHOOT_POWER);

    const bubble = this.gameNextBubble;
    bubble.getMesh().position.x = 0;

    const imposter = bubble.getImposter();

    imposter.registerOnPhysicsCollide(imposters, handleCollide);
    imposter.setLinearVelocity(force);

    this.bubbleShot = bubble;

    this.gameNextBubble = this.getNextBubble();
  }

  private getNextBubble() {
    const gameNextBubble = this.bubbleFactory.createBubble();
    gameNextBubble.getMesh().position.x = 1.5;
    return gameNextBubble;
  }

  public dispose() {
    if (this.bubbleShot) {
      this.bubbleShot.dispose();
    }

    for (const bubble of this.bubbleBurstQueue) {
      bubble.dispose();
    }

    this.gameState = GameState.MENU;
    this.gameShotAttempts = Game.SHOT_ATTEMPTS;

    this.bubbleShot = null;
    this.bubbleBurstQueue = [];

    this.level.create(this.scene);
    this.launcher.create(this.scene);
  }

  public onMainMenu() {
    this.dispose();

    this.ui.displayStartMenu(() => this.onStartGame());
    this.gameState = GameState.MENU;

    this.onStartGame();
  }

  public onGameOver() {
    this.gameState = GameState.GAMEOVER;

    this.ui.displayGameOverScreen();
  }

  public onQuitGame() {
    this.dispose();

    this.ui.displayStartMenu(() => this.onStartGame());
    this.gameState = GameState.MENU;
  }

  public onStartGame() {
    this.dispose();
    this.ui.displayHud();
    this.gameNextBubble = this.getNextBubble();
    this.gameState = GameState.PLAYING;
    this.level.insertNextLayer(this.bubbleFactory);
  }

  onReady() {
    this.launcher.create(this.scene);
    this.launcher.lookAt(new BABYLON.Vector3(0, 5, 0));

    this.level.create(this.scene);

    this.onMainMenu();

    this.scene.onBeforeRenderObservable.add(() => {
      this.beforeFrame();
    });

    // Run the render loop.
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  launch(): void {
    const VR_MODE = false;

    if (VR_MODE) {
      const groundMaterial = new BABYLON.StandardMaterial(
        `ground.material`,
        this.scene
      );
      groundMaterial.diffuseColor = BABYLON.Color3.Gray();

      const ground = BABYLON.MeshBuilder.CreatePlane("ground", {
        size: 25,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE,
        sourcePlane: new BABYLON.Plane(0, 1, 0, 1)
      });
      ground.material = groundMaterial;
      ground.position.addInPlace(BABYLON.Vector3.Down());
      // Create a FreeCamera, and set its position to (x:0, y:5, z:-10).
      this.camera = new BABYLON.FreeCamera(
        "camera",
        new BABYLON.Vector3(0, 0, 0),
        this.scene
      );
      const vrHelper = this.scene.createDefaultVRExperience({
        createDeviceOrientationCamera: true,
        trackPosition: true
      });

      this.camera = vrHelper.webVRCamera;
      vrHelper.enableTeleportation({
        floorMeshes: [ground]
      });

      vrHelper.enableInteractions();

      vrHelper.raySelectionPredicate = (mesh: BABYLON.AbstractMesh) => {
        console.log(mesh.name);

        return false;
      };

      //vrHelper.enterVR();
      vrHelper.onEnteringVR.add(() => {});
    } else {
      const camera = new BABYLON.UniversalCamera(
        "camera",
        new BABYLON.Vector3(7, -4, 7),
        this.scene
      );
      camera.fov = 1.1;
      camera.setTarget(new BABYLON.Vector3(0, 0, 0));

      camera.attachControl(this.canvas, false);

      this.camera = camera;
    }

    const physicsEngine = this.scene.getPhysicsEngine();
    physicsEngine.setGravity(new BABYLON.Vector3(0, 0, 0));

    this.scene.executeWhenReady(() => {
      this.onReady();
    });

    // The canvas/window resize event handler.
    window.addEventListener("resize", () => {
      this.engine.resize();
    });

    window.addEventListener("keyup", e => {
      if (e.keyCode === 32) {
        this.level.insertNextLayer(this.bubbleFactory);
      }
      // else {
      //   if (this.gameState === GameState.PLAYING) {
      //   }
      // }
      if (e.key === "a") {
        this.shootBubble();
      }
    });

    window.addEventListener("mousemove", (event: MouseEvent) => {
      const pickingInfo = this.scene.pick(
        event.clientX,
        event.clientY,
        Bubble.isBubble,
        false,
        this.camera
      );
      if (pickingInfo.pickedMesh) {
        const bubble = Bubble.fromAbstractMesh(pickingInfo.pickedMesh);

        this.launcher.lookAt(bubble.getMesh().position);
      }
    });
  }
}
