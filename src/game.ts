import * as BABYLON from "babylonjs";
import { Bubble } from "./objects/bubble";
import { BubbleFactory } from "./bubbleFactory";
import { Player } from "./objects/player";
import { Level } from "./objects/level";
import { UIManager } from "./ui";

export class Game {
  static readonly SHOOT_POWER = 10;
  static readonly SHOT_ATTEMPTS = 3;
  static readonly SCORE_INCREMENT = 10;

  private engine: BABYLON.Engine;
  private VRHelper: BABYLON.VRExperienceHelper;
  private scene: BABYLON.Scene;
  private uiManager: UIManager;
  private launcher: Player;
  private level: Level;

  private playerAttempts: number;
  private playerScore: number;

  private bubbleFactory: BubbleFactory;
  private bubbleNext: Bubble;
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
    const light = new BABYLON.HemisphericLight(
      "light",
      new BABYLON.Vector3(0, 1, 0),
      this.scene
    );

    this.bubbleFactory = new BubbleFactory(this.scene);
    this.level = new Level();
    this.launcher = new Player();
    this.uiManager = new UIManager(this.scene);

    this.playerAttempts = Game.SHOT_ATTEMPTS;
    this.playerScore = 0;

    this.bubbleShot = null;
    this.bubbleBurstQueue = [];

    // The canvas/window resize event handler.
    window.addEventListener("resize", () => {
      this.engine.resize();
    });

    // Start game loop
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });

    this.onMainMenu();
  }

  private incrementLevel() {
    this.level.insertNextLayer(this.bubbleFactory);

    if (this.level.getBubbles().some(Level.belowBaseline)) {
      // If any bubble exists below baseline, then game is over
      this.onGameOver();
    } else {
      // If all bubbles above baseline, continue game and reset
      // shot count
      this.playerAttempts = Game.SHOT_ATTEMPTS;
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

      this.playerAttempts = Game.SHOT_ATTEMPTS;
    } else {
      // If not bubbles to burst, then decrement shot attempts
      this.playerAttempts--;

      // If no shots remaining then add bubble layer to level and
      // reset shot attempts
      if (this.playerAttempts <= 0) {
        this.incrementLevel();
      }
    }

    this.bubbleShot = null;
  }

  private getNextBubble() {
    const gameNextBubble = this.bubbleFactory.createBubble();
    gameNextBubble.getMesh().position.x = 1.5;
    return gameNextBubble;
  }

  onShootBubble = () => {
    if (this.bubbleShot !== null || this.bubbleBurstQueue.length > 0) {
      return;
    }

    const imposters = this.level.getBubbleImposters();

    const handleCollide = () => {
      const imposter = this.bubbleShot.getImposter();
      imposter.unregisterOnPhysicsCollide(imposters, handleCollide);

      this.bubbleShot.getMesh().onAfterWorldMatrixUpdateObservable.clear();

      this.scene.onBeforeRenderObservable.addOnce(() => {
        this.onBubbleLanded();
      });
    };

    const direction = this.launcher.getDirection();
    const force = direction.scale(Game.SHOOT_POWER);

    const bubble = this.bubbleNext;

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
        ) > 20
      ) {
        this.bubbleShot.dispose();
        this.bubbleShot = null;
      }
    });

    this.bubbleShot = bubble;

    this.bubbleNext = this.getNextBubble();
  };

  onMainMenu = () => {
    this.onGameReset();

    this.uiManager
      .showStartMenu()
      .getStartButton()
      .onPointerClickObservable.add(this.onGameStart);

    this.onGameStart();
  };

  onGameReset = () => {
    if (this.bubbleShot) {
      this.bubbleShot.dispose();
      this.bubbleShot = null;
    }

    if (this.bubbleNext) {
      this.bubbleNext.dispose();
      this.bubbleNext = null;
    }

    for (const bubble of this.bubbleBurstQueue) {
      bubble.dispose();
    }

    this.playerAttempts = Game.SHOT_ATTEMPTS;

    this.bubbleBurstQueue = [];

    this.level.create(this.scene);

    this.launcher.create(this.scene).lookAt(new BABYLON.Vector3(0, 5, 0));

    if (this.VRHelper.webVRCamera.leftController) {
      this.VRHelper.webVRCamera.leftController.onTriggerStateChangedObservable.clear();
    } else {
      window.removeEventListener("click", this.onShootBubble);
    }
  };

  onGameStart = () => {
    this.scene.onBeforeRenderObservable.add(this.onGameFrame);

    this.bubbleNext = this.getNextBubble();
    this.incrementLevel();

    this.uiManager
      .showHUD()
      .setScore(this.playerScore)
      .setNextBubble(this.bubbleNext);

    if (
      window.navigator.activeVRDisplays &&
      this.VRHelper.webVRCamera.leftController
    ) {
      this.VRHelper.webVRCamera.leftController.onTriggerStateChangedObservable.add(
        eventData => {
          if (eventData.value === 1) {
            this.onShootBubble();
          }
        }
      );
    } else {
      window.addEventListener("click", this.onShootBubble);

      window.addEventListener("mousemove", (event: MouseEvent) => {
        const pickingInfo = this.scene.pick(
          event.clientX,
          event.clientY,
          (m: BABYLON.AbstractMesh) => Bubble.isBubble(m) || Level.isWall(m),
          false,
          this.VRHelper.currentVRCamera
        );
        if (pickingInfo.hit) {
          const target = pickingInfo.pickedPoint;

          target.y = Math.max(target.y, Level.BASELINE);

          this.launcher.lookAt(target);
        }
      });
    }
  };

  onGameFrame = () => {
    if (this.bubbleBurstQueue.length > 0) {
      // Reset shot attempts
      this.playerScore += Game.SCORE_INCREMENT;

      // Update ingame hud
      this.uiManager
        .showHUD()
        .setScore(this.playerScore)
        .setNextBubble(this.bubbleNext);

      const bubble = this.bubbleBurstQueue.pop();

      this.level.removeBubble(bubble);

      bubble.dispose();
    }
  };

  onGameOver = () => {
    const gameOver = this.uiManager.showGameOverScreen();
    gameOver.getMenuButton().onPointerClickObservable.add(this.onMainMenu);
  };

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
                this.onShootBubble();
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
      VRHelper.currentVRCamera.position.set(0, -1.5, -15);
      VRHelper.currentVRCamera.onAfterCheckInputsObservable.add(() => {
        this.uiManager.updatePlacement(
          VRHelper.position.add(VRHelper.currentVRCamera.position),
          VRHelper.currentVRCamera.getForwardRay().direction,
          5
        );
      });
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
