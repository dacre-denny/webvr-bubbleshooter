import * as BABYLON from "babylonjs";
import { Bubble } from "./objects/bubble";
import { BubbleFactory } from "./bubbleFactory";
import { Player } from "./objects/player";
import { Level } from "./objects/level";
import { UIManager } from "./ui";

const enum GameState {
  GAME_MENU = "GAME_MENU",
  GAME_PLAYING = "GAME_PLAYING",
  GAME_BUSY = "GAME_BUSY",
  GAME_OVER = "GAME_OVER"
}

function createConfetti(scene: BABYLON.Scene, position: BABYLON.Vector3) {
  const particles = new BABYLON.ParticleSystem(
    "particles-confetti",
    100,
    scene
  );

  particles.particleTexture = new BABYLON.Texture(
    "./images/particle-confetti.png",
    scene
  );

  particles.startPositionFunction = (
    a: any,
    b: any,
    particle: BABYLON.Particle
  ) => {
    particle.position
      .copyFrom(position)
      .addInPlace(
        new BABYLON.Vector3(
          10 * (Math.random() - 0.5),
          0,
          10 * (Math.random() - 0.5)
        )
      );
  };
  particles.startDirectionFunction = (
    a: any,
    b: any,
    particle: BABYLON.Particle
  ) => {
    particle.direction.set(Math.random() - 0.5, 0, Math.random() - 0.5);
  };

  particles.maxAngularSpeed = 15;
  particles.minAngularSpeed = -15;

  particles.maxInitialRotation = Math.PI * 2;
  particles.minInitialRotation = 0;

  particles.maxSize = 1;
  particles.minSize = 0.5;
  particles.gravity = new BABYLON.Vector3(0, -5.81, 0);

  particles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;

  particles.emitRate = 25;
  particles.emitter = BABYLON.Vector3.Zero();
  particles.minEmitPower = 5;
  particles.maxEmitPower = 10;
  particles.minLifeTime = 3.5;
  particles.maxLifeTime = 5;

  particles.color1 = BABYLON.Color4.FromColor3(BABYLON.Color3.Red());
  particles.color2 = BABYLON.Color4.FromColor3(BABYLON.Color3.Blue());

  return particles;
}

function createBubblePopPartciles(scene: BABYLON.Scene) {
  const particles = new BABYLON.ParticleSystem("particles", 2000, scene);

  particles.particleTexture = new BABYLON.Texture(
    "./images/particle-bubble-burst.png",
    scene
  );

  particles.startDirectionFunction = (
    a: any,
    b: any,
    particle: BABYLON.Particle
  ) => {
    particle.direction.set(Math.random() - 0.5, 0, Math.random() - 0.5);
  };

  particles.maxAngularSpeed = 25;
  particles.minAngularSpeed = -25;

  particles.maxInitialRotation = Math.PI * 2;
  particles.minInitialRotation = 0;

  particles.maxSize = 1;
  particles.minSize = 0.5;
  particles.gravity = new BABYLON.Vector3(0, -9.81, 0);

  particles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;

  particles.emitRate = 500;
  particles.minEmitPower = 15;
  particles.maxEmitPower = 20;

  particles.color1 = BABYLON.Color4.FromColor3(BABYLON.Color3.Red());
  particles.color2 = BABYLON.Color4.FromColor3(BABYLON.Color3.Blue());

  return particles;
}

export class Game {
  static readonly SHOOT_POWER = 10;
  static readonly SHOT_ATTEMPTS = 3;
  static readonly SCORE_INCREMENT = 10;

  private engine: BABYLON.Engine;
  private VRHelper: BABYLON.VRExperienceHelper;
  private scene: BABYLON.Scene;
  private bubbleParticles: BABYLON.ParticleSystem;
  private uiManager: UIManager;
  private launcher: Player;
  private level: Level;
  private state: GameState;

  private playerAttempts: number;
  private playerScore: number;

  private bubbleFactory: BubbleFactory;
  private bubbleShot: Bubble;
  private bubbleBurstQueue: Array<Bubble>;

  constructor(canvasElement: string) {
    const canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
    this.engine = new BABYLON.Engine(canvas, false);
    this.scene = new BABYLON.Scene(this.engine);

    this.scene.enablePhysics(null, new BABYLON.AmmoJSPlugin());
    this.scene.getPhysicsEngine().setGravity(new BABYLON.Vector3(0, 0, 0));

    this.bubbleParticles = createBubblePopPartciles(this.scene);
    this.bubbleFactory = new BubbleFactory(this.scene);
    this.level = new Level();
    this.launcher = new Player();
    this.uiManager = new UIManager(this.scene);

    this.playerAttempts = Game.SHOT_ATTEMPTS;
    this.playerScore = 0;

    this.bubbleShot = null;
    this.bubbleBurstQueue = [];

    this.configVirtualDisplay();

    // The canvas/window resize event handler.
    window.addEventListener("resize", () => {
      this.engine.resize();
    });

    this.engine.runRenderLoop(() => {
      // this.setState(GameState.GAME_MENU);
      this.setState(GameState.GAME_OVER);

      this.scene.render();
    });
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

  private onAddBubbleLayer() {
    if (this.level.getBubbles().some(Level.belowBaseline)) {
      this.onGameOver();
    } else {
      this.level.insertNextLayer(this.bubbleFactory);
      this.playerAttempts = Game.SHOT_ATTEMPTS;
    }
  }

  private onBubbleLanded() {
    if (this.bubbleShot === null) {
      return;
    }

    // Insert bubble into level
    const insertKey = this.level.insertBubble(this.bubbleShot);
    const burstBubbles = this.level.getLocalBubblesOfColor(insertKey);

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
        this.onAddBubbleLayer();
      }
    }

    this.bubbleShot = null;
  }

  private onShootBubble() {
    if (
      this.state !== GameState.GAME_PLAYING ||
      this.bubbleShot !== null ||
      this.bubbleBurstQueue.length > 0
    ) {
      return;
    }

    const bubbleShot = this.bubbleFactory.createBubble();
    const bubbleMesh = bubbleShot.getMesh();

    this.level.registerCollision(bubbleShot, () => {
      this.scene.onBeforeRenderObservable.addOnce(() => {
        this.onBubbleLanded();
      });
    });

    bubbleMesh.position.copyFrom(this.launcher.getPosition());

    const bubbleImposter = bubbleShot.getImposter();

    bubbleImposter.setLinearVelocity(
      this.launcher.getDirection().scale(Game.SHOOT_POWER)
    );

    this.bubbleShot = bubbleShot;
  }

  private onMainMenu() {
    this.onGameReset();

    this.uiManager
      .showStartMenu()
      .getStartButton()
      .onPointerClickObservable.addOnce(this.delay(1000, this.onGamePlaying));
  }

  private onGameReset() {
    if (this.bubbleShot) {
      this.bubbleShot.dispose();
      this.bubbleShot = null;
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
  }

  private onGamePlaying() {
    this.scene.onBeforeRenderObservable.add(this.onGameFrame);

    this.onAddBubbleLayer();

    this.uiManager.showHUD().setScore(this.playerScore);
    // .setNextBubble(this.bubbleNext);

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
  }

  private onGameFrame() {
    if (
      this.bubbleShot !== null &&
      BABYLON.Vector3.Distance(
        this.bubbleShot.getMesh().position,
        this.launcher.getPosition()
      ) > 20
    ) {
      this.bubbleShot.dispose();
      this.bubbleShot = null;
    }

    if (this.bubbleBurstQueue.length > 0) {
      // Reset shot attempts
      this.playerScore += Game.SCORE_INCREMENT;

      // Update ingame hud
      this.uiManager.showHUD().setScore(this.playerScore);
      //   .setNextBubble(this.bubbleNext);

      const bubble = this.bubbleBurstQueue.pop();

      /*
      if (!this.particles.isStarted()) {
        this.particles.color1 = BABYLON.Color4.FromColor3(BABYLON.Color3.Red());
        this.particles.color2 = BABYLON.Color4.FromColor3(
          BABYLON.Color3.Blue()
        );
        this.particles.emitter = bubble.getMesh().position;
        this.particles.start();
        this.particles.targetStopDuration = 0.125;
      }
      */

      this.level.removeBubble(bubble);

      bubble.dispose();
    }
  }

  private onGameOver() {
    this.onGameReset();

    const particles = createConfetti(this.scene, new BABYLON.Vector3(0, 15, 0));
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
  }
}
