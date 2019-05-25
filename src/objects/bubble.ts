import * as BABYLON from "babylonjs";
import { Particles } from "./particles";
import { createAnimationExit } from "../utilities";

export const enum Colors {
  RED,
  BLUE,
  GREEN,
  YELLOW
}

export const ColorMap = new Map<Colors, BABYLON.Color3>([
  [Colors.BLUE, BABYLON.Color3.FromHexString(`#ceecff`)],
  [Colors.RED, BABYLON.Color3.FromHexString(`#ffcece`)],
  [Colors.GREEN, BABYLON.Color3.FromHexString(`#b6ffa6`)],
  [Colors.YELLOW, BABYLON.Color3.FromHexString(`#fff7a6`)]
]);

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

  public getColor3() {
    return ColorMap.get(this.color)!;
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

  public burst() {
    if (this.mesh) {
      const position = this.getPosition();
      const color = this.getColor3();

      const { mesh } = this;
      this.mesh = null;

      mesh.physicsImpostor.dispose();
      mesh.physicsImpostor = null;
      mesh.onAfterWorldMatrixUpdateObservable.clear();

      // debugger;
      mesh.getScene().onBeforeRenderObservable.addOnce(() => {
        createAnimationExit("scaling", mesh).onAnimationEndObservable.addOnce(
          () => {
            Particles.createBubblePopPartciles(
              mesh.getScene(),
              position,
              color
            );
            mesh.dispose();
          }
        );
      });
    }
  }
}
