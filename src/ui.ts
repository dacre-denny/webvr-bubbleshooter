import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";
import { GameOver } from "./screens/gameover";
import { MainMenu } from "./screens/menu";
import { GameHUD } from "./screens/hud";

export class UIManager {
  private uiTexture: GUI.AdvancedDynamicTexture;
  private uiSurface: BABYLON.Mesh;
  private uiCurrentScreen: GUI.Container;

  constructor(scene: BABYLON.Scene) {
    this.dispose();

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

    this.uiTexture = gui;
    this.uiSurface = plane;
  }

  public updatePlacement(
    origin: BABYLON.Vector3,
    direction: BABYLON.Vector3,
    offset: number
  ) {
    const position = new BABYLON.Vector3()
      .addInPlace(origin)
      .addInPlace(direction.scale(offset));

    this.uiSurface.setDirection(direction);
    this.uiSurface.position.copyFrom(position);
  }

  private clearScreen() {
    if (this.uiCurrentScreen) {
      this.uiCurrentScreen.dispose();
      this.uiCurrentScreen = null;
    }
  }

  private setScreen<T extends GUI.StackPanel>(screen: T) {
    this.clearScreen();

    this.uiCurrentScreen = screen;
    this.uiTexture.addControl(screen);
    return screen;
  }

  public dispose() {
    this.clearScreen();

    if (this.uiTexture) {
      this.uiTexture.dispose();
      this.uiTexture = null;
    }

    if (this.uiSurface) {
      this.uiSurface = null;
    }
  }

  public showGameOverScreen() {
    return this.uiCurrentScreen instanceof GameOver
      ? this.uiCurrentScreen
      : this.setScreen(new GameOver());
  }

  public showStartMenu() {
    return this.uiCurrentScreen instanceof MainMenu
      ? this.uiCurrentScreen
      : this.setScreen(new MainMenu());
  }

  public showHUD() {
    return this.uiCurrentScreen instanceof GameHUD
      ? this.uiCurrentScreen
      : this.setScreen(new GameHUD());
  }
}
