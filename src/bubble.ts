import * as BABYLON from "babylonjs";

export const enum Colors {
  RED,
  BLUE,
  GREEN,
  YELLOW
}

export class Bubble {
  private mesh: BABYLON.InstancedMesh;
  private color: Colors;
  private _id: string;

  public static fromImposter(imposter: BABYLON.PhysicsImpostor): Bubble {
    return (imposter.object as any).bubble as Bubble;
  }

  public static fromAbstractMesh(mesh: BABYLON.AbstractMesh): Bubble {
    return (mesh as any).bubble as Bubble;
  }

  public static isBubble(mesh: BABYLON.AbstractMesh): boolean {
    return !!(mesh as any).bubble;
  }

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
    this._id = `${mesh.id}`;
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

  public dispose() {
    this.mesh.physicsImpostor.dispose();
    this.mesh.dispose();

    this.mesh = null;
  }
}
