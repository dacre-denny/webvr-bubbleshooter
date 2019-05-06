import * as BABYLON from "babylonjs";

export const enum Colors {
  RED,
  BLUE,
  GREEN,
  YELLOW
}

export class Bubble {
  mesh: BABYLON.InstancedMesh;

  constructor(mesh: BABYLON.InstancedMesh, color: Colors) {
    this.mesh = mesh;
  }

  public getImposter() {
    return this.mesh.physicsImpostor;
  }

  public getMesh() {
    return this.mesh;
  }

  public destroy() {}
}
