import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";
import { Theme } from "../assets";
import { Colors, ColorMap } from "../objects/bubble";
import { createAnimationEnter, createAnimationExit, applyColors } from "../utilities";
import { AbstractGUI } from "./gui";
import { applyAnimation, AnimationSpringOpen, AnimationSpringClose } from "../services/animations";

export class HUDGUI extends AbstractGUI {
  private rectAttempts: GUI.Rectangle;
  private bubble: BABYLON.Mesh;
  private textScore: GUI.TextBlock;

  protected release() {
    if (this.textScore) {
      this.textScore.dispose();
      this.textScore = null;
    }

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

    // Add shot attemps bar to glass background
    const progress = this.createProgressBlock();
    progress.wrapper.topInPixels = 35;
    glass.addControl(progress.wrapper);

    this.textScore = textScore;
    this.rectAttempts = progress.inner;
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
    if (!this.textScore) {
      return;
    }

    const counter = this.plane.onBeforeDrawObservable.add(() => {
      let currentScore = Number.parseInt(this.textScore.text);
      if (Number.isNaN(currentScore)) {
        currentScore = 0;
      }

      currentScore += Math.round(Math.ceil((score - currentScore) / 500));

      if (currentScore >= score) {
        currentScore = score;
        this.plane.onBeforeDrawObservable.remove(counter);
      }

      this.textScore.text = `${currentScore}`;
    });
  }

  public setBubble(color: Colors) {
    if (!this.plane) {
      return;
    }

    const animateInsertBubble = () => {
      const scene = this.plane.getScene();
      const sphere = BABYLON.MeshBuilder.CreateSphere(
        "sphere",
        {
          segments: 1,
          diameter: 0.25
        },
        scene
      );
      this.plane.addChild(sphere);

      sphere.scaling.setAll(0);
      sphere.position.set(0.65, 0.175, -0.1);

      sphere.onBeforeDrawObservable.add(() => {
        const p = 0.01; // Date.now() / 10000;
        const a = new BABYLON.Vector3(Math.sin(p), Math.cos(p * 0.7), Math.cos(p * 0.4)).normalize();

        sphere.rotate(a, 0.05);
      });

      createAnimationEnter("scaling", sphere);

      const material = new BABYLON.StandardMaterial(`bubble.material`, scene);
      material.disableLighting = true;
      material.emissiveColor = BABYLON.Color3.White();
      material.diffuseColor = BABYLON.Color3.White();

      applyColors(sphere, ColorMap.get(color));

      sphere.material = material;

      this.bubble = sphere;
    };

    if (this.bubble) {
      createAnimationExit("scaling", this.bubble).onAnimationEndObservable.addOnce(() => {
        this.plane.removeChild(this.bubble);
        this.bubble.dispose();
        this.bubble = null;
        animateInsertBubble();
      });
    } else {
      animateInsertBubble();
    }
  }

  public setLevel(percent: number) {
    if (!this.rectAttempts) {
      return;
    }
    this.rectAttempts.width = `${Math.max(0, Math.min(100, percent))}%`;
  }
}
