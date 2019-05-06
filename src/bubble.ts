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
    mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
      mesh,
      BABYLON.PhysicsImpostor.SphereImpostor,
      { mass: 1, friction: 0.0, restitution: 1, damping: 0 },
      mesh.getScene()
    );

    mesh.checkCollisions = true;
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
