import * as BABYLON from "babylonjs";
import { Bubble } from "./objects/bubble";
import { BubbleFactory } from "./bubbleFactory";
import { Player } from "./objects/player";
import { Level } from "./objects/level";
import { UIManager } from "./ui";
import { Particles } from "./objects/particles";
import { hasVirtualDisplays } from "./utilities";
import { ActionQueue } from "./objects/queue";

const enum GameState {
  GAME_MENU = "GAME_MENU",
  GAME_PLAYING = "GAME_PLAYING",
  GAME_BUSY = "GAME_BUSY",
  GAME_OVER = "GAME_OVER"
}

export class Game {
  static readonly SHOOT_POWER = 10;
  static readonly SHOT_ATTEMPTS = 3;
  static readonly SCORE_INCREMENT = 10;

  private engine: BABYLON.Engine;
  private VRHelper: BABYLON.VRExperienceHelper;
  private scene: BABYLON.Scene;
  private uiManager: UIManager;
  private player: Player;
  private level: Level;
  private state: GameState;

  private playerAttempts: number;
  private playerScore: number;

  // private bubbleFactory: BubbleFactory;

  constructor(canvasElement: string) {
    const canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
    this.engine = new BABYLON.Engine(canvas, false);
    this.scene = new BABYLON.Scene(this.engine);

    this.scene.enablePhysics(null, new BABYLON.AmmoJSPlugin());
    this.scene.getPhysicsEngine().setGravity(new BABYLON.Vector3(0, 0, 0));

    //this.bubbleFactory = new BubbleFactory(this.scene);
    this.level = new Level();
    this.player = new Player();
    this.uiManager = new UIManager(this.scene);

    this.playerAttempts = Game.SHOT_ATTEMPTS;
    this.playerScore = 0;

    this.VRHelper = this.scene.createDefaultVRExperience({
      createDeviceOrientationCamera: true,
      trackPosition: true
    });
    this.VRHelper.enableInteractions();

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
    this.setState(GameState.GAME_MENU);
    //this.setState(GameState.GAME_PLAYING);
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
    this.level.reset();

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

    const bubbleFactory = new BubbleFactory(this.scene);

    this.level.insertBubbleLayer(bubbleFactory);
    this.uiManager.showHUD().setScore(this.playerScore);

    let shotBubble: Bubble = null;

    const VRHelper = this.VRHelper;
    const camera = VRHelper.webVRCamera;
    const burstQue = new ActionQueue();

    const canShootBubble = () => {
      if (shotBubble !== null) {
        return false;
      }
      if (burstQue.isBusy()) {
        return false;
      }
      return true;
    };

    const onCleanUp = () => {
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
    };

    const onUpdatePlayer = (event?: MouseEvent | BABYLON.Camera) => {
      if (hasVirtualDisplays() && camera.leftController) {
        const leftController = camera.leftController;

        this.uiManager.updatePlacement(
          VRHelper.position.add(leftController.position),
          leftController.getForwardRay().direction,
          1
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
      } else if (event instanceof MouseEvent) {
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
        const bubble = bubbleFactory.createBubble();
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
      const bubbles = this.level.pluckLocalBubblesOfSameColor(insertKey);
      console.log("queu", bubbles.length);
      if (bubbles.length <= 1) {
        // If not bubbles to burst, then decrement shot attempts
        this.playerAttempts--;

        // If no shots remaining then add bubble layer to level and
        // reset shot attempts
        if (this.playerAttempts <= 0) {
          this.level.insertBubbleLayer(bubbleFactory);
          this.playerAttempts = Game.SHOT_ATTEMPTS;
        }
      } else {
        // If bubbles to burst have been found, add to the burst queue
        bubbles.forEach(bubble =>
          burstQue.add(() => {
            Particles.createBubblePopPartciles(this.scene, bubble);
            bubble.dispose();
          })
        );

        this.playerAttempts = Game.SHOT_ATTEMPTS;
      }

      if (this.level.getBubbles().some(Level.belowBaseline)) {
        onCleanUp();

        // Game over condition reached
        this.setState(GameState.GAME_OVER);
      }
    };

    if (hasVirtualDisplays()) {
      if (camera.leftController) {
        camera.leftController.onTriggerStateChangedObservable.add(eventData => {
          if (eventData.value === 1) {
            onShootBubble();
          }
        });
      }
    } else {
      window.addEventListener("click", onShootBubble);
      window.addEventListener("mousemove", onUpdatePlayer);
    }
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
}
