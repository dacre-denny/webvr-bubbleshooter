import * as BABYLON from "babylonjs";
import { Colors } from "./objects/bubble";
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

export function hasVirtualDisplays() {
  return window.navigator.activeVRDisplays;
}

export function applyColors(sphere: BABYLON.Mesh, color: BABYLON.Color3) {
  var colors = sphere.getVerticesData(BABYLON.VertexBuffer.ColorKind);
  if (!colors) {
    colors = [];
    var positions = sphere.getVerticesData(BABYLON.VertexBuffer.PositionKind);

    for (var p = 0; p < positions.length / 3; p++) {
      const g = color.g + Math.sin(positions[p * 3 + 0]) * 0.75;
      const b = color.b + Math.cos(positions[p * 3 + 2]) * 0.75;
      const r = color.r + Math.cos(1.7 + positions[p * 3 + 2]) * 0.75;

      colors.push(r, g, b, 1);
    }
  }
  sphere.setVerticesData(BABYLON.VertexBuffer.ColorKind, colors);
}
