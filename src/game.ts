import * as BABYLON from "babylonjs";
import { Bubble } from "./objects/bubble";
import { BubbleFactory } from "./bubbleFactory";
import { Player } from "./objects/player";
import { Level } from "./objects/level";
import { Particles } from "./objects/particles";
import { hasVirtualDisplays } from "./utilities";
import { ActionQueue } from "./objects/queue";
import { GameOver } from "./screens/gameover";
import { AssetsManager } from "babylonjs";
import { MainMenu } from "./screens/menu";
import { GameHUD } from "./screens/hud";

export class Game {
  static readonly SHOOT_POWER = 10;
  static readonly SHOT_ATTEMPTS = 3;
  static readonly SCORE_INCREMENT = 10;

  private assetManager: AssetsManager;
  private engine: BABYLON.Engine;
  private VRHelper: BABYLON.VRExperienceHelper;
  private scene: BABYLON.Scene;
  private player: Player;
  private level: Level;

  private soundMusic: BABYLON.Sound;
  private soundButton: BABYLON.Sound;
  private soundExplode: BABYLON.Sound;

  private playerAttempts: number;
  private playerScore: number;

  constructor(canvasElement: string) {
    const canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
    this.engine = new BABYLON.Engine(canvas, false);
    this.scene = new BABYLON.Scene(this.engine);
    this.assetManager = new AssetsManager(this.scene);
    // this.assetManager.addImageTask()

    this.scene.enablePhysics(null, new BABYLON.AmmoJSPlugin());
    this.scene.getPhysicsEngine().setGravity(new BABYLON.Vector3(0, 0, 0));

    this.level = new Level();
    this.player = new Player();

    this.playerAttempts = Game.SHOT_ATTEMPTS;
    this.playerScore = 0;

    this.soundMusic = new BABYLON.Sound(
      "sound-music",
      "./audio/music.mp3",
      this.scene,
      null,
      {
        loop: true,
        autoplay: !true
      }
    );

    this.soundButton = new BABYLON.Sound(
      "sound-button",
      "./audio/button.mp3",
      this.scene,
      null
    );

    this.soundExplode = new BABYLON.Sound(
      "sound-explode",
      "./audio/explode.mp3",
      this.scene,
      null
    );

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

    //    this.gotoMainMenu();
    this.gotoGamePlaying();
  }

  private registerTrigger(callback: () => void) {
    if (hasVirtualDisplays()) {
      const { VRHelper } = this;
      const camera = VRHelper.webVRCamera;
      camera.leftController.onTriggerStateChangedObservable.add(eventData => {
        if (eventData.value === 1) {
          camera.leftController.onTriggerStateChangedObservable.clear();
          callback();
        }
      });
    } else {
      const wrapper = () => {
        window.removeEventListener("click", wrapper);
        callback();
      };

      window.addEventListener("click", wrapper);
    }
  }

  private gotoMainMenu() {
    this.level.reset();

    this.player.lookAt(new BABYLON.Vector3(2, 5, 3));

    const menuScreen = new MainMenu();
    menuScreen.create(this.scene);

    this.registerTrigger(() => {
      this.soundButton.play();

      menuScreen.close().addOnce(() => {
        this.gotoGamePlaying();
      });
    });
  }

  private gotoGamePlaying() {
    this.playerScore = 0;
    this.playerAttempts = Game.SHOT_ATTEMPTS;

    const bubbleFactory = new BubbleFactory(this.scene);

    this.level.insertBubbleLayer(bubbleFactory);
    // this.uiManager.showHUD().setScore(this.playerScore);

    let shotBubble: Bubble = null;

    const hud = new GameHUD();
    hud.create(this.scene);

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

        // this.uiManager.updatePlacement(
        //   VRHelper.position.add(leftController.position),
        //   leftController.getForwardRay().direction,
        //   1
        // );

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
        this.scene.onBeforeRenderObservable.addOnce(() => {
          onDestroyBubble(bubble);
        });
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

            this.playerScore += Game.SHOOT_POWER;
            // this.uiManager.showHUD().setScore(this.playerScore);

            this.soundExplode.play();
            bubble.dispose();
          })
        );

        this.playerAttempts = Game.SHOT_ATTEMPTS;
      }

      if (this.level.getBubbles().some(Level.belowBaseline)) {
        onCleanUp();

        hud.close().addOnce(() => {
          // Game over condition reached
          this.gotoGameOver();
        });
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
  private gotoGameOver() {
    const gameOverScreen = new GameOver();
    gameOverScreen.create(this.scene, this.playerScore);

    const confetti = Particles.createConfetti(
      this.scene,
      new BABYLON.Vector3(0, 15, 0)
    );

    this.registerTrigger(() => {
      this.soundButton.play();

      gameOverScreen.close().addOnce(() => {
        confetti.stop();
        this.gotoMainMenu();
      });
    });
  }
}
