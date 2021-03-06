import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";
import { AnimationSpringClose, AnimationSpringOpen, applyAnimation } from "../services/animations";
import { AbstractGUI } from "./gui";

export class LoadingGUI extends AbstractGUI {
  private percentage: GUI.Rectangle;

  protected release() {
    if (this.percentage) {
      this.percentage.dispose();
      this.percentage = null;
    }

    super.release();
  }

  protected create() {
    super.create(4, 1);

    // Create panel
    const panel = new GUI.StackPanel("panel");
    this.texture.addControl(panel);

    // Add glass background to loading panel
    const glass = this.createRectangleGlass();
    panel.addControl(glass);

    // Add loading progress to glass background
    const loading = this.createProgressBlock();
    glass.addControl(loading.wrapper);

    this.percentage = loading.inner;
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

  public setPercentage(percent: number) {
    if (!this.percentage) {
      return;
    }

    this.percentage.width = `${Math.max(0, Math.min(100, percent))}%`;
  }
}
