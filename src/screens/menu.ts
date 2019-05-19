import * as GUI from "babylonjs-gui";

export class MainMenu extends GUI.StackPanel {
  private start: GUI.Button;

  constructor() {
    super();

    var menuTitle = new GUI.Image("game-title", "./images/game-title.png");
    menuTitle.widthInPixels = 500;
    menuTitle.heightInPixels = 134;

    var menuStart = GUI.Button.CreateImageOnlyButton(
      "menu-start",
      "./images/button-start.png"
    );
    menuStart.thickness = 0;
    menuStart.widthInPixels = 220;
    menuStart.heightInPixels = 220;

    this.addControl(menuTitle);
    this.addControl(menuStart);

    this.start = menuStart;
  }

  public getStartButton() {
    return this.start;
  }
}
