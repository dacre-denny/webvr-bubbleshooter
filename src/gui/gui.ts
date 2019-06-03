import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";
import { Resources } from "../services/resources";
import { Theme } from "../assets";

export abstract class AbstractGUI {
  protected onCloseObservable: BABYLON.Observable<void>;
  protected texture: GUI.AdvancedDynamicTexture;
  protected plane: BABYLON.Mesh;
  protected scene: BABYLON.Scene;
  protected resource: Resources;

  constructor(scene: BABYLON.Scene, resource: Resources) {
    this.scene = scene;
    this.resource = resource;
    this.onCloseObservable = new BABYLON.Observable<void>();
  }

  protected createRectangleGlass() {
    const glass = new GUI.Rectangle("glass");
    glass.cornerRadius = 20;
    glass.heightInPixels = 100;
    glass.widthInPixels = 400;
    glass.background = Theme.COLOR_WHITE + "33";
    glass.thickness = 0;

    return glass;
  }

  protected createTextBlock(text: string, size: number, color: string = "white") {
    const textBlock = new GUI.TextBlock();
    textBlock.text = text;
    textBlock.fontSize = size;
    textBlock.heightInPixels = size + 10;
    textBlock.paddingBottomInPixels = 5;
    textBlock.paddingTopInPixels = 5;
    textBlock.color = color;
    textBlock.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;

    return textBlock;
  }

  protected createProgressBlock() {
    const wrapper = new GUI.Rectangle();
    wrapper.paddingLeft = 15;
    wrapper.paddingRight = 15;
    wrapper.heightInPixels = 20;
    wrapper.cornerRadius = 10;
    wrapper.background = Theme.COLOR_WHITE + "44";
    wrapper.thickness = 0;

    const inner = new GUI.Rectangle();
    inner.height = `100%`;
    inner.width = `0%`;
    inner.cornerRadius = 10;
    inner.background = Theme.COLOR_BLUE;
    inner.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    inner.thickness = 0;

    wrapper.addControl(inner);

    return { wrapper, inner };
  }

  protected release() {
    if (this.texture) {
      this.texture.dispose();
      this.texture = null;
    }

    if (this.plane) {
      this.plane.dispose();
      this.plane = null;
    }
  }

  protected create(width: number, height: number) {
    this.release();

    this.plane = BABYLON.MeshBuilder.CreatePlane(
      "menu",
      {
        sourcePlane: new BABYLON.Plane(0, -1, 0, 0),
        width,
        height
      },
      this.scene
    );

    this.plane.setDirection(BABYLON.Vector3.Forward());
    this.plane.position.copyFrom(new BABYLON.Vector3().addInPlace(BABYLON.Vector3.Up()).addInPlace(BABYLON.Vector3.Forward().scale(6)));

    this.texture = GUI.AdvancedDynamicTexture.CreateForMesh(this.plane, width * 300, height * 300, true);
  }

  public get onClose() {
    return this.onCloseObservable;
  }

  public place(ray: BABYLON.Ray) {
    if (!this.plane) {
      return;
    }

    this.plane.position.copyFrom(ray.origin.add(ray.direction.scale(2)));
    this.plane.setDirection(ray.direction);
  }

  public abstract close(): void;

  public abstract open(): void;
}
