import * as BABYLON from "babylonjs";
import { Bubble, Colors } from "./objects/bubble";
import { BubbleFactory } from "./bubbleFactory";
import { Player } from "./objects/player";
import { Level } from "./objects/level";
import { Particles } from "./objects/particles";
import { createAnimationExit, randomColor } from "./utilities";
import { ActionQueue } from "./objects/queue";
import { GameOver } from "./ui/gameover";
import { AssetsManager } from "babylonjs";
import { MainMenu } from "./ui/menu";
import { GameHUD } from "./ui/hud";

export class Game {
  static readonly SHOOT_POWER = 10;
  static readonly SHOT_ATTEMPTS = 3;
  static readonly SCORE_INCREMENT = 10;

  private userAction: () => void;
  private userActionExit: BABYLON.Observer<BABYLON.VRExperienceHelper>;
  private assetManager: AssetsManager;
  private engine: BABYLON.Engine;
  private VRHelper: BABYLON.VRExperienceHelper;
  private scene: BABYLON.Scene;
  private player: Player;
  private level: Level;

  private soundMusic: BABYLON.Sound;
  private soundButton: BABYLON.Sound;
  private soundExplode: BABYLON.Sound;

  private gameScore: number;

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

    this.VRHelper.onEnteringVRObservable.add(() => {
      this.VRHelper.webVRCamera.position.set(0, -5, -3.75);
    });
    this.VRHelper.onExitingVRObservable.add(() => {
      this.VRHelper.currentVRCamera.position.set(0, 0, -15);
    });

    this.gotoMainMenu();
    //this.gotoGamePlaying();
  }

  private isVRReady() {
    return (
      this.VRHelper.isInVRMode &&
      this.VRHelper.webVRCamera.controllers.length > 0
    );
  }

  private setUserAction(callback: () => void) {
    const canvas = this.engine.getRenderingCanvas();
    canvas.removeEventListener("click", this.userAction);
    const { VRHelper } = this;
    const camera = VRHelper.webVRCamera;

    if (this.userActionExit) {
      VRHelper.onExitingVRObservable.remove(this.userActionExit);
      this.userActionExit = null;
    }
    camera.onControllerMeshLoadedObservable.clear();

    camera.controllers.forEach(controller =>
      controller.onTriggerStateChangedObservable.clear()
    );

    const vrControllerCallback = (eventData: BABYLON.ExtendedGamepadButton) => {
      document.title = `${eventData.value}`;
      if (eventData.value === 1) {
        callback();
      }
    };

    if (callback) {
      const [controller] = camera.controllers;
      if (controller) {
        controller.onTriggerStateChangedObservable.add(vrControllerCallback);
        canvas.removeEventListener("click", callback);
      } else {
        canvas.addEventListener("click", callback);
      }
    }
    camera.onControllerMeshLoadedObservable.add(() => {
      const [controller] = camera.controllers;
      if (controller) {
        controller.onTriggerStateChangedObservable.add(vrControllerCallback);
        canvas.removeEventListener("click", callback);
      }
    });

    this.userActionExit = VRHelper.onExitingVRObservable.add(() => {
      camera.controllers.forEach(controller =>
        controller.onTriggerStateChangedObservable.clear()
      );

      canvas.addEventListener("click", callback);
    });

    this.userAction = callback;
  }

  private gotoMainMenu() {
    this.player.lookAt(new BABYLON.Vector3(2, 5, 3));

    const menuScreen = new MainMenu();
    menuScreen.create(this.scene);

    this.setUserAction(() => {
      this.soundButton.play();

      menuScreen.close().addOnce(() => {
        this.gotoGamePlaying();
      });
    });
  }

  private gotoGamePlaying() {
    this.gameScore = 0;

    const bubbleFactory = new BubbleFactory(this.scene);
    this.level.insertBubbleLayer(bubbleFactory);

    let nextBubbleColor = randomColor();
    let shotAttempts = Game.SHOT_ATTEMPTS;
    let shotBubble: Bubble = null;

    const VRHelper = this.VRHelper;
    const camera = VRHelper.webVRCamera;
    const burstQue = new ActionQueue();
    const hud = new GameHUD();

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
      window.removeEventListener("mousemove", onUpdatePlayer);
      this.setUserAction(null);
    };

    const onUpdatePlayer = (event?: MouseEvent | BABYLON.Camera) => {
      if (this.isVRReady()) {
        const leftController = camera.leftController;
        const ray = leftController.getForwardRay();

        document.title = `${ray.direction.x},${ray.direction.y},${
          ray.direction.z
        }`;

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
      bubble.burst();
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
          this.setUserAction(onShootBubble);
        });
      }
    };

    const onShootBubble = () => {
      if (canShootBubble()) {
        const bubble = bubbleFactory.createBubble(nextBubbleColor);
        bubble.setPosition(this.player.getPosition());
        bubble.setVelocity(this.player.getDirection().scale(Game.SHOOT_POWER));
        Particles.createShoot(
          this.scene,
          this.player.getPosition().add(this.player.getDirection().scale(2)),
          this.player.getDirection(),
          bubble.getColor3()
        );

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
        nextBubbleColor = randomColor();
        hud.setBubble(nextBubbleColor);
      }
    };

    const onStoppedBubble = (bubble: Bubble) => {
      // Insert bubble into level
      const insertKey = this.level.insertBubble(bubble);
      const bubbles = this.level.pluckLocalBubblesOfSameColor(insertKey);

      if (bubbles.length <= 1) {
        // If not bubbles to burst, then decrement shot attempts
        shotAttempts--;

        // If no shots remaining then add bubble layer to level and
        // reset shot attempts
        if (shotAttempts <= 0) {
          this.level.insertBubbleLayer(bubbleFactory);
          shotAttempts = Game.SHOT_ATTEMPTS;
        }
      } else {
        // If bubbles to burst have been found, add to the burst queue
        bubbles.forEach(bubble =>
          burstQue.add(() => {
            this.gameScore += Game.SHOOT_POWER;

            hud.setScore(this.gameScore);
            /*
            this.soundExplode.play();
            */

            onDestroyBubble(bubble);
          })
        );

        shotAttempts = Game.SHOT_ATTEMPTS;
      }

      hud.setLevel((100 * shotAttempts) / Game.SHOT_ATTEMPTS);

      if (this.level.getBubbles().some(Level.belowBaseline)) {
        onCleanUp();
        this.level.reset();

        hud.close().addOnce(() => {
          // Game over condition reached
          this.gotoGameOver();
        });
      }
    };

    if (!this.isVRReady()) {
      window.addEventListener("mousemove", onUpdatePlayer);
    }

    this.setUserAction(onShootBubble);

    hud.create(this.scene);
    hud.setLevel(100);
  }

  private gotoGameOver() {
    const gameOverScreen = new GameOver();
    gameOverScreen.create(this.scene, this.gameScore);

    const confetti = Particles.createConfetti(
      this.scene,
      new BABYLON.Vector3(0, 15, 0)
    );

    this.setUserAction(() => {
      this.soundButton.play();

      gameOverScreen.close().addOnce(() => {
        confetti.stop();
        this.gotoMainMenu();
      });
    });
  }
}
