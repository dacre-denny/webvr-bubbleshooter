import * as BABYLON from "babylonjs";
import { BubbleFactory } from "./bubbleFactory";
import { GameOverGUI, HUDGUI, LoadingGUI, MenuGUI } from "./gui";
import { Bubble } from "./objects/bubble";
import { Level } from "./objects/level";
import { Particles } from "./services/particles";
import { Player } from "./objects/player";
import { ActionQueue } from "./objects/queue";
import { AssetSounds, Resources } from "./services/resources";
import { randomColor } from "./utilities";
import { CannonParticles } from "./particles/cannon";

export class Game {
  static readonly SHOOT_POWER = 10;
  static readonly SHOT_ATTEMPTS = 4;
  static readonly SCORE_INCREMENT = 10;

  private resources: Resources;

  private onUserMoveObservable = new BABYLON.Observable<BABYLON.Ray>();
  private onUserTriggerObservable = new BABYLON.Observable<void>();

  private engine: BABYLON.Engine;
  private VRHelper: BABYLON.VRExperienceHelper;
  private scene: BABYLON.Scene;
  private player: Player;
  private level: Level;

  // private gameScore: number;

  constructor(canvasElement: string) {
    const canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
    this.engine = new BABYLON.Engine(
      canvas,
      false,
      {
        antialias: false,
        autoEnableWebVR: true,
        disableWebGL2Support: true,
        useHighPrecisionFloats: false
      },
      false
    );
    this.scene = new BABYLON.Scene(this.engine);
    this.resources = new Resources(this.scene);

    const AmmoJSPlugin = new BABYLON.AmmoJSPlugin();
    this.scene.enablePhysics(BABYLON.Vector3.Zero(), AmmoJSPlugin);
    this.scene.getPhysicsEngine().setGravity(new BABYLON.Vector3(0, 0, 0));
    this.scene.autoClear = false;
    this.scene.autoClearDepthAndStencil = false;

    this.level = new Level();
    this.player = new Player();

    this.VRHelper = this.scene.createDefaultVRExperience({
      createDeviceOrientationCamera: true,
      trackPosition: true
    });
    this.VRHelper.enableInteractions();

    this.EventConfig();

    this.level.create(this.scene);
    this.player.create(this.scene);
    this.player.lookAt(new BABYLON.Vector3(2, 5, 3));

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });

    this.VRHelper.onAfterEnteringVRObservable.add(() => {
      this.VRHelper.currentVRCamera.position.set(3.75, -5, -3.75);
    });
    this.VRHelper.onExitingVRObservable.add(() => {
      this.VRHelper.currentVRCamera.position.set(0, 0, 0);
    });

    this.showLoading();
  }

  private EventConfig() {
    const { VRHelper } = this;
    const camera = VRHelper.webVRCamera;
    const canvas = this.engine.getRenderingCanvas();

    // The canvas/window resize event handler.
    window.addEventListener("resize", () => {
      this.engine.resize();
    });

    camera.onControllerMeshLoadedObservable.add(() => {
      camera.onAfterCheckInputsObservable.add(() => {
        const [controller] = camera.controllers;
        if (controller) {
          this.onUserMoveObservable.notifyObservers(new BABYLON.Ray(controller.devicePosition, controller.getForwardRay().direction));
        }
      });

      camera.controllers.forEach(controller => {
        controller.onTriggerStateChangedObservable.add(eventData => {
          this.onUserTriggerObservable.notifyObservers();
        });
      });
    });

    canvas.addEventListener("click", () => {
      this.onUserTriggerObservable.notifyObservers();
    });

    canvas.addEventListener("mousemove", () => {
      const { currentVRCamera } = VRHelper;

      this.onUserMoveObservable.notifyObservers(currentVRCamera.getForwardRay());
    });
  }

  private showLoading() {
    // Create and display loading GUI
    const loading = new LoadingGUI(this.scene, this.resources);
    loading.open();

    // Reset and bind loading menu placement to user movement
    this.onUserMoveObservable.clear();
    this.onUserMoveObservable.add((ray: BABYLON.Ray) => loading.place(ray));

    // Reset resource loading events on resources servicee
    this.resources.onFinish.clear();
    this.resources.onProgress.clear();

    // Bind resource loading events on resources service
    this.resources.onFinish.addOnce((errors: Error[]) => {
      if (errors.length > 0) {
        // Report error notification to user if any load time errors
        alert(`Failed to load assets. See console for details.`);
        console.error(`Failed to load assets.`, errors);
        return;
      }
      loading.onClose.addOnce(() => {
        // Configure background music
        const music = this.resources.getSound(AssetSounds.SOUND_MUSIC);
        music.loop = true;
        music.play();

        this.showGame();
        //this.showMenu();
      });

      loading.close();
    });

    this.resources.onProgress.add(percentage => loading.setPercentage(percentage));

    this.resources.loadResources();
  }

  private showMenu() {
    // Create and display menu GUI
    const menu = new MenuGUI(this.scene, this.resources);
    menu.onClose.addOnce(() => {
      this.showGame();
    });
    menu.open();

    // Reset and bind loading menu placement to user movement
    this.onUserMoveObservable.clear();
    this.onUserMoveObservable.add((ray: BABYLON.Ray) => menu.place(ray));

    // Reset and bind user menu close to user trigger
    this.onUserTriggerObservable.clear();
    this.onUserTriggerObservable.add(() => {
      menu.close();
    });
  }

  private showGameOver(gameScore: number) {
    // Create and display game over GUI
    const gameOver = new GameOverGUI(this.scene, this.resources);
    gameOver.setScore(gameScore);
    gameOver.open();

    // Reset and bind loading menu placement to user movement
    this.onUserMoveObservable.clear();
    this.onUserMoveObservable.add((ray: BABYLON.Ray) => gameOver.place(ray));

    // Reset and bind user menu close to user trigger
    this.onUserTriggerObservable.clear();
    this.onUserTriggerObservable.add(() => {
      gameOver.close();

      confetti.stop();
      this.showMenu();
    });

    const confetti = Particles.createConfetti(this.scene, new BABYLON.Vector3(0, 15, 0));
  }

  private showGame() {
    const bubbleFactory = new BubbleFactory(this.scene);
    this.level.insertBubbleLayer(bubbleFactory);

    let gameScore = 0;
    let nextBubbleColor = randomColor();
    let shotAttempts = Game.SHOT_ATTEMPTS;
    let shotBubble: Bubble = null;

    const cannonParticles = new CannonParticles(this.scene, this.resources);
    const burstQue = new ActionQueue();
    const hud = new HUDGUI(this.scene, this.resources);

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
      this.onUserMoveObservable.clear();
      this.onUserTriggerObservable.clear();
    };

    const onUpdatePlayer = (ray: BABYLON.Ray) => {
      hud.place(ray);

      const { pickedPoint, hit } = this.scene.pickWithRay(ray, (m: BABYLON.AbstractMesh) => Bubble.isBubble(m) || Level.isWall(m), false);

      if (hit) {
        pickedPoint.y = Math.max(pickedPoint.y, Level.BASELINE);

        this.player.lookAt(pickedPoint);
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
      if (BABYLON.Vector3.Distance(bubble.getPosition(), this.player.getPosition()) > 20) {
        this.scene.onBeforeRenderObservable.addOnce(() => {
          onDestroyBubble(bubble);
        });
      }
    };

    const onShootBubble = () => {
      if (canShootBubble()) {
        const bubble = bubbleFactory.createBubble(nextBubbleColor);
        bubble.setPosition(this.player.getPosition());
        bubble.setVelocity(this.player.getDirection().scale(Game.SHOOT_POWER));

        cannonParticles.shoot(this.player.getPosition(), this.player.getDirection(), bubble.getColor3());

        this.resources.getSound(AssetSounds.SOUND_SHOOT).play();

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
            gameScore += Game.SHOOT_POWER;

            hud.setScore(gameScore);
            this.resources.getSound(AssetSounds.SOUND_POP).play();

            onDestroyBubble(pluckedBubble);
          })
        );

        // shotAttempts = Game.SHOT_ATTEMPTS;
        shotAttempts = Math.min(shotAttempts + 1, Game.SHOT_ATTEMPTS);
      }

      hud.setAttempts((100 * shotAttempts) / Game.SHOT_ATTEMPTS);
      // hud.setAlert(this.level.getBubbles().some(Level.almostBelowBaseline));

      if (this.level.getBubbles().some(Level.belowBaseline)) {
        onCleanUp();
        this.level.reset();

        hud.onClose.addOnce(() => {
          // Game over condition reached
          this.showGameOver(gameScore);
        });
        hud.close();
      }
    };

    this.onUserMoveObservable.add(onUpdatePlayer);
    this.onUserTriggerObservable.add(onShootBubble);

    hud.open();
    hud.setBubble(nextBubbleColor);
    hud.setScore(gameScore);
    hud.setAttempts(100);
  }
}
