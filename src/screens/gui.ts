import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";
import { createAnimationExit, createTextBlock, createAnimationEnter, createGlass } from "../utilities";
import { Theme, Assets } from "../assets";
import { Resources, AssetSounds } from "../services/resources";

export abstract class AbstractGUI {
  protected texture: GUI.AdvancedDynamicTexture;
  protected plane: BABYLON.Mesh;
  protected scene: BABYLON.Scene;
  protected resource: Resources;
  protected onCloseObservable: BABYLON.Observable<void>;

  constructor(scene: BABYLON.Scene, resource: Resources) {
    this.scene = scene;
    this.resource = resource;
    this.onCloseObservable = new BABYLON.Observable<void>();
  }

  public get onClose() {
    return this.onCloseObservable;
  }

  public place(ray: BABYLON.Ray) {
    this.plane.position.copyFrom(ray.origin.add(ray.direction.scale(2)));
    this.plane.setDirection(ray.direction);
  }

  public abstract close(): void;

  public abstract open(): void;
}
