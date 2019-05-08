import * as BABYLON from "babylonjs";

export class Launcher {
  mesh: BABYLON.Mesh;

  constructor(scene: BABYLON.Scene) {
    this.create(scene);
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

  public getDirection(): BABYLON.Vector3 {
    return this.mesh.getDirection(new BABYLON.Vector3(0, 1, 0));
  }

  public setDirection(direction: BABYLON.Vector3) {
    this.mesh.lookAt(direction);
  }
}
