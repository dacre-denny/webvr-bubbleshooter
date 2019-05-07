import * as BABYLON from "babylonjs";
import { BubbleFactory } from "./bubbleFactory";
import { Level } from "./level";
import { Bubble } from "./bubble";

export class Launcher {
  mesh: BABYLON.Mesh;
  level: Level;
  bubbleFactory: BubbleFactory;

  constructor(
    scene: BABYLON.Scene,
    level: Level,
    bubbleFactory: BubbleFactory
  ) {
    this.create(scene);
    this.level = level;
    this.bubbleFactory = bubbleFactory;
  }

  private create(scene: BABYLON.Scene) {
    var launcherTube = BABYLON.MeshBuilder.CreateCylinder(
      "launcher.tube",
      {
        height: 2,
        diameter: 0.5,
        tessellation: 5,
        arc: Math.PI * 2,
        enclose: false
      },
      scene
    ).convertToFlatShadedMesh();
    launcherTube.position.y = 1;

    let launcherBase = BABYLON.MeshBuilder.CreateIcoSphere(
      "launcher.base",

      { radius: 1, subdivisions: 1 },
      scene
    );

    const launcher = new BABYLON.Mesh("launcher");
    launcher.addChild(launcherBase);
    launcher.addChild(launcherTube);

    this.mesh = launcher;
  }

  public shoot() {
    //this.launcher.lookAt(new BABYLON.Vector3(0, 2, 0.25));

    const bubble = this.bubbleFactory.createBubble();
    const imposter = bubble.getImposter();

    const imposters = Array.from(this.level.getBubbleImposters());

    const handler = (
      collider: BABYLON.PhysicsImpostor,
      other: BABYLON.PhysicsImpostor
    ) => {
      imposter.unregisterOnPhysicsCollide(imposters, handler);

      const colliderBubble = (collider.object as any).bubble as Bubble;
      const otherBubble = (other.object as any).bubble as Bubble;

      const destroyBubbles = Array.from(
        this.level.onBubbleCollide(colliderBubble, otherBubble)
      );

      for (const bubble of destroyBubbles) {
        //const scene = bubble.getMesh().getScene();

        //scene.removeMesh(bubble.getMesh());

        bubble.getMesh().scaling.setAll(0.5);
        //bubble.destroy();
      }
    };

    imposter.registerOnPhysicsCollide(imposters, handler);

    var forceDirection = this.mesh.getDirection(new BABYLON.Vector3(0, 1, 0));

    imposter.applyForce(forceDirection.scale(550), BABYLON.Vector3.Zero());
  }

  public setDirection(direction: BABYLON.Vector3) {
    this.mesh.lookAt(direction);
  }
}
