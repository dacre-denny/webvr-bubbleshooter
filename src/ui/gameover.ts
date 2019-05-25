import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";
import { Assets, Theme } from "../assets";
import {
  createAnimationEnter,
  createAnimationExit,
  createTextBlock,
  createGlass
} from "../utilities";

export class GameOver {
  private texture: GUI.AdvancedDynamicTexture;
  private plane: BABYLON.Mesh;

  public place(position: BABYLON.Vector3, direction: BABYLON.Vector3) {
    this.plane.position.copyFrom(position.add(direction.scale(2)));
    this.plane.setDirection(direction);
  }

  public close() {
    if (!this.plane) {
      return;
    }

    const exitAnimationEnd = createAnimationExit("scaling", this.plane)
      .onAnimationEndObservable;

    exitAnimationEnd.add(() => {
      this.texture.dispose();
      this.plane.dispose();

      this.texture = null;
      this.plane = null;
    });

    return exitAnimationEnd;
  }

  public create(scene: BABYLON.Scene, score: number) {
    if (this.plane) {
      return;
    }

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

    var panel = new GUI.StackPanel("panel");
    panel.heightInPixels = 300;

    var title = new GUI.Image("game-title", Assets.GUI_GAMEOVER_HEADING);
    title.left = -100;
    title.top = 0;
    title.heightInPixels = 100;
    title.widthInPixels = 270;

    const textScoreNumber = createTextBlock(`${0}`, 60, Theme.COLOR_WHITE);

    panel.addControl(title);
    panel.addControl(createTextBlock(`Your scope`, 20, Theme.COLOR_WHITE));
    panel.addControl(textScoreNumber);
    panel.addControl(
      createTextBlock(`Pull trigger to continue`, 20, Theme.COLOR_WHITE)
    );

    const glass = createGlass();
    glass.paddingTop = "15%";
    glass.height = "90%";
    panel.addControl(glass);

    texture.addControl(panel);

    const position = new BABYLON.Vector3()
      .addInPlace(BABYLON.Vector3.Up())
      .addInPlace(BABYLON.Vector3.Forward().scale(6));

    plane.setDirection(BABYLON.Vector3.Forward());
    plane.position.copyFrom(position);

    createAnimationEnter("scaling", plane).onAnimationEndObservable.addOnce(
      () => {
        let displayScore = 0;

        plane.onBeforeDrawObservable.add(() => {
          displayScore = Math.min(
            score,
            displayScore + 1 + Math.round((score - displayScore) / 50)
          );

          textScoreNumber.text = `${displayScore}`;

          if (displayScore >= score) {
            plane.onBeforeDrawObservable.clear();
          }
        });
      }
    );

    this.texture = texture;
    this.plane = plane;
  }
}
