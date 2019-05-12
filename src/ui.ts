import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";

export class UI {
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
    this.releaseScreen();
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
    const gui = GUI.AdvancedDynamicTexture.CreateForMesh(plane, 320, 320, true);

    this.gui = gui;
    this.plane = plane;
  }

  private releaseScreen() {
    if (this.control) {
      this.gui.removeControl(this.control);

      this.control.dispose();
      this.control = null;
    }
  }

  public displayGameOverScreen() {
    this.releaseScreen();
    var panel = new GUI.StackPanel();

    {
      var textGameOver = new GUI.TextBlock();
      textGameOver.text = "Game over!";
      textGameOver.height = "40px";
      textGameOver.color = "white";
      textGameOver.textHorizontalAlignment =
        GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
      textGameOver.fontSize = "40";
      panel.addControl(textGameOver);
    }
    {
      var textPlayerScore = new GUI.TextBlock();
      textPlayerScore.text = "Your score:";
      textPlayerScore.height = "20px";
      textPlayerScore.color = "white";
      textPlayerScore.textHorizontalAlignment =
        GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
      textPlayerScore.fontSize = "20";
      panel.addControl(textPlayerScore);
    }
    {
      var textPlayerScore = new GUI.TextBlock();
      textPlayerScore.text = "9231";
      textPlayerScore.height = "40px";
      textPlayerScore.color = "white";
      textPlayerScore.textHorizontalAlignment =
        GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
      textPlayerScore.fontSize = "40";
      panel.addControl(textPlayerScore);
    }

    var buttonMenu = GUI.Button.CreateSimpleButton("menu", "Menu");
    buttonMenu.width = 1;
    buttonMenu.height = "40px";
    buttonMenu.background = "green";
    buttonMenu.onPointerClickObservable.add(() => {});

    panel.addControl(buttonMenu);

    this.control = panel;
    this.gui.addControl(panel);
  }

  public displayStartMenu(onStart: () => void) {
    this.releaseScreen();

    var panel = new GUI.StackPanel();
    var header = new GUI.TextBlock();
    header.text = "BubblesVR";
    header.height = "60px";
    header.color = "white";
    header.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    header.fontSize = "40";
    panel.addControl(header);

    var start = GUI.Button.CreateSimpleButton("start", "start");
    start.width = 1;
    start.height = "40px";
    start.background = "green";
    start.onPointerClickObservable.add(onStart);

    panel.addControl(start);

    this.gui.addControl(panel);
    this.control = panel;
  }

  public displayHud() {
    this.releaseScreen();

    var panel = new GUI.StackPanel();

    {
      var textPlayerScore = new GUI.TextBlock();
      textPlayerScore.text = "Score:";
      textPlayerScore.height = "20px";
      textPlayerScore.color = "white";
      textPlayerScore.textHorizontalAlignment =
        GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
      textPlayerScore.fontSize = "20";
      panel.addControl(textPlayerScore);
    }
    {
      var textPlayerScore = new GUI.TextBlock();
      textPlayerScore.text = "9231";
      textPlayerScore.height = "20px";
      textPlayerScore.color = "white";
      textPlayerScore.textHorizontalAlignment =
        GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
      textPlayerScore.fontSize = "20";
      panel.addControl(textPlayerScore);
    }

    this.gui.addControl(panel);
    this.control = panel;
  }
}
