import * as BABYLON from "babylonjs";
import { Bubble } from "./bubble";
import { BubbleFactory } from "./bubbleFactory";
import { Launcher } from "./launcher";
import { Level } from "./level";
import { UIManager } from "./ui";

// const VR_MODE = true;

export class Game {
  static readonly SHOOT_POWER = 10;
  static readonly SHOT_ATTEMPTS = 3;
  static readonly SCORE_INCREMENT = 10;

  private engine: BABYLON.Engine;
  private VRHelper: BABYLON.VRExperienceHelper;
  private scene: BABYLON.Scene;
  private uiManager: UIManager;
  private launcher: Launcher;
  private level: Level;

  private gameShotAttempts: number;
  private gameNextBubble: Bubble;
  private gameScore: number;

  private bubbleFactory: BubbleFactory;
  private bubbleShot: Bubble;
  private bubbleBurstQueue: Array<Bubble>;

  constructor(canvasElement: string) {
    const canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
    this.engine = new BABYLON.Engine(canvas, false);
    this.scene = new BABYLON.Scene(this.engine);

    this.scene.enablePhysics(null, new BABYLON.AmmoJSPlugin());
    this.scene.getPhysicsEngine().setGravity(new BABYLON.Vector3(0, 0, 0));

    this.setupVR();

    // Create light
    new BABYLON.HemisphericLight(
      "light",
      new BABYLON.Vector3(0, 1, 0),
      this.scene
    );

    this.bubbleFactory = new BubbleFactory(this.scene);
    this.level = new Level();
    this.launcher = new Launcher();
    this.uiManager = new UIManager(this.scene);

    this.gameShotAttempts = Game.SHOT_ATTEMPTS;
    this.gameScore = 0;

    this.bubbleShot = null;
    this.bubbleBurstQueue = [];

    // The canvas/window resize event handler.
    window.addEventListener("resize", () => {
      this.engine.resize();
    });

    this.scene.executeWhenReady(() => {
      this.onReady();
    });
  }

  private beforeFrame() {
    if (this.bubbleBurstQueue.length > 0) {
      // Reset shot attempts
      this.gameScore += Game.SCORE_INCREMENT;

      // Update ingame hud
      const hud = this.uiManager.showHUD();
      hud.setScore(this.gameScore);
      hud.setNextBubble(this.gameNextBubble);

      const bubble = this.bubbleBurstQueue.pop();

      this.level.removeBubble(bubble);

      bubble.dispose();
    }
  }

  private incrementLevel() {
    this.level.insertNextLayer(this.bubbleFactory);

    if (this.level.getBubbles().some(Level.belowBaseline)) {
      // If any bubble exists below baseline, then game is over
      this.onGameOver();
    } else {
      // If all bubbles above baseline, continue game and reset
      // shot count
      this.gameShotAttempts = Game.SHOT_ATTEMPTS;
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

      this.gameShotAttempts = Game.SHOT_ATTEMPTS;
    } else {
      // If not bubbles to burst, then decrement shot attempts
      this.gameShotAttempts--;

      // If no shots remaining then add bubble layer to level and
      // reset shot attempts
      if (this.gameShotAttempts <= 0) {
        this.incrementLevel();
      }
    }

    this.bubbleShot.getMesh().onAfterWorldMatrixUpdateObservable.clear();
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

    if (!bubble) {
      return;
    }

    bubble.getMesh().position.copyFrom(this.launcher.getPosition());

    const imposter = bubble.getImposter();

    imposter.registerOnPhysicsCollide(imposters, handleCollide);
    imposter.setLinearVelocity(force);

    bubble.getMesh().onAfterWorldMatrixUpdateObservable.add(() => {
      if (
        BABYLON.Vector3.Distance(
          this.bubbleShot.getMesh().position,
          this.launcher.getPosition()
        ) > 50
      ) {
        this.bubbleShot.dispose();
        this.bubbleShot = null;
      }
    });

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

    this.gameShotAttempts = Game.SHOT_ATTEMPTS;

    this.bubbleShot = null;
    this.bubbleBurstQueue = [];

    this.level.create(this.scene);
    this.launcher.create(this.scene);
  }

  public onMainMenu() {
    this.dispose();

    const menu = this.uiManager.showStartMenu();
    menu.getStartButton().onPointerClickObservable.add(() => {
      this.onStartGame();
    });

    //    this.onStartGame();
  }

  public onGameOver() {
    const gameOver = this.uiManager.showGameOverScreen();
    gameOver.getMenuButton().onPointerClickObservable.add(() => {
      this.onMainMenu();
    });
  }

  public onStartGame() {
    this.dispose();

    this.gameNextBubble = this.getNextBubble();
    this.incrementLevel();

    const hud = this.uiManager.showHUD();
    hud.setScore(this.gameScore);
    hud.setNextBubble(this.gameNextBubble);

    /*
        window.addEventListener("click", e => {
          this.shootBubble();
        });
        */
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

  setupVR(): void {
    const VRHelper = this.scene.createDefaultVRExperience({
      createDeviceOrientationCamera: true,
      trackPosition: true
    });
    VRHelper.enableInteractions();

    if (window.navigator.activeVRDisplays) {
      const { webVRCamera } = VRHelper;

      VRHelper.onAfterEnteringVRObservable.add(() => {
        VRHelper.position.set(3, -3, 3);
      });

      webVRCamera.onAfterCheckInputsObservable.add(() => {
        if (webVRCamera.controllers.length) {
          webVRCamera.leftController.onTriggerStateChangedObservable.add(
            eventData => {
              if (eventData.value === 1) {
                this.shootBubble();
              }
            }
          );

          this.uiManager.updatePlacement(
            VRHelper.position.add(webVRCamera.rightController.position),
            webVRCamera.rightController.getForwardRay().direction,
            5
          );

          const pickingInfo = this.scene.pickWithRay(
            webVRCamera.leftController.getForwardRay(),
            (m: BABYLON.AbstractMesh) => Bubble.isBubble(m) || Level.isWall(m),
            false
          );

          if (pickingInfo.hit) {
            const target = pickingInfo.pickedPoint;

            target.y = Math.max(target.y, Level.BASELINE);

            this.launcher.lookAt(target);
          }
        } else {
          this.uiManager.updatePlacement(
            VRHelper.position.add(webVRCamera.position),
            webVRCamera.getForwardRay().direction,
            5
          );
        }
      });
    } else {
      VRHelper.currentVRCamera.position.set(-3, 0, -3);
      VRHelper.currentVRCamera.fov = 1.3;
      VRHelper.currentVRCamera.onAfterCheckInputsObservable.add(() => {
        
        this.uiManager.updatePlacement(
          VRHelper.position.add(VRHelper.currentVRCamera.position),
          VRHelper.currentVRCamera.getForwardRay().direction,
          5
        );
      })
    }

    this.VRHelper = VRHelper;
    {
      /*
      const camera = new BABYLON.UniversalCamera(
        "camera",
        new BABYLON.Vector3(7, -10, 7),
        this.scene
      );
      camera.fov = 1.1;
      camera.setTarget(new BABYLON.Vector3(0, 0, 0));

      camera.attachControl(this.engine.getRenderingCanvas(), false);

      camera.onAfterCheckInputsObservable.add(camera => {
        this.uiManager.updatePlacement(
          camera.position,
          camera.getDirection(BABYLON.Vector3.Forward()),
          5
        );
      });

      window.addEventListener("keyup", e => {
        if (e.keyCode === 32) {
          this.incrementLevel();
        }
        // else {
        //   if (// this.gameState === GameState.PLAYING) {
        //   }
        // }
        if (e.key === "a") {
        }
      });

      window.addEventListener("mousemove", (event: MouseEvent) => {
        const pickingInfo = this.scene.pick(
          event.clientX,
          event.clientY,
          (m: BABYLON.AbstractMesh) => Bubble.isBubble(m) || Level.isWall(m),
          false,
          this.VRHelper.webVRCamera
        );
        if (pickingInfo.hit) {
          const target = pickingInfo.pickedPoint;

          target.y = Math.max(target.y, Level.BASELINE);

          this.launcher.lookAt(target);
        }
      });
      */
    }
  }
}
