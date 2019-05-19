import * as GUI from "babylonjs-gui";
import { Bubble } from "../objects/bubble";

export class GameHUD extends GUI.StackPanel {
  private score: GUI.TextBlock;

  constructor() {
    super();

    var gameHUD = new GUI.Image("game-hud", "./images/game-hud.png");
    gameHUD.widthInPixels = 457;
    gameHUD.heightInPixels = 45;

    const scoreValue = new GUI.TextBlock();
    scoreValue.text = "";
    scoreValue.height = "30px";
    scoreValue.fontWeight = "bold";
    scoreValue.color = "white";
    scoreValue.textHorizontalAlignment =
      BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    scoreValue.widthInPixels = 250;
    scoreValue.leftInPixels = 25;
    scoreValue.horizontalAlignment =
      BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    scoreValue.fontSize = "30";

    this.widthInPixels = 457;
    this.heightInPixels = 145;
    this.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;

    this.addControl(gameHUD);
    this.addControl(scoreValue);

    this.score = scoreValue;
  }

  public setScore(score: number) {
    this.score.text = `${score}`;
    return this;
  }

  public setNextBubble(bubble: Bubble) {
    return this;
  }
}
