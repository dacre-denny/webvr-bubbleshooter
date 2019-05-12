import * as BABYLON from "babylonjs";

export class Launcher {
  mesh: BABYLON.Mesh;

  private dispose() {
    if (this.mesh) {
      this.mesh.dispose(false, true);
      this.mesh = null;
    }
  }

  public create(scene: BABYLON.Scene) {
    this.dispose();

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

    // launcherTube.setPivotPoint(BABYLON)
    launcherTube.translate(BABYLON.Vector3.Forward(), 1);
    launcherTube.rotate(BABYLON.Vector3.Left(), Math.PI / 2);

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

  public lookAt(position: BABYLON.Vector3) {
    this.mesh.lookAt(position);
  }
}
