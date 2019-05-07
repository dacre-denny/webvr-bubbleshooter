import * as BABYLON from "babylonjs";

export const enum Colors {
  RED,
  BLUE,
  GREEN,
  YELLOW
}

export class Bubble {
  mesh: BABYLON.InstancedMesh;
  color: Colors;

  constructor(mesh: BABYLON.InstancedMesh, color: Colors) {
    mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
      mesh,
      BABYLON.PhysicsImpostor.SphereImpostor,
      { mass: 1, friction: 0.0, restitution: 1, damping: 0 },
      mesh.getScene()
    );

    mesh.checkCollisions = true;
    (mesh as any).bubble = this;

    this.mesh = mesh;
    this.color = color;
  }

  public getColor() {
    return this.color;
  }

  public getImposter() {
    return this.mesh.physicsImpostor;
  }

  public getMesh() {
    return this.mesh;
  }

  public destroy() {
    this.mesh.physicsImpostor.dispose();
    this.mesh.dispose();

    this.mesh = null;
  }
}
