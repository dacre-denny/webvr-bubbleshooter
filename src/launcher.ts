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

    var meshTube = BABYLON.MeshBuilder.CreateCylinder(
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

    meshTube.translate(BABYLON.Vector3.Forward(), 1);
    meshTube.rotate(BABYLON.Vector3.Left(), Math.PI / 2);

    let meshBase = BABYLON.MeshBuilder.CreateIcoSphere(
      "launcher.base",

      { radius: 1, subdivisions: 1 },
      scene
    );

    const mesh = new BABYLON.Mesh("launcher");

    mesh.addChild(meshBase);
    mesh.addChild(meshTube);

    this.mesh = mesh;
  }

  public getDirection(): BABYLON.Vector3 {
    return this.mesh.getDirection(new BABYLON.Vector3(0, 0, 1));
  }
  public getPosition(): BABYLON.Vector3 {
    return this.mesh.position;
  }
  public lookAt(position: BABYLON.Vector3) {
    this.mesh.lookAt(position);
  }
}
