import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";
import { GameOver } from "./screens/gameover";
import { MainMenu } from "./screens/menu";
import { GameHUD } from "./screens/hud";

export class UIFactory {
  private gui: GUI.AdvancedDynamicTexture;
  private plane: BABYLON.Mesh;
  private control: GUI.Container;

  constructor(scene: BABYLON.Scene) {
    this.create(scene);
  }

  public updatePlacement(
    origin: BABYLON.Vector3,
    direction: BABYLON.Vector3,
    offset: number
  ) {
    const position = new BABYLON.Vector3()
      .addInPlace(origin)
      .addInPlace(direction.scale(offset));

    this.plane.setDirection(direction);
    this.plane.position.copyFrom(position);
  }

  public release() {
    this.clearScreen();
    if (this.gui) {
      this.gui.dispose();
      this.gui = null;
    }

    if (this.plane) {
      this.plane = null;
    }
  }

  private create(scene: BABYLON.Scene) {
    this.release();

    // var plane = BABYLON.Mesh.CreatePlane("plane", 1, scene);
    const plane = BABYLON.MeshBuilder.CreatePlane(
      "menu",
      {
        size: 5,
        sourcePlane: new BABYLON.Plane(0, -1, 0, 0)
      },
      scene
    );
    plane.position.addInPlace(new BABYLON.Vector3(2.5, 0, 2.5));
    const gui = GUI.AdvancedDynamicTexture.CreateForMesh(plane, 640, 640, true);

    this.gui = gui;
    this.plane = plane;
  }

  private clearScreen() {
    if (this.control) {
      this.control.dispose();
      this.control = null;
    }
  }

  private setScreen<T extends GUI.StackPanel>(screen: T) {
    this.clearScreen();

    this.control = screen;
    this.gui.addControl(screen);
    return screen;
  }

  public showGameOverScreen() {
    if (this.control instanceof GameOver) {
      return;
    }

    return this.setScreen(new GameOver());
  }

  public showStartMenu() {
    if (this.control instanceof MainMenu) {
      return;
    }

    return this.setScreen(new MainMenu());
  }

  public showHUD() {
    if (this.control instanceof GameHUD) {
      return;
    }

    return this.setScreen(new GameHUD());
  }
}
