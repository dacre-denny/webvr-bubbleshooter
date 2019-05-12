import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";
import { BubbleFactory } from "./bubbleFactory";
import { Bubble } from "./bubble";
import { Level } from "./level";
import { Launcher } from "./launcher";

const enum GameState {
  MENU,
  PLAYING,
  SCOREBOARD
}

class UI {
  private gui: GUI.AdvancedDynamicTexture;
  private plane: BABYLON.Mesh;

  public release() {
    if (this.gui) {
      this.gui.dispose();
      this.gui = null;
    }

    if (this.plane) {
      this.plane = null;
    }
  }

  public create(scene: BABYLON.Scene) {
    this.release();

    // var plane = BABYLON.Mesh.CreatePlane("plane", 1, scene);
    const plane = BABYLON.MeshBuilder.CreatePlane(
      "menu",
      {
        size: 5,
        sourcePlane: new BABYLON.Plane(0, -1, 0, 0)
      },
      scene
    );
    plane.position.addInPlace(new BABYLON.Vector3(2.5, 0, 2.5));
    const gui = GUI.AdvancedDynamicTexture.CreateForMesh(plane, 320, 320, true);

    this.gui = gui;
    this.plane = plane;
  }
  public foo() {
    var panel = new GUI.StackPanel();
    this.gui.addControl(panel);
    {
      var textGameOver = new GUI.TextBlock();
      textGameOver.text = "Game over!";
      textGameOver.height = "40px";
      textGameOver.color = "white";
      textGameOver.textHorizontalAlignment =
        GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
      textGameOver.fontSize = "40";
      panel.addControl(textGameOver);
    }
    {
      var textPlayerScore = new GUI.TextBlock();
      textPlayerScore.text = "Your score:";
      textPlayerScore.height = "20px";
      textPlayerScore.color = "white";
      textPlayerScore.textHorizontalAlignment =
        GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
      textPlayerScore.fontSize = "20";
      panel.addControl(textPlayerScore);
    }
    {
      var textPlayerScore = new GUI.TextBlock();
      textPlayerScore.text = "9231";
      textPlayerScore.height = "40px";
      textPlayerScore.color = "white";
      textPlayerScore.textHorizontalAlignment =
        GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
      textPlayerScore.fontSize = "40";
      panel.addControl(textPlayerScore);
    }

    var buttonMenu = GUI.Button.CreateSimpleButton("menu", "Menu");
    buttonMenu.width = 1;
    buttonMenu.height = "40px";
    buttonMenu.background = "green";
    buttonMenu.onPointerClickObservable.add(() => {});

    panel.addControl(buttonMenu);
  }
}

export class Game {
  static readonly SHOOT_POWER = 600;
  static readonly SHOT_ATTEMPTS = 3;

  private canvas: HTMLCanvasElement;
  private engine: BABYLON.Engine;
  private scene: BABYLON.Scene;
  private camera: BABYLON.Camera;

  private gameState: GameState;
  private gameShotAttempts: number;

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

    this.gameState = GameState.MENU;
    this.gameShotAttempts = Game.SHOT_ATTEMPTS;

    this.bubbleShot = null;
    this.bubbleBurstQueue = [];

    this.bubbleFactory = new BubbleFactory(this.scene);
    this.level = new Level();
    this.launcher = new Launcher();

    this.launch();
  }

  private beforeFrame() {
    if (this.bubbleBurstQueue.length > 0) {
      const bubble = this.bubbleBurstQueue.pop();

      bubble.dispose();
    }
  }

  public onBubbleLanded(colliderBubble: Bubble, otherBubble: Bubble) {
    const { level } = this;
    // Insert bubble into level
    level.insertBubble(colliderBubble, otherBubble);
    const burstBubbles = level.getLocalBubblesOfColor(colliderBubble);

    if (burstBubbles.length > 0) {
      // If bubbles to burst have been found, add to the burst queue
      this.bubbleBurstQueue.push(...burstBubbles);
    } else {
      // If not bubbles to burst, then decrement shot attempts
      this.gameShotAttempts--;

      // If no shots remaining then add bubble layer to level and
      // reset shot attempts
      if (this.gameShotAttempts <= 0) {
        this.level.insertNextLayer(this.bubbleFactory);

        if (this.level.getBubbles().some(Level.belowBaseline)) {
          // If any bubble exists below baseline, then game is over
          this.gameState = GameState.SCOREBOARD;
        } else {
          // If all bubbles above baseline, continue game and reset
          // shot count
          this.gameShotAttempts = Game.SHOT_ATTEMPTS;
        }
      }
    }
  }

  public shootBubble() {
    if (this.bubbleShot) {
      return;
    }

    if (this.bubbleBurstQueue.length > 0) {
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

      this.onBubbleLanded(colliderBubble, otherBubble);
    };

    const direction = this.launcher.getDirection();
    const force = direction.scale(Game.SHOOT_POWER);

    const bubble = this.bubbleFactory.createBubble();
    const imposter = bubble.getImposter();

    imposter.registerOnPhysicsCollide(imposters, handleCollide);
    imposter.applyForce(force, BABYLON.Vector3.Zero());

    this.bubbleShot = bubble;
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

  public restart() {
    this.dispose();
    this.gameState = GameState.MENU;

  }

  public start() {
    this.dispose();
    this.gameState = GameState.PLAYING;
    this.level.insertNextLayer(this.bubbleFactory);
  }

  onReady() {
    this.launcher.create(this.scene);
    this.level.create(this.scene);

    this.scene.onBeforeRenderObservable.add(() => {
      this.beforeFrame();
    });

    // Run the render loop.
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  buildGameOverMenu(scene: BABYLON.Scene) {
    // var plane = BABYLON.Mesh.CreatePlane("plane", 1, scene);
    const plane = BABYLON.MeshBuilder.CreatePlane(
      "menu",
      {
        size: 5,
        sourcePlane: new BABYLON.Plane(0, -1, 0, 0)
      },
      scene
    );
    plane.position.addInPlace(new BABYLON.Vector3(2.5, 0, 2.5));
    var advancedTexture = GUI.AdvancedDynamicTexture.CreateForMesh(
      plane,
      320,
      320,
      true
    );
    advancedTexture.removeControl;
    var panel = new GUI.StackPanel();
    advancedTexture.addControl(panel);
    {
      var textGameOver = new GUI.TextBlock();
      textGameOver.text = "Game over!";
      textGameOver.height = "40px";
      textGameOver.color = "white";
      textGameOver.textHorizontalAlignment =
        GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
      textGameOver.fontSize = "40";
      panel.addControl(textGameOver);
    }
    {
      var textPlayerScore = new GUI.TextBlock();
      textPlayerScore.text = "Your score:";
      textPlayerScore.height = "20px";
      textPlayerScore.color = "white";
      textPlayerScore.textHorizontalAlignment =
        GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
      textPlayerScore.fontSize = "20";
      panel.addControl(textPlayerScore);
    }
    {
      var textPlayerScore = new GUI.TextBlock();
      textPlayerScore.text = "9231";
      textPlayerScore.height = "40px";
      textPlayerScore.color = "white";
      textPlayerScore.textHorizontalAlignment =
        GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
      textPlayerScore.fontSize = "40";
      panel.addControl(textPlayerScore);
    }

    var buttonMenu = GUI.Button.CreateSimpleButton("menu", "Menu");
    buttonMenu.width = 1;
    buttonMenu.height = "40px";
    buttonMenu.background = "green";
    buttonMenu.onPointerClickObservable.add(() => {});

    panel.addControl(buttonMenu);
  }

  buildStartMenu(scene: BABYLON.Scene) {
    // var plane = BABYLON.Mesh.CreatePlane("plane", 1, scene);
    const plane = BABYLON.MeshBuilder.CreatePlane(
      "menu",
      {
        size: 5,
        sourcePlane: new BABYLON.Plane(0, -1, 0, 0)
      },
      scene
    );
    plane.position.addInPlace(new BABYLON.Vector3(2.5, 0, 2.5));
    var advancedTexture = GUI.AdvancedDynamicTexture.CreateForMesh(
      plane,
      320,
      320,
      true
    );
    var panel = new GUI.StackPanel();
    advancedTexture.addControl(panel);
    var header = new GUI.TextBlock();
    header.text = "BubblesVR";
    header.height = "60px";
    header.color = "white";
    header.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    header.fontSize = "40";
    panel.addControl(header);

    var start = GUI.Button.CreateSimpleButton("start", "start");
    start.width = 1;
    start.height = "40px";
    start.background = "green";
    start.onPointerClickObservable.add(() => {});

    panel.addControl(start);
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
        new BABYLON.Vector3(3, -10, 3),
        this.scene
      );
      camera.fov = 1.1;
      camera.setTarget(new BABYLON.Vector3(0, 10, 0));

      camera.attachControl(this.canvas, false);

      this.camera = camera;
    }

    // this.buildStartMenu(this.scene);
    this.buildGameOverMenu(this.scene);

    const physicsEngine = this.scene.getPhysicsEngine();
    physicsEngine.setGravity(new BABYLON.Vector3(0, 0, 0));

    this.scene.executeWhenReady(() => {
      this.onReady();
      this.start();
    });

    // The canvas/window resize event handler.
    window.addEventListener("resize", () => {
      this.engine.resize();
    });

    window.addEventListener("keyup", e => {
      if (e.keyCode === 32) {
        this.level.insertNextLayer(this.bubbleFactory);
      } else {
        if (this.gameState === GameState.PLAYING) {
          this.shootBubble();
        }
      }
    });

    /*
    window.addEventListener("mousemove", (event: MouseEvent) => {
      //   const x = event.x / document.body.clientWidth - 0.5;
      //   const y = event.y / document.body.clientHeight - 0.5;
      if (this.gameState === GameState.PLAYING) {
        const dir = new BABYLON.Vector3(1, 0, 0);
        this.launcher.setDirection(dir);
      }
    });
    */
  }
}
