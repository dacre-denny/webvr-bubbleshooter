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

    const meshTube = BABYLON.MeshBuilder.CreateCylinder(
      "launcher.tube",
      {
        height: 0.75,
        diameter: Bubble.RADIUS * 2 + 0.35,
        tessellation: 5,
        arc: Math.PI * 2,
        enclose: false
      },
      scene
    ).convertToFlatShadedMesh();

    applyColors(meshTube, BABYLON.Color3.FromHexString(`#ddeeff`));

    meshTube.translate(BABYLON.Vector3.Forward(), 1);
    meshTube.rotate(BABYLON.Vector3.Left(), Math.PI / 2);
    meshTube.material = material;

    const tubeBase = BABYLON.MeshBuilder.CreateCylinder(
      "launcher.tube",
      {
        height: 0.75,
        diameter: Bubble.RADIUS * 3 + 0.25,
        tessellation: 5,
        arc: Math.PI * 2,
        enclose: false
      },
      scene
    ).convertToFlatShadedMesh();

    applyColors(tubeBase, BABYLON.Color3.FromHexString(`#ff6363`));

    tubeBase.translate(BABYLON.Vector3.Forward(), 0.45);
    tubeBase.rotate(BABYLON.Vector3.Left(), Math.PI / 2);
    tubeBase.material = material;

    const meshTubeBase = BABYLON.MeshBuilder.CreateCylinder(
      "launcher.tube",
      {
        height: 0.35,
        diameter: Bubble.RADIUS * 2 + 0.5,
        tessellation: 5,
        arc: Math.PI * 2,
        enclose: false,
        diameterTop: 0.5
      },
      scene
    ).convertToFlatShadedMesh();

    applyColors(meshTubeBase, BABYLON.Color3.FromHexString(`#131344`));

    meshTubeBase.translate(BABYLON.Vector3.Forward(), 1.75);
    meshTubeBase.rotate(BABYLON.Vector3.Left(), Math.PI / 2);
    meshTubeBase.material = material;

    let meshBase = BABYLON.MeshBuilder.CreateIcoSphere(
      "launcher.base",

      { radius: 1, subdivisions: 2 },
      scene
    );
    meshBase.material = material;
    //ff8383
    applyColors(meshBase, BABYLON.Color3.FromHexString(`#ff4343`));

    const mesh = new BABYLON.Mesh("launcher");

    mesh.addChild(meshBase);
    mesh.addChild(meshTube);
    mesh.addChild(tubeBase);
    mesh.addChild(meshTubeBase);

    mesh.position.y -= 3;

    this.mesh = mesh;
    mesh.onAfterWorldMatrixUpdateObservable.add(() => {
      meshTube.rotate(BABYLON.Vector3.Up(), Math.PI / 46);
      meshTubeBase.rotate(BABYLON.Vector3.Up(), Math.PI / -64);
    });
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
