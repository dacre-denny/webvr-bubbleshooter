import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";
import { AssetsManager, Color3 } from "babylonjs";
import { createAnimationEnter, createAnimationExit } from "../utilities";
import { Assets, Theme } from "../assets";

function createTextBlock(text: string, size: number, color: string = "white") {
  const textBlock = new GUI.TextBlock();
  textBlock.text = text;
  textBlock.fontSize = size;
  textBlock.heightInPixels = size + 10;
  textBlock.paddingBottomInPixels = 5;
  textBlock.paddingTopInPixels = 5;
  textBlock.color = color;
  textBlock.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;

  return textBlock;
}

export class GameOver {
  private gui: GUI.AdvancedDynamicTexture;
  private plane: BABYLON.Mesh;

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
    const texture = GUI.AdvancedDynamicTexture.CreateForMesh(
      plane,
      800,
      800,
      true
    );

    this.gui = texture;
    this.plane = plane;
  }

  public close() {
    if (!this.plane) {
      return
    }

    const exitAnimationEnd = createAnimationExit("scaling", this.plane)
      .onAnimationEndObservable;

    exitAnimationEnd.add(() => {
      this.gui.dispose();
      this.plane.dispose();

      this.gui = null;
      this.plane = null;
    });

    return exitAnimationEnd;
  }

  constructor(scene: BABYLON.Scene, score: number) {
    this.create(scene);

    var panel = new GUI.StackPanel("panel");
    panel.heightInPixels = 300;

    const glass = new GUI.Rectangle("glass");
    glass.zIndex = -1;
    glass.cornerRadius = 20;
    glass.height = `90%`;
    glass.widthInPixels = 400;
    glass.background = Theme.COLOR_WHITE + "33";
    glass.thickness = 10;
    glass.paddingTop = `15%`;

    var title = new GUI.Image("game-title", Assets.GUI_GAMEOVER_HEADING);
    title.left = -100;
    title.top = 0;
    title.heightInPixels = 100;
    title.widthInPixels = 270;

    const textScore = createTextBlock(`Your scope`, 20, Theme.COLOR_WHITE);
    const textScoreNumber = createTextBlock(`${0}`, 60, Theme.COLOR_WHITE);
    const textInstruction = createTextBlock(
      `Pull trigger to continue`,
      20,
      Theme.COLOR_WHITE
    );

    panel.addControl(title);
    panel.addControl(textScore);
    panel.addControl(textScoreNumber);
    panel.addControl(textInstruction);
    panel.addControl(glass);

    this.gui.addControl(panel);

    const position = new BABYLON.Vector3()
      .addInPlace(BABYLON.Vector3.Up())
      .addInPlace(BABYLON.Vector3.Forward().scale(6));

    this.plane.setDirection(BABYLON.Vector3.Forward());
    this.plane.position.copyFrom(position);

    createAnimationEnter(
      "scaling",
      this.plane
    ).onAnimationEndObservable.addOnce(() => {
      let displayScore = 0;

      this.plane.onBeforeDrawObservable.add(() => {
        displayScore = Math.min(
          score,
          displayScore + 1 + Math.round((score - displayScore) / 50)
        );

        textScoreNumber.text = `${displayScore}`;

        if (displayScore >= score) {
          this.plane.onBeforeDrawObservable.clear();
        }
      });
    });
  }
}
