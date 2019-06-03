import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";
import { Resources } from "../services/resources";

export abstract class AbstractGUI {
  protected texture: GUI.AdvancedDynamicTexture;
  protected plane: BABYLON.Mesh;
  protected scene: BABYLON.Scene;
  protected resource: Resources;

  constructor(scene: BABYLON.Scene, resource: Resources) {
    this.scene = scene;
    this.resource = resource;
  }

  public place(ray: BABYLON.Ray) {
    this.plane.position.copyFrom(ray.origin.add(ray.direction.scale(2)));
    this.plane.setDirection(ray.direction);
  }

  public abstract close(): void;

  public abstract open(): void;
}
