import * as BABYLON from "babylonjs";
import { Bubble, Colors } from "./bubble";
import { randomColor } from "./utilities";

export class BubbleFactory {
  private bubbles: Map<Colors, BABYLON.Mesh>;
  private count: number;

  private create(scene: BABYLON.Scene) {
    const bubbles = new Map<Colors, BABYLON.Mesh>();

    const mapping = new Map<Colors, BABYLON.Color3>([
      [Colors.RED, BABYLON.Color3.Red()],
      [Colors.BLUE, BABYLON.Color3.Blue()],
      [Colors.GREEN, BABYLON.Color3.Green()],
      [Colors.YELLOW, BABYLON.Color3.Yellow()]
    ]);

    for (const [key, color] of mapping.entries()) {
      const material = new BABYLON.StandardMaterial(
        `bubble.material.${key}`,
        scene
      );
      material.diffuseColor = color;

      const mesh = BABYLON.MeshBuilder.CreateIcoSphere(
        `bubble.mesh.${key}`,
        { radius: 0.5, subdivisions: 1 },
        scene
      );

      mesh.isVisible = false;
      mesh.material = material;

      bubbles.set(key, mesh);
    }

    return bubbles;
  }

  constructor(scene: BABYLON.Scene) {
    this.count = 0;
    this.bubbles = this.create(scene);
  }

  public createBubble(): Bubble {
    const color = randomColor();
    const mesh = this.bubbles.get(color);

    const instance = mesh.createInstance(`bubble.mesh.instance.${this.count}`);
    this.count++;

    return new Bubble(instance, color);
  }
}
