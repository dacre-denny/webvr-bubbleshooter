import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";

export class GameOver extends GUI.StackPanel {
  private buttonMenu: GUI.Button;

  constructor() {
    super();

    const textGameOver = new GUI.TextBlock();
    textGameOver.text = "Game over!";
    textGameOver.height = "40px";
    textGameOver.color = "white";
    textGameOver.textHorizontalAlignment =
      GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    textGameOver.fontSize = "40";
    this.addControl(textGameOver);

    const textPlayerScore = new GUI.TextBlock();
    textPlayerScore.text = "Your score:";
    textPlayerScore.height = "20px";
    textPlayerScore.color = "white";
    textPlayerScore.textHorizontalAlignment =
      GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    textPlayerScore.fontSize = "20";
    this.addControl(textPlayerScore);

    const textScore = new GUI.TextBlock();
    textScore.text = "9231";
    textScore.height = "40px";
    textScore.color = "white";
    textScore.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    textScore.fontSize = "40";
    this.addControl(textPlayerScore);

    const buttonMenu = GUI.Button.CreateSimpleButton("menu", "Menu");
    buttonMenu.width = 1;
    buttonMenu.height = "40px";
    buttonMenu.background = "green";
    buttonMenu.onPointerClickObservable.add(() => {});

    this.addControl(buttonMenu);

    this.buttonMenu = buttonMenu;
  }
  public getMenuButton() {
    return this.buttonMenu;
  }
}
