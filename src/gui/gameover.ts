import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";
import { Assets, Theme } from "../assets";
import { AssetSounds } from "../services/resources";
import { createAnimationEnter, createAnimationExit } from "../utilities";
import { AbstractGUI } from "./gui";

export class GameOverGUI extends AbstractGUI {
  private textScoreNumber: GUI.TextBlock;

  public close() {
    if (!this.plane) {
      return;
    }

    const exitAnimationEnd = createAnimationExit("scaling", this.plane).onAnimationEndObservable;

    exitAnimationEnd.add(() => {
      this.texture.dispose();
      this.plane.dispose();

      this.texture = null;
      this.plane = null;
      this.onCloseObservable.notifyObservers();
    });

    return exitAnimationEnd;
  }

  public setScore(score: number) {
    createAnimationEnter("scaling", this.plane).onAnimationEndObservable.addOnce(() => {
      let displayScore = 0;

      this.plane.onBeforeDrawObservable.add(() => {
        displayScore = Math.min(score, displayScore + 1 + Math.round((score - displayScore) / 50));

        this.textScoreNumber.text = `${displayScore}`;

        if (displayScore >= score) {
          this.plane.onBeforeDrawObservable.clear();
        }
      });
    });
  }

  public open() {
    this.resource.getSound(AssetSounds.SOUND_GAMEOVER).play();

    if (this.plane) {
      return;
    }

    const plane = BABYLON.MeshBuilder.CreatePlane(
      "menu",
      {
        size: 5,
        sourcePlane: new BABYLON.Plane(0, -1, 0, 0)
      },
      this.scene
    );
    plane.position.addInPlace(new BABYLON.Vector3(2.5, 0, 2.5));
    const texture = GUI.AdvancedDynamicTexture.CreateForMesh(plane, 800, 800, true);

    var panel = new GUI.StackPanel("panel");
    panel.heightInPixels = 300;

    var title = new GUI.Image("game-title", Assets.GUI_GAMEOVER_HEADING);
    title.left = -100;
    title.top = 0;
    title.heightInPixels = 100;
    title.widthInPixels = 270;

    const textScoreNumber = this.createTextBlock(`${0}`, 60, Theme.COLOR_BLUE);

    panel.addControl(title);
    panel.addControl(this.createTextBlock(`Your scope`, 20, Theme.COLOR_BLUE));
    panel.addControl(textScoreNumber);
    panel.addControl(this.createTextBlock(`Pull trigger to continue`, 20, Theme.COLOR_BLUE));

    const glass = this.createRectangleGlass();
    glass.paddingTop = "15%";
    glass.height = "90%";
    panel.addControl(glass);

    texture.addControl(panel);

    const position = new BABYLON.Vector3().addInPlace(BABYLON.Vector3.Up()).addInPlace(BABYLON.Vector3.Forward().scale(6));

    plane.setDirection(BABYLON.Vector3.Forward());
    plane.position.copyFrom(position);

    this.textScoreNumber = textScoreNumber;

    this.texture = texture;
    this.plane = plane;
  }
}
