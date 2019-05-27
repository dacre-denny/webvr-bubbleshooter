import * as BABYLON from "babylonjs";
import { BubbleFactory } from "./bubbleFactory";
import { Bubble } from "./objects/bubble";
import { Level } from "./objects/level";
import { Particles } from "./objects/particles";
import { Player } from "./objects/player";
import { ActionQueue } from "./objects/queue";
import { GameOver } from "./ui/gameover";
import { GameHUD } from "./ui/hud";
import { MainMenu } from "./ui/menu";
import { randomColor } from "./utilities";

export class Game {
  static readonly SHOOT_POWER = 10;
  static readonly SHOT_ATTEMPTS = 4;
  static readonly SCORE_INCREMENT = 10;

  private userAction: (event?: MouseEvent) => void;
  private userMoveAction: (event?: MouseEvent) => void;
  private engine: BABYLON.Engine;
  private VRHelper: BABYLON.VRExperienceHelper;
  private scene: BABYLON.Scene;
  private player: Player;
  private level: Level;

  private soundMusic: BABYLON.Sound;
  private soundShoot: BABYLON.Sound;
  private soundGameOver: BABYLON.Sound;
  private soundButton: BABYLON.Sound;
  private soundPop: BABYLON.Sound;

  private gameScore: number;

  constructor(canvasElement: string) {
    const canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
    this.engine = new BABYLON.Engine(canvas, false);
    this.scene = new BABYLON.Scene(this.engine);

    const AmmoJSPlugin = new BABYLON.AmmoJSPlugin();
    this.scene.enablePhysics(BABYLON.Vector3.Zero(), AmmoJSPlugin);
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
        autoplay: true
      }
    );

    this.soundGameOver = new BABYLON.Sound(
      "sound-gameover",
      "./audio/gameover.mp3",
      this.scene,
      null
    );

    this.soundButton = new BABYLON.Sound(
      "sound-button",
      "./audio/button.mp3",
      this.scene,
      null
    );

    this.soundShoot = new BABYLON.Sound(
      "sound-shoot",
      "./audio/shoot.mp3",
      this.scene,
      null
    );

    this.soundPop = new BABYLON.Sound(
      "sound-pop",
      "./audio/pop.mp3",
      this.scene,
      null
    );

    this.VRHelper = this.scene.createDefaultVRExperience({
      createDeviceOrientationCamera: true,
      trackPosition: true
    });
    this.VRHelper.enableInteractions();

    this.EventConfig();

    this.level.create(this.scene);
    this.player.create(this.scene);

    // The canvas/window resize event handler.
    window.addEventListener("resize", () => {
      this.engine.resize();
    });

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });

    this.VRHelper.onAfterEnteringVRObservable.add(() => {
      this.VRHelper.currentVRCamera.position.set(3.75, -5, -3.75);
    });
    this.VRHelper.onExitingVRObservable.add(() => {
      this.VRHelper.currentVRCamera.position.set(0, 0, 0);
    });

    //this.gotoMainMenu();
    this.gotoGamePlaying();
  }

  private EventConfig() {
    const { VRHelper } = this;
    const camera = VRHelper.webVRCamera;
    const canvas = this.engine.getRenderingCanvas();

    camera.onControllerMeshLoadedObservable.add(() => {
      camera.onAfterCheckInputsObservable.add(() => {
        if (this.userMoveAction) {
          this.userMoveAction();
        }
      });

      camera.controllers.forEach(controller => {
        controller.onTriggerStateChangedObservable.add(eventData => {
          if (eventData.value === 1 && this.userAction) {
            this.userAction();
          }
        });
      });
    });

    canvas.addEventListener("click", (event: MouseEvent) => {
      if (this.userAction) {
        this.userAction(event);
      }
    });

    canvas.addEventListener("mousemove", (event: MouseEvent) => {
      if (this.userMoveAction) {
        this.userMoveAction(event);
      }
    });
  }

  private setUserMoveAction(callback: (event?: MouseEvent) => void) {
    this.userMoveAction = callback;
  }

  private setUserTriggerAction(callback: () => void) {
    this.userAction = callback;
  }

  private gotoMainMenu() {
    this.player.lookAt(new BABYLON.Vector3(2, 5, 3));

    const menuScreen = new MainMenu();
    menuScreen.create(this.scene);

    this.setUserTriggerAction(() => {
      this.soundButton.play();

      menuScreen.close().addOnce(() => {
        this.gotoGamePlaying();
      });
    });

    this.setUserMoveAction(() => {
      const [controller] = this.VRHelper.webVRCamera.controllers;
      if (controller) {
        menuScreen.place(
          controller.devicePosition,
          controller.getForwardRay().direction
        );
      }
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
      this.setUserTriggerAction(null);
      this.setUserMoveAction(null);
    };

    const onUpdatePlayer = (event?: MouseEvent) => {
      if (event instanceof MouseEvent) {
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
      } else {
        const [controller] = this.VRHelper.webVRCamera.controllers;
        if (controller) {
          const ray = controller.getForwardRay();

          hud.place(controller.devicePosition, ray.direction);

          const pickingInfo = this.scene.pickWithRay(
            ray,
            (m: BABYLON.AbstractMesh) => Bubble.isBubble(m) || Level.isWall(m),
            false
          );

          if (pickingInfo.hit) {
            const target = pickingInfo.pickedPoint;

            target.y = Math.max(target.y, Level.BASELINE);

            this.player.lookAt(target);
          }
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
          this.setUserTriggerAction(onShootBubble);
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

        this.soundShoot.play();

        bubble.getMesh().onAfterWorldMatrixUpdateObservable.add(() => {
          onUpdateBubble(bubble);
        });

        this.level.registerCollision(bubble, () =>
          this.scene.onAfterPhysicsObservable.addOnce(() => {
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
      if (!insertKey) {
        onDestroyBubble(bubble);
        return;
      }
      const pluckedKeys = this.level.getLocalKeysOfSameColor(insertKey);

      if (pluckedKeys.size < 3) {
        // If not bubbles to burst, then decrement shot attempts
        shotAttempts--;

        // If no shots remaining then add bubble layer to level and
        // reset shot attempts
        if (shotAttempts <= 0) {
          this.level.insertBubbleLayer(bubbleFactory);
          shotAttempts = Game.SHOT_ATTEMPTS;
        }
      } else {
        const pluckedBubbles = this.level.removeBubbleByKeys(pluckedKeys);

        // If bubbles to burst have been found, add to the burst queue
        pluckedBubbles.forEach(pluckedBubble =>
          burstQue.add(() => {
            this.gameScore += Game.SHOOT_POWER;

            hud.setScore(this.gameScore);
            this.soundPop.play();

            onDestroyBubble(pluckedBubble);
          })
        );

        // shotAttempts = Game.SHOT_ATTEMPTS;
        shotAttempts = Math.min(shotAttempts + 1, Game.SHOT_ATTEMPTS);
      }

      hud.setLevel((100 * shotAttempts) / Game.SHOT_ATTEMPTS);
      hud.setAlert(this.level.getBubbles().some(Level.almostBelowBaseline));

      if (this.level.getBubbles().some(Level.belowBaseline)) {
        onCleanUp();
        this.level.reset();

        hud.close().addOnce(() => {
          // Game over condition reached
          this.gotoGameOver();
        });
      }
    };

    this.setUserTriggerAction(onShootBubble);
    this.setUserMoveAction(onUpdatePlayer);

    hud.create(this.scene);
    hud.setBubble(nextBubbleColor);
    hud.setScore(this.gameScore);
    hud.setLevel(100);
  }

  private gotoGameOver() {
    this.soundGameOver.play();

    const gameOverScreen = new GameOver();
    gameOverScreen.create(this.scene, this.gameScore);

    const confetti = Particles.createConfetti(
      this.scene,
      new BABYLON.Vector3(0, 15, 0)
    );

    this.setUserMoveAction(() => {
      const [controller] = this.VRHelper.webVRCamera.controllers;
      if (controller) {
        gameOverScreen.place(
          controller.devicePosition,
          controller.getForwardRay().direction
        );
      }
    });

    this.setUserTriggerAction(() => {
      this.soundButton.play();

      gameOverScreen.close().addOnce(() => {
        confetti.stop();
        this.gotoMainMenu();
      });
    });
  }
}
