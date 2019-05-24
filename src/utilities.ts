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

export function createAnimationEnter(property: string, mesh: BABYLON.Mesh) {
  const frameRate = 10;

  const open = new BABYLON.Animation(
    "animation-enter",
    property,
    frameRate,
    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );

  var easingFunction = new BABYLON.ElasticEase(1);
  easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);

  open.setEasingFunction(easingFunction);

  var keyFrames = [
    {
      frame: 0,
      value: BABYLON.Vector3.Zero()
    },
    {
      frame: frameRate,
      value: BABYLON.Vector3.One()
    }
  ];

  open.setKeys(keyFrames);

  return mesh
    .getScene()
    .beginDirectAnimation(mesh, [open], 0, frameRate, false, 2);
}

export function createAnimationExit(property: string, mesh: BABYLON.Mesh) {
  const frameRate = 10;

  const open = new BABYLON.Animation(
    "animation-exit",
    property,
    frameRate,
    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );

  var easingFunction = new BABYLON.ElasticEase(1);
  easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEIN);

  open.setEasingFunction(easingFunction);

  var keyFrames = [
    {
      frame: 0,
      value: BABYLON.Vector3.One()
    },
    {
      frame: frameRate,
      value: BABYLON.Vector3.Zero()
    }
  ];

  open.setKeys(keyFrames);

  return mesh
    .getScene()
    .beginDirectAnimation(mesh, [open], 0, frameRate, false, 2);
}
