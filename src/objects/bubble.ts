import * as BABYLON from "babylonjs";
import { Particles } from "./particles";

export const enum Colors {
  RED,
  BLUE,
  GREEN,
  YELLOW
}

export class Bubble {
  static readonly RADIUS = 0.5;

  private mesh: BABYLON.InstancedMesh;
  private color: Colors;

  public static fromImposter(imposter: BABYLON.PhysicsImpostor): Bubble {
    return (imposter.object as any).bubble as Bubble;
  }

  public static isImposterBubble(imposter: BABYLON.PhysicsImpostor) {
    return !!(imposter.object as any).bubble;
  }

  public static fromAbstractMesh(mesh: BABYLON.AbstractMesh): Bubble {
    return (mesh as any).bubble as Bubble;
  }

  public static isBubble(mesh: BABYLON.AbstractMesh): boolean {
    return !!(mesh as any).bubble;
  }

  public static burst(bubble: Bubble) {
    if (bubble.getMesh()) {
      const burst = Particles.createBubblePopPartciles(
        bubble.getMesh().getScene(),
        bubble.getPosition()
      );
      burst.start();
      setTimeout(() => {
        burst.stop();
      }, 10);
      bubble.dispose();
    }
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
  }

  public getColor() {
    return this.color;
  }

  public setPosition(position: BABYLON.Vector3) {
    this.mesh.position.copyFrom(position);
  }

  public getPosition() {
    return this.mesh.position;
  }

  public setVelocity(velocity: BABYLON.Vector3) {
    this.getImposter().setLinearVelocity(velocity);
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
