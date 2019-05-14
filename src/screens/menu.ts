import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";

export class MainMenu extends GUI.StackPanel {
  private start: GUI.Button;

  constructor() {
    super();

    var header = new GUI.TextBlock();
    header.text = "bub"; //"BubblesVR";
    header.height = "60px";
    header.color = "white";
    header.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    header.fontSize = "40";
    this.addControl(header);

    var start = GUI.Button.CreateSimpleButton("start", "start");
    start.width = 1;
    start.height = "40px";
    start.background = "green";
    //start.onPointerClickObservable.add(onStart);

    this.start = start;

    this.addControl(start);
  }

  public getStartButton() {
    return this.start;
  }
}
