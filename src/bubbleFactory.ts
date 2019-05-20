import * as BABYLON from "babylonjs";
import { Bubble, Colors } from "./objects/bubble";
import { randomColor } from "./utilities";

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
    var colors = sphere.getVerticesData(BABYLON.VertexBuffer.ColorKind);
    if (!colors) {
      colors = [];
      var positions = sphere.getVerticesData(BABYLON.VertexBuffer.PositionKind);

      for (var p = 0; p < positions.length / 3; p++) {
        const g = color.g + Math.sin(positions[p * 3 + 0]) * 0.75;
        const b = color.b + Math.cos(positions[p * 3 + 2]) * 0.75;
        const r = color.r + Math.cos(1.7 + positions[p * 3 + 2]) * 0.75;

        colors.push(r, g, b, 1);
      }
    }
    sphere.setVerticesData(BABYLON.VertexBuffer.ColorKind, colors);
    sphere.material = material;
    return sphere;
  }

  private create(scene: BABYLON.Scene) {
    const bubbles = new Map<Colors, BABYLON.Mesh>();

    const mapping = new Map<Colors, BABYLON.Color3>([
      [Colors.RED, BABYLON.Color3.Red()],
      [Colors.BLUE, BABYLON.Color3.Blue()],
      [Colors.GREEN, BABYLON.Color3.Green()],
      [Colors.YELLOW, BABYLON.Color3.Yellow()]
    ]);

    const material = new BABYLON.StandardMaterial(`bubble.material`, scene);
    material.disableLighting = true;
    material.emissiveColor = BABYLON.Color3.White();
    material.diffuseColor = BABYLON.Color3.White();

    for (const [key, color] of mapping.entries()) {
      /*
      material.diffuseColor = color;

      const mesh = BABYLON.MeshBuilder.CreateIcoSphere(
        `bubble.mesh.${key}`,
        { radius: Bubble.RADIUS, subdivisions: 1 },
        scene
      );

      material.disableLighting = true;
      material.emissiveColor = color; //BABYLON.Color3.White();

      mesh.isVisible = false;
      mesh.material = material;
*/
      const mesh = this.createColor(scene, material, color);
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
