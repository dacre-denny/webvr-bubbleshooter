import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";
import { Theme } from "../assets";
import { Colors } from "../objects/bubble";
import { AnimationSpringClose, AnimationSpringOpen, applyAnimation } from "../services/animations";
import { AbstractGUI } from "./gui";

export class HUDGUI extends AbstractGUI {
  private onBubbleAnimate: BABYLON.Observer<BABYLON.Scene>;
  private attempts: GUI.Rectangle;
  private bubbleInstance: BABYLON.InstancedMesh;
  private score: GUI.TextBlock;

  private releaseBubble() {
    if (this.bubbleInstance) {
      if (this.plane) {
        this.plane.removeChild(this.bubbleInstance);
      }
      this.bubbleInstance.dispose();
      this.bubbleInstance = null;
    }

    if (this.onBubbleAnimate) {
      this.scene.onAfterPhysicsObservable.remove(this.onBubbleAnimate);
      this.onBubbleAnimate = null;
    }
  }

  protected release() {
    if (this.score) {
      this.score.dispose();
      this.score = null;
    }

    if (this.attempts) {
      this.attempts.dispose();
      this.attempts = null;
    }

    this.releaseBubble();

    super.release();
  }

  protected create() {
    super.create(2.5, 1.5);

    // Create panel
    const panel = new GUI.StackPanel("panel");
    this.texture.addControl(panel);

    // Add glass background to hud panel
    const glass = this.createRectangleGlass();
    glass.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    glass.heightInPixels = 150;
    panel.addControl(glass);

    // Add score display to glass background
    const textScore = this.createTextBlock(``, 60, Theme.COLOR_BLUE);
    textScore.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    textScore.topInPixels = -25;
    textScore.paddingLeftInPixels = 15;
    glass.addControl(textScore);

    // Add shot attempt bar to glass background
    const attempts = this.createProgressBlock();
    attempts.wrapper.topInPixels = 35;
    glass.addControl(attempts.wrapper);

    this.score = textScore;
    this.attempts = attempts.inner;
  }

  public close() {
    if (!this.plane) {
      return;
    }

    applyAnimation(this.plane, AnimationSpringClose).onAnimationEndObservable.addOnce(() => {
      this.onCloseObservable.notifyObservers();
      this.release();
    });
  }

  public open() {
    this.create();

    this.plane.scaling = BABYLON.Vector3.Zero();
    applyAnimation(this.plane, AnimationSpringOpen);
  }

  public setScore(score: number) {
    if (!this.score) {
      return;
    }

    let frac = 0;
    let startScore = Number.parseInt(this.score.text);
    if (Number.isNaN(startScore)) {
      startScore = 0;
    }

    const counter = this.plane.onBeforeDrawObservable.add(() => {
      frac += 0.025 * (1 - frac * frac);

      const displayScore = Math.min(score, Math.ceil(frac * (score - startScore) + startScore));

      if (displayScore === score) {
        this.plane.onBeforeDrawObservable.remove(counter);
      }

      this.score.text = `${displayScore}`;
    });
  }

  public setBubble(color: Colors) {
    if (!this.plane) {
      return;
    }

    const applyNextBubble = () => {
      const bubble = this.resource.getBubble(color);
      const bubbleInstance = bubble.createInstance(`${this.scene.getUniqueId()}`);

      bubbleInstance.scaling.setAll(0);
      bubbleInstance.position.set(0.65, 0.175, -0.1);

      this.onBubbleAnimate = this.scene.onAfterPhysicsObservable.add(() => {
        const dt = 0.01;
        const axis = new BABYLON.Vector3(Math.sin(dt), Math.cos(dt * 0.7), Math.cos(dt * 0.4)).normalize();

        bubbleInstance.rotate(axis, dt);
      });

      applyAnimation(bubbleInstance, AnimationSpringOpen);

      this.bubbleInstance = bubbleInstance;
    };

    if (this.bubbleInstance) {
      applyAnimation(this.bubbleInstance, AnimationSpringClose).onAnimationEndObservable.addOnce(() => {
        this.releaseBubble();
        applyNextBubble();
      });
    } else {
      applyNextBubble();
    }
  }

  public setAttempts(percent: number) {
    if (!this.attempts) {
      return;
    }

    this.attempts.width = `${Math.max(0, Math.min(100, percent))}%`;
  }
}
