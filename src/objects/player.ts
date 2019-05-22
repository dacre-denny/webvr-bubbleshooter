import * as BABYLON from "babylonjs";
import { applyColors } from "../utilities";
import { Bubble } from "./bubble";

export class Player {
  mesh: BABYLON.Mesh;

  private dispose() {
    if (this.mesh) {
      this.mesh.dispose(false, true);
      this.mesh = null;
    }
  }

  public create(scene: BABYLON.Scene) {
    this.dispose();

    const material = new BABYLON.StandardMaterial("launcher.material", scene);
    material.diffuseColor = BABYLON.Color3.White();
    material.disableLighting = true;
    material.emissiveColor = BABYLON.Color3.White();

    var meshTube = BABYLON.MeshBuilder.CreateCylinder(
      "launcher.tube",
      {
        height: 0.35,
        diameter: Bubble.RADIUS * 2 + 0.5,
        tessellation: 5,
        arc: Math.PI * 2,
        enclose: false
      },
      scene
    ).convertToFlatShadedMesh();

    applyColors(meshTube, BABYLON.Color3.Black());

    meshTube.translate(BABYLON.Vector3.Forward(), 1);
    meshTube.rotate(BABYLON.Vector3.Left(), Math.PI / 2);
    meshTube.material = material;

    for (let x = 0; x < 3; x++) {
      //Array of paths to construct tube

      var myPath: BABYLON.Vector3[] = [];

      let n = 5;
      for (let i = 0; i <= n; i++) {
        const p = Math.PI * 0.5 + (Math.PI * 2 * i) / n;

        myPath.push(new BABYLON.Vector3(Math.sin(p), Math.cos(p), 1 + x * 0.5));
      }

      //Create ribbon with updatable parameter set to true for later changes
      var tube = BABYLON.MeshBuilder.CreateTube(
        "tube",
        {
          path: myPath,
          cap: BABYLON.Mesh.NO_CAP,
          tessellation: 3,
          radius: 0.1,
          sideOrientation: BABYLON.Mesh.FRONTSIDE,
          updatable: true
        },
        scene
      );

      tube.material = material;
      applyColors(tube, BABYLON.Color3.Black());

      meshTube.addChild(tube);
    }

    let meshBase = BABYLON.MeshBuilder.CreateIcoSphere(
      "launcher.base",

      { radius: 1, subdivisions: 2 },
      scene
    );
    meshBase.material = material;

    applyColors(meshBase, BABYLON.Color3.Red());

    const mesh = new BABYLON.Mesh("launcher");

    mesh.addChild(meshBase);
    mesh.addChild(meshTube);

    mesh.position.y -= 3;

    this.mesh = mesh;

    return this;
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
