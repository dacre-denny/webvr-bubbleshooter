import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";
import { Theme } from "../assets";
import { Colors } from "../objects/bubble";
import {
  createAnimationEnter,
  createAnimationExit,
  createGlass,
  createTextBlock
} from "../utilities";

export class GameHUD {
  private texture: GUI.AdvancedDynamicTexture;
  private plane: BABYLON.Mesh;

  private rectAttempts: GUI.Rectangle;
  private bubble: BABYLON.Mesh;
  private textScore: GUI.TextBlock;

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

  public create(scene: BABYLON.Scene) {
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

    const texture = GUI.AdvancedDynamicTexture.CreateForMesh(
      plane,
      800,
      800,
      true
    );

    var panel = new GUI.StackPanel("panel");
    panel.heightInPixels = 100;
    texture.addControl(panel);

    {
      const glass = createGlass();
      glass.height = "100%";
      glass.paddingTop = "0%";
      glass.widthInPixels = 275;

      panel.addControl(glass);
    }

    {
      const textScore = createTextBlock(``, 40, Theme.COLOR_WHITE);
      textScore.heightInPixels = 65;
      textScore.width = "30%";
      textScore.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;

      panel.addControl(textScore);

      this.textScore = textScore;
    }

    {
      const rectWrap = new GUI.Rectangle();
      rectWrap.heightInPixels = 20;
      rectWrap.width = `30%`;
      rectWrap.cornerRadius = 100;
      rectWrap.background = Theme.COLOR_WHITE + "44";
      rectWrap.thickness = 0;

      const rectAttempts = new GUI.Rectangle();
      rectAttempts.height = `100%`;
      rectAttempts.width = `0%`;
      rectAttempts.cornerRadius = 100;
      rectAttempts.background = Theme.COLOR_BLUE;
      rectAttempts.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      rectAttempts.thickness = 0;

      rectWrap.addControl(rectAttempts);
      panel.addControl(rectWrap);

      this.rectAttempts = rectAttempts;
    }

    const position = new BABYLON.Vector3()
      .addInPlace(BABYLON.Vector3.Up())
      .addInPlace(BABYLON.Vector3.Forward().scale(6));

    plane.setDirection(BABYLON.Vector3.Forward());
    plane.position.copyFrom(position);

    createAnimationEnter("scaling", plane);

    this.texture = texture;
    this.plane = plane;

    this.setScore(10);
    this.setBubble(Colors.BLUE);
  }

  public setScore(score: number) {
    if (!this.textScore) {
      return;
    }

    let displayValue = 0;

    const counter = this.plane.onBeforeDrawObservable.add(() => {
      displayValue = Math.min(
        score,
        displayValue + 1 + Math.round((score - displayValue) / 50)
      );
      this.textScore.text = `${displayValue}`;

      if (displayValue >= score) {
        this.plane.onBeforeDrawObservable.remove(counter);
      }
    });
  }

  public setBubble(color: Colors) {
    if (!this.plane) {
      return;
    }

    const animateInsertBubble = () => {
      var sphere = BABYLON.MeshBuilder.CreateSphere(
        "sphere",
        {
          segments: 1,
          diameter: 0.25
        },
        this.plane.getScene()
      );

      sphere.scaling.setAll(0);
      sphere.position.set(0.65, 1.125, 5.9);
      this.plane.addChild(sphere);

      sphere.onBeforeDrawObservable.add(() => {
        const p = 0.01; // Date.now() / 10000;
        const a = new BABYLON.Vector3(
          Math.sin(p),
          Math.cos(p * 0.7),
          Math.cos(p * 0.4)
        ).normalize();

        sphere.rotate(a, 0.05);
      });

      createAnimationEnter("scaling", sphere);

      this.bubble = sphere;
    };

    if (this.bubble) {
      createAnimationExit(
        "scaling",
        this.bubble
      ).onAnimationEndObservable.addOnce(() => {
        this.plane.removeChild(this.bubble);
        this.bubble.dispose();
        this.bubble = null;
        animateInsertBubble();
      });
    } else {
      animateInsertBubble();
    }
  }

  public setLevel(percent: number) {
    if (!this.rectAttempts) {
      return;
    }
    this.rectAttempts.width = `${Math.max(0, Math.min(100, percent))}%`;
  }
}