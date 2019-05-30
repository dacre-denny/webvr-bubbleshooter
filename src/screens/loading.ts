import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";
import { Theme } from "../assets";
import { Colors, ColorMap } from "../objects/bubble";
import { createAnimationEnter, createAnimationExit, createGlass, createTextBlock, applyColors } from "../utilities";

export class LoadingGUI {
  private scene: BABYLON.Scene;
  private texture: GUI.AdvancedDynamicTexture;
  private plane: BABYLON.Mesh;
  private rectPercentage: GUI.Rectangle;
  private onCloseObservable: BABYLON.Observable<void>;

  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
    this.onCloseObservable = new BABYLON.Observable<void>();
  }

  public get onClose() {
    return this.onCloseObservable;
  }

  public place(position: BABYLON.Vector3, direction: BABYLON.Vector3) {
    this.plane.setDirection(direction);

    this.plane.position.copyFrom(position.add(direction.scale(2).add(this.plane.up.scale(-1))));
  }

  public close() {
    if (!this.plane) {
      return;
    }

    const exitAnimationEnd = createAnimationExit("scaling", this.plane).onAnimationEndObservable;

    exitAnimationEnd.add(() => {
      this.texture.dispose();
      this.plane.dispose();

      this.texture = null;
      this.plane = null;
      this.onCloseObservable.notifyObservers();
    });
  }

  public create() {
    if (this.plane) {
      return;
    }
    const scale = 0.45;
    const plane = BABYLON.MeshBuilder.CreatePlane(
      "menu",
      {
        size: 5,
        sourcePlane: new BABYLON.Plane(0, -1, 0, 0),
        width: 4 * scale,
        height: 1.5 * scale
      },
      this.scene
    );

    const texture = GUI.AdvancedDynamicTexture.CreateForMesh(plane, 400, 150, true);

    var panel = new GUI.StackPanel("panel");
    panel.heightInPixels = 150;
    panel.widthInPixels = 400;
    texture.addControl(panel);

    {
      const glass = createGlass();
      glass.height = "100%";
      glass.width = "100%";
      glass.paddingTop = "0%";

      panel.addControl(glass);
    }

    {
      const textScore = createTextBlock(`Loading`, 60, Theme.COLOR_BLUE);
      textScore.heightInPixels = 100;
      textScore.widthInPixels = 345;
      textScore.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;

      panel.addControl(textScore);
    }

    {
      const rectWrap = new GUI.Rectangle();
      rectWrap.heightInPixels = 20;
      rectWrap.widthInPixels = 345;
      rectWrap.cornerRadius = 100;
      rectWrap.background = Theme.COLOR_WHITE + "44";
      rectWrap.thickness = 0;

      const rectAttempts = new GUI.Rectangle();
      rectAttempts.height = `100%`;
      rectAttempts.width = `0%`;
      rectAttempts.cornerRadius = 100;
      rectAttempts.background = Theme.COLOR_BLUE;
      rectAttempts.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      rectAttempts.thickness = 0;

      rectWrap.addControl(rectAttempts);
      panel.addControl(rectWrap);

      this.rectPercentage = rectAttempts;
    }

    const position = new BABYLON.Vector3().addInPlace(BABYLON.Vector3.Up()).addInPlace(BABYLON.Vector3.Forward().scale(6));

    plane.setDirection(BABYLON.Vector3.Forward());
    plane.position.copyFrom(position);

    createAnimationEnter("scaling", plane);

    this.texture = texture;
    this.plane = plane;
  }

  public setPercentage(percent: number) {
    if (!this.rectPercentage) {
      return;
    }
    this.rectPercentage.width = `${Math.max(0, Math.min(100, percent))}%`;
  }
}
