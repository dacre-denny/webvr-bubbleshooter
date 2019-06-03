import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";
import { Theme } from "../assets";
import { Colors, ColorMap } from "../objects/bubble";
import { createAnimationEnter, createAnimationExit, applyColors } from "../utilities";
import { AbstractGUI } from "./gui";

export class HUDGUI extends AbstractGUI {
  private score: number = 0;

  private glass: GUI.Rectangle;
  private rectAttempts: GUI.Rectangle;
  private bubble: BABYLON.Mesh;
  private textScore: GUI.TextBlock;

  public place(ray: BABYLON.Ray) {
    this.plane.position.copyFrom(ray.origin.add(ray.direction.scale(2)));
    this.plane.setDirection(ray.direction);
  }

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

  public open() {
    if (this.plane) {
      return;
    }
    const scale = 0.45;
    const plane = BABYLON.MeshBuilder.CreatePlane(
      "menu",
      {
        size: 5,
        sourcePlane: new BABYLON.Plane(0, -1, 0, 0),
        width: 4 * scale,
        height: 1.5 * scale
      },
      this.scene
    );

    const texture = GUI.AdvancedDynamicTexture.CreateForMesh(plane, 400, 150, true);

    var panel = new GUI.StackPanel("panel");
    panel.heightInPixels = 150;
    panel.widthInPixels = 400;
    texture.addControl(panel);

    {
      const glass = this.createRectangleGlass();
      glass.height = "100%";
      glass.width = "100%";
      glass.paddingTop = "0%";

      panel.addControl(glass);
      this.glass = glass;
    }

    {
      const textScore = this.createTextBlock(``, 60, Theme.COLOR_BLUE);
      textScore.heightInPixels = 100;
      textScore.widthInPixels = 345;
      textScore.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;

      panel.addControl(textScore);

      this.textScore = textScore;
    }

    {
      const rectWrap = new GUI.Rectangle();
      rectWrap.heightInPixels = 20;
      rectWrap.widthInPixels = 345;
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

    const position = new BABYLON.Vector3().addInPlace(BABYLON.Vector3.Up()).addInPlace(BABYLON.Vector3.Forward().scale(6));

    plane.setDirection(BABYLON.Vector3.Forward());
    plane.position.copyFrom(position);

    createAnimationEnter("scaling", plane);

    this.texture = texture;
    this.plane = plane;
  }

  public setScore(score: number) {
    if (!this.textScore) {
      return;
    }

    const counter = this.plane.onBeforeDrawObservable.add(() => {
      this.score += Math.round(Math.ceil((score - this.score) / 500));

      if (this.score >= score) {
        this.score = score;
        this.plane.onBeforeDrawObservable.remove(counter);
      }

      this.textScore.text = `${this.score}`;
    });
  }

  public setBubble(color: Colors) {
    if (!this.plane) {
      return;
    }

    const animateInsertBubble = () => {
      const scene = this.plane.getScene();
      const sphere = BABYLON.MeshBuilder.CreateSphere(
        "sphere",
        {
          segments: 1,
          diameter: 0.25
        },
        scene
      );
      this.plane.addChild(sphere);

      sphere.scaling.setAll(0);
      sphere.position.set(0.65, 0.175, -0.1);

      sphere.onBeforeDrawObservable.add(() => {
        const p = 0.01; // Date.now() / 10000;
        const a = new BABYLON.Vector3(Math.sin(p), Math.cos(p * 0.7), Math.cos(p * 0.4)).normalize();

        sphere.rotate(a, 0.05);
      });

      createAnimationEnter("scaling", sphere);

      const material = new BABYLON.StandardMaterial(`bubble.material`, scene);
      material.disableLighting = true;
      material.emissiveColor = BABYLON.Color3.White();
      material.diffuseColor = BABYLON.Color3.White();

      applyColors(sphere, ColorMap.get(color));

      sphere.material = material;

      this.bubble = sphere;
    };

    if (this.bubble) {
      createAnimationExit("scaling", this.bubble).onAnimationEndObservable.addOnce(() => {
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

  public setAlert(alert: boolean) {
    this.glass.background = alert ? "#ff666677" : Theme.COLOR_WHITE + "33";
  }
}
