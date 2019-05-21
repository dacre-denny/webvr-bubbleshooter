import * as BABYLON from "babylonjs";
import { Bubble } from "./objects/bubble";
import { BubbleFactory } from "./bubbleFactory";
import { Player } from "./objects/player";
import { Level } from "./objects/level";
import { UIManager } from "./ui";
import { Particles } from "./objects/particles";
import { hasVirtualDisplays } from "./utilities";

const enum GameState {
  GAME_MENU = "GAME_MENU",
  GAME_PLAYING = "GAME_PLAYING",
  GAME_BUSY = "GAME_BUSY",
  GAME_OVER = "GAME_OVER"
}

class BubbleQueue {
  bubbles: Bubble[] = [];
  timer: number;

  private iterate() {
    setTimeout(() => {
      const bubble = this.bubbles.pop();

      if (bubble) {
        Bubble.burst(bubble);
      }

      if (this.bubbles.length) {
        this.iterate();
      } else {
        this.timer = undefined;
      }
    }, 500);
  }

  public add(bubble: Bubble) {
    this.bubbles.push(bubble);

    if (this.timer === undefined) {
      this.iterate();
    }
  }

  public isEmpty() {
    return this.bubbles.length === 0;
  }
}

export class Game {
  static readonly SHOOT_POWER = 10;
  static readonly SHOT_ATTEMPTS = 3;
  static readonly SCORE_INCREMENT = 10;

  private engine: BABYLON.Engine;
  private VRHelper: BABYLON.VRExperienceHelper;
  private scene: BABYLON.Scene;
  private queue: BubbleQueue;
  // private bubbleParticles: BABYLON.ParticleSystem;
  private uiManager: UIManager;
  private player: Player;
  private level: Level;
  private state: GameState;

  private playerAttempts: number;
  private playerScore: number;

  private bubbleFactory: BubbleFactory;
  // private bubbleBurstQueue: Array<Bubble>;

  constructor(canvasElement: string) {
    const canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
    this.engine = new BABYLON.Engine(canvas, false);
    this.scene = new BABYLON.Scene(this.engine);

    this.scene.enablePhysics(null, new BABYLON.AmmoJSPlugin());
    this.scene.getPhysicsEngine().setGravity(new BABYLON.Vector3(0, 0, 0));

    this.bubbleFactory = new BubbleFactory(this.scene);
    this.level = new Level();
    this.player = new Player();
    this.uiManager = new UIManager(this.scene);
    this.queue = new BubbleQueue();

    this.playerAttempts = Game.SHOT_ATTEMPTS;
    this.playerScore = 0;

    //this.bubbleBurstQueue = [];

    this.configVirtualDisplay();

    this.level.create(this.scene);
    this.player.create(this.scene);

    // The canvas/window resize event handler.
    window.addEventListener("resize", () => {
      this.engine.resize();
    });

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });

    // this.setState(GameState.GAME_OVER);
    // this.setState(GameState.GAME_MENU);
    this.setState(GameState.GAME_PLAYING);
    this.onGameFrame = this.onGameFrame.bind(this);
  }

  private delay(delay: number, action: () => void) {
    return () => {
      new Promise(resolve => {
        setTimeout(resolve, delay);
      }).then(action);
    };
  }

  private setState(state: GameState) {
    if (state === this.state) {
      return;
    }

    switch (state) {
      case GameState.GAME_MENU: {
        this.onMainMenu();
        break;
      }
      case GameState.GAME_OVER: {
        this.onGameOver();
        break;
      }
      case GameState.GAME_BUSY: {
        break;
      }
      case GameState.GAME_PLAYING: {
        this.onGamePlaying();
        break;
      }
    }

    this.state = state;
  }

  private onMainMenu() {
    const confetti = Particles.createConfetti(
      this.scene,
      new BABYLON.Vector3(0, 15, 0)
    );
    confetti.start();

    this.player.lookAt(new BABYLON.Vector3(2, 5, 3));

    this.uiManager
      .showStartMenu()
      .getStartButton()
      .onPointerClickObservable.addOnce(() => {
        confetti.stop();
        this.setState(GameState.GAME_PLAYING);
      });
  }

  private onGamePlaying() {
    this.playerScore = 0;
    this.playerAttempts = Game.SHOT_ATTEMPTS;

    this.level.insertBubbleLayer(this.bubbleFactory);
    this.uiManager.showHUD().setScore(this.playerScore);

    let shotBubble: Bubble = null;
    const VRHelper = this.VRHelper;
    const webVRCamera = VRHelper.webVRCamera;

    const canShootBubble = () => {
      if (shotBubble !== null) {
        return false;
      }
      if (!this.queue.isEmpty()) {
        return false;
      }
      return true;
    };

    const onUpdatePlayer = (event?: MouseEvent) => {
      if (hasVirtualDisplays()) {
        if (webVRCamera.leftController) {
          const leftController = webVRCamera.leftController;

          this.uiManager.updatePlacement(
            VRHelper.position.add(leftController.position),
            leftController.getForwardRay().direction,
            5
          );

          const pickingInfo = this.scene.pickWithRay(
            leftController.getForwardRay(),
            (m: BABYLON.AbstractMesh) => Bubble.isBubble(m) || Level.isWall(m),
            false
          );

          if (pickingInfo.hit) {
            const target = pickingInfo.pickedPoint;

            target.y = Math.max(target.y, Level.BASELINE);

            this.player.lookAt(target);
          }
        }
      } else {
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

          this.player.lookAt(target);
        }
      }
    };

    const onDestroyBubble = (bubble: Bubble) => {
      if (shotBubble === bubble) {
        shotBubble = null;
      }

      bubble.getMesh().onAfterWorldMatrixUpdateObservable.clear();
      bubble.dispose();
    };

    const onUpdateBubble = (bubble: Bubble) => {
      if (
        BABYLON.Vector3.Distance(
          bubble.getPosition(),
          this.player.getPosition()
        ) > 20
      ) {
        onDestroyBubble(bubble);
      }
    };

    const onShootBubble = () => {
      if (canShootBubble()) {
        const bubble = this.bubbleFactory.createBubble();
        bubble.setPosition(this.player.getPosition());
        bubble.setVelocity(this.player.getDirection().scale(Game.SHOOT_POWER));

        bubble.getMesh().onAfterWorldMatrixUpdateObservable.add(() => {
          onUpdateBubble(bubble);
        });

        this.level.registerCollision(bubble, () =>
          this.scene.onBeforeRenderObservable.addOnce(() => {
            onStoppedBubble(bubble);
            shotBubble = null;
          })
        );

        shotBubble = bubble;
      }
    };

    const onStoppedBubble = (bubble: Bubble) => {
      // Insert bubble into level
      const insertKey = this.level.insertBubble(bubble);
      const burstBubbles = this.level.getLocalBubblesOfColor(insertKey);

      if (burstBubbles.length <= 1) {
        // If not bubbles to burst, then decrement shot attempts
        this.playerAttempts--;

        // If no shots remaining then add bubble layer to level and
        // reset shot attempts
        if (this.playerAttempts <= 0) {
          this.level.insertBubbleLayer(this.bubbleFactory);
          this.playerAttempts = Game.SHOT_ATTEMPTS;
        }
      } else {
        // If bubbles to burst have been found, add to the burst queue
        for (const burstBubble of burstBubbles) {
          this.queue.add(burstBubble);
        }
        this.playerAttempts = Game.SHOT_ATTEMPTS;
      }

      if (this.level.getBubbles().some(Level.belowBaseline)) {
        // Game over condition reached
        this.setState(GameState.GAME_OVER);

        // Clean up event binding
        if (hasVirtualDisplays()) {
          const camera = this.VRHelper.webVRCamera;
          camera.onAfterCheckInputsObservable.clear();
          if (camera.leftController) {
            camera.leftController.onTriggerStateChangedObservable.clear();
          }
        } else {
          window.removeEventListener("click", onShootBubble);
          window.removeEventListener("mousemove", onUpdatePlayer);
        }
      }
    };

    if (hasVirtualDisplays()) {
      const onControllerUpdate = () => {
        if (webVRCamera.leftController) {
          const leftController = webVRCamera.leftController;
          const onTrigger = leftController.onTriggerStateChangedObservable;

          if (!onTrigger.hasObservers()) {
            onTrigger.add(eventData => {
              if (eventData.value === 1) {
                onShootBubble();
              }
            });
          }

          onUpdatePlayer();
        } else {
          this.uiManager.updatePlacement(
            this.VRHelper.position.add(webVRCamera.position),
            webVRCamera.getForwardRay().direction,
            5
          );
        }
      };

      webVRCamera.onAfterCheckInputsObservable.add(onControllerUpdate);
    } else {
      window.addEventListener("click", onShootBubble);
      window.addEventListener("mousemove", onUpdatePlayer);
    }
  }

  private onGameFrame() {
    /*
    if (this.bubbleShot !== null) {
      if (
        BABYLON.Vector3.Distance(
          this.bubbleShot.getMesh().position,
          this.player.getPosition()
        ) > 20
      ) {
        this.bubbleShot.dispose();
        this.bubbleShot = null;
      }
    }
// */
    //     if (this.bubbleBurstQueue.length > 0) {
    //       // Reset shot attempts
    //       this.playerScore += Game.SCORE_INCREMENT;
    //       // Update ingame hud
    //       this.uiManager.showHUD().setScore(this.playerScore);
    //       //   .setNextBubble(this.bubbleNext);
    //       const bubble = this.bubbleBurstQueue.pop();
    //       /*
    //       if (!this.particles.isStarted()) {
    //         this.particles.color1 = BABYLON.Color4.FromColor3(BABYLON.Color3.Red());
    //         this.particles.color2 = BABYLON.Color4.FromColor3(
    //           BABYLON.Color3.Blue()
    //         );
    //         this.particles.emitter = bubble.getMesh().position;
    //         this.particles.start();
    //         this.particles.targetStopDuration = 0.125;
    //       }
    //       */
    //       this.level.removeBubble(bubble);
    //       bubble.dispose();
    //     }
  }

  private onGameOver() {
    this.VRHelper.webVRCamera.onAfterCheckInputsObservable.clear();

    const particles = Particles.createConfetti(
      this.scene,
      new BABYLON.Vector3(0, 15, 0)
    );
    particles.start();

    const gameOver = this.uiManager.showGameOverScreen();
    gameOver.getMenuButton().onPointerClickObservable.addOnce(() => {
      particles.stop();

      this.setState(GameState.GAME_MENU);
    });
  }

  private configVirtualDisplay(): void {
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
      /*
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

            this.player.lookAt(target);
          }
        } else {
          this.uiManager.updatePlacement(
            VRHelper.position.add(webVRCamera.position),
            webVRCamera.getForwardRay().direction,
            5
          );
        }
      });
      */
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
  }
}
