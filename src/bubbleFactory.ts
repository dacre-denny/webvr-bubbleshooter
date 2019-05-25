import * as BABYLON from "babylonjs";
import { Bubble, Colors, ColorMap } from "./objects/bubble";
import { applyColors } from "./utilities";

export class BubbleFactory {
  private bubbles: Map<Colors, BABYLON.Mesh>;
  private count: number;

  private createColor(
    scene: BABYLON.Scene,
    material: BABYLON.StandardMaterial,
    color: BABYLON.Color3
  ) {
    var sphere = BABYLON.MeshBuilder.CreateSphere(
      "sphere",
      {
        segments: 1,
        diameter: Bubble.RADIUS * 2,
        updatable: true
      },
      scene
    );
    //If no colors add colors to sphere
    applyColors(sphere, color);

    sphere.material = material;
    sphere.isVisible = false;
    return sphere;
  }

  private create(scene: BABYLON.Scene) {
    const bubbles = new Map<Colors, BABYLON.Mesh>();

    const material = new BABYLON.StandardMaterial(`bubble.material`, scene);
    material.disableLighting = true;
    material.emissiveColor = BABYLON.Color3.White();
    material.diffuseColor = BABYLON.Color3.White();

    for (const [key, color] of ColorMap.entries()) {
      const mesh = this.createColor(scene, material, color);
      bubbles.set(key, mesh);
    }

    return bubbles;
  }

  constructor(scene: BABYLON.Scene) {
    this.count = 0;
    this.bubbles = this.create(scene);
  }

  public createBubble(color: Colors): Bubble {
    // const color = randomColor();
    const mesh = this.bubbles.get(color);

    const instance = mesh.createInstance(`bubble.mesh.instance.${this.count}`);
    this.count++;

    return new Bubble(instance, color);
  }
}
