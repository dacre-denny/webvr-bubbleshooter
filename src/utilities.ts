import { Colors } from "./bubble";
import * as GUI from "babylonjs-gui";

let n = 0;

export function randomColor() {
  n += 0.77;
  return Math.floor(n % 4) as Colors;
  //return Math.floor(Math.random() * 4) as Colors;
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function createTextBlock(
  color: string,
  fontSize: number,
  left: number,
  top: number
) {
  const element = new GUI.TextBlock();
  element.text = "Score:";
  element.height = "20px";
  element.color = "white";
  element.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
  element.fontSize = "20";
  element.left = left;
  element.top = top;
  return element;
}
