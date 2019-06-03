import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";
import { Theme } from "../assets";
import { AnimationSpringOpen, applyAnimation, AnimationSpringClose } from "../services/animations";
import { AssetSounds, AssetTextures } from "../services/resources";
import { clockTime, createAnimationExit } from "../utilities";
import { AbstractGUI } from "./gui";

export class MenuGUI extends AbstractGUI {
  private title: GUI.Image;

  private createHeadingImage() {
    const texture = this.resource.getTexture(AssetTextures.IMAGE_GAMETITLE);
    const image = new GUI.Image(texture.name, texture.url);

    const dimensions = texture.getSize();
    const ratio = dimensions.width / dimensions.height;

    image.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    image.heightInPixels = 350 / ratio;
    image.widthInPixels = 350;

    return image;
  }

  protected release() {
    if (this.title) {
      this.title.dispose();
      this.title = null;
    }

    super.release();
  }

  protected create() {
    super.create(4.5, 1.5);

    const panel = new GUI.StackPanel("panel");
    panel.heightInPixels = 150;
    this.texture.addControl(panel);

    const title = this.createHeadingImage();
    panel.addControl(title);

    const glass = this.createRectangleGlass();
    glass.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    glass.paddingTopInPixels = -30;
    glass.heightInPixels = 30;
    panel.addControl(glass);

    glass.addControl(this.createTextBlock(`Pull trigger to play!`, 20, Theme.COLOR_BLUE));

    this.title = title;
  }

  public close() {
    if (!this.plane) {
      return;
    }

    this.resource.getSound(AssetSounds.SOUND_BUTTON).play();

    applyAnimation(this.plane, AnimationSpringClose).onAnimationEndObservable.addOnce(() => {
      this.onCloseObservable.notifyObservers();
      this.release();
    });
  }

  public open() {
    this.create();

    this.plane.scaling = BABYLON.Vector3.Zero();
    this.plane.onBeforeRenderObservable.add(() => {
      const time = clockTime();
      const scale = 1 + Math.sin(time) * 0.05;
      this.title.scaleX = scale;
      this.title.scaleY = scale;
      this.title.rotation = Math.sin(time * 0.3) * 0.05;
    });

    applyAnimation(this.plane, AnimationSpringOpen);
  }
}
