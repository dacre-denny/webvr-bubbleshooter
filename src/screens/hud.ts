import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";
import { Bubble, Colors } from "../objects/bubble";
import {
  createAnimationExit,
  createAnimationEnter,
  createTextBlock,
  createGlass
} from "../utilities";
import { Assets, Theme } from "../assets";
import { BubbleFactory } from "../bubbleFactory";

export class GameHUD extends GUI.StackPanel {
  private texture: GUI.AdvancedDynamicTexture;
  private plane: BABYLON.Mesh;

  private levelProgress: GUI.Rectangle;
  private bubble: BABYLON.Mesh;
  private score: GUI.TextBlock;

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

    const glass = createGlass();
    glass.height = "100%";
    glass.paddingTop = "0%";
    glass.widthInPixels = 275;

    panel.addControl(glass);

    {
      const textLabel = createTextBlock(``, 40, Theme.COLOR_WHITE);
      textLabel.heightInPixels = 65;
      textLabel.width = "30%";
      textLabel.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      panel.addControl(textLabel);

      this.score = textLabel;
    }

    {
      const wrap = new GUI.Rectangle();
      wrap.heightInPixels = 20;
      wrap.width = `30%`;
      wrap.cornerRadius = 100;
      wrap.background = Theme.COLOR_WHITE + "44";
      wrap.thickness = 0;

      panel.addControl(wrap);

      const inner = new GUI.Rectangle();
      inner.height = `100%`;
      inner.width = `50%`;
      inner.cornerRadius = 100;
      inner.background = Theme.COLOR_BLUE;
      inner.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      inner.thickness = 0;

      wrap.addControl(inner);

      this.levelProgress = inner;
    }

    texture.addControl(panel);

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
    if (!this.score) {
      return;
    }

    let displayValue = 0;

    const counter = this.plane.onBeforeDrawObservable.add(() => {
      displayValue = Math.min(
        score,
        displayValue + 1 + Math.round((score - displayValue) / 50)
      );
      this.score.text = `${displayValue}`;

      if (displayValue >= score) {
        this.plane.onBeforeDrawObservable.remove(counter);
      }
    });

    //this.score.text = `${score}`;
  }

  public setBubble(color: Colors) {
    if (!this.plane) {
      return;
    }

    const add = () => {
      var sphere = BABYLON.MeshBuilder.CreateSphere(
        "sphere",
        {
          segments: 1,
          diameter: 0.25
        },
        this.plane.getScene()
      );

      sphere.position.set(0.65, 1.125, 6);
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
    };

    if (this.bubble) {
      createAnimationExit(
        "scaling",
        this.bubble
      ).onAnimationEndObservable.addOnce(() => {
        this.plane.removeChild(this.bubble);
        add();
      });
    } else {
      add();
    }
  }

  public setLevel(percent: number) {
    if (!this.levelProgress) {
      return;
    }
    this.levelProgress.width = `${percent}%`;
  }
}
