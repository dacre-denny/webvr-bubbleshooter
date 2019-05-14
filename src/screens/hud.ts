import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";
import { Bubble } from "../bubble";

export class GameHUD extends GUI.StackPanel {
  private score: GUI.TextBlock;

  constructor() {
    super();

    const scoreHeading = new GUI.TextBlock();
    scoreHeading.text = "Score:";
    scoreHeading.height = "20px";
    scoreHeading.color = "white";
    scoreHeading.textHorizontalAlignment =
      GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    scoreHeading.fontSize = "20";
    this.addControl(scoreHeading);

    const scoreValue = new GUI.TextBlock();
    scoreValue.text = "";
    scoreValue.height = "20px";
    scoreValue.color = "white";
    scoreValue.textHorizontalAlignment =
      GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    scoreValue.fontSize = "20";
    this.addControl(scoreValue);

    this.score = scoreValue;
  }

  public setScore(score: number) {
    this.score.text = `${score}`;
  }

  public setNextBubble(bubble: Bubble) {}
}
