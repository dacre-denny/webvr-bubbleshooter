import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";
import { AssetsManager, Color3 } from "babylonjs";
import { buildAnimationIn, buildAnimationOut } from "../utilities";

function large(text: string, size: number) {
  const textBlock = new GUI.TextBlock();
  textBlock.text = text;
  textBlock.fontSize = size;
  textBlock.heightInPixels = size + 10;
  textBlock.paddingBottomInPixels = 5;
  textBlock.paddingTopInPixels = 5;
  textBlock.color = "white";
  textBlock.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;

  return textBlock;
}

export class GameOver {
  private uiTexture: GUI.AdvancedDynamicTexture;
  private uiSurface: BABYLON.Mesh;

  private create(scene: BABYLON.Scene) {
    const plane = BABYLON.MeshBuilder.CreatePlane(
      "menu",
      {
        size: 5,
        sourcePlane: new BABYLON.Plane(0, -1, 0, 0)
      },
      scene
    );
    plane.position.addInPlace(new BABYLON.Vector3(2.5, 0, 2.5));
    const gui = GUI.AdvancedDynamicTexture.CreateForMesh(plane, 800, 800, true);

    this.uiTexture = gui;
    this.uiSurface = plane;
  }

  public close() {
    const o = buildAnimationOut("x", "scaling", this.uiSurface)
      .onAnimationEndObservable;

    o.add(() => {
      // dispse
    });

    return o;
  }

  constructor(scene: BABYLON.Scene) {
    this.create(scene);

    var panel = new GUI.StackPanel();
    panel.heightInPixels = 300;

    const glass = new GUI.Rectangle();

    glass.zIndex = -1;
    glass.cornerRadius = 20;
    glass.height = `90%`;
    glass.widthInPixels = 400;
    glass.background = "#ffffff33";
    glass.thickness = 10;
    glass.paddingTop = `15%`;

    var title = new GUI.Image("game-title", "./images/game-end.png");
    title.left = -100;
    title.top = 0;
    title.heightInPixels = 100;
    title.widthInPixels = 270;

    panel.addControl(title);

    panel.addControl(large(`Your scope`, 20));

    panel.addControl(large(`${21321}`, 60));

    panel.addControl(large(`Pull trigger to continue`, 20));

    panel.addControl(glass);

    this.uiTexture.addControl(panel);

    const position = new BABYLON.Vector3()
      .addInPlace(BABYLON.Vector3.Up())
      .addInPlace(BABYLON.Vector3.Forward().scale(6));

    this.uiSurface.setDirection(BABYLON.Vector3.Forward());
    this.uiSurface.position.copyFrom(position);

    buildAnimationIn("x", "scaling", this.uiSurface);
  }
}
