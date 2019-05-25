import * as BABYLON from "babylonjs";
import { Colors } from "./objects/bubble";
import * as GUI from "babylonjs-gui";
import { Theme } from "./assets";

export function randomColor() {
  // n += 0.77;
  //return Math.floor(n % 4) as Colors;
  return Math.floor(Math.random() * 6) as Colors;
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function applyPosition(sphere: BABYLON.Mesh) {
  const b = sphere.getBoundingInfo();
  const range = BABYLON.Vector3.Maximize(
    BABYLON.Vector3.One(),
    b.maximum.subtract(b.minimum)
  );
  var positions = sphere.getVerticesData(BABYLON.VertexBuffer.PositionKind);
  if (positions) {
    for (var p = 0; p < positions.length / 3; p++) {
      const x = positions[p * 3 + 0];
      positions[p * 3 + 1] += Math.sin(x * 3) * 0.1;
      // positions[p * 3 + 1] += Math.random();
      // positions[p * 3 + 2] += Math.random();
    }
  }
  sphere.setVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
}
export function applyColors(
  sphere: BABYLON.Mesh,
  color: BABYLON.Color3,
  frequency: number = 3
) {
  const b = sphere.getBoundingInfo();
  const range = BABYLON.Vector3.Maximize(
    BABYLON.Vector3.One(),
    b.maximum.subtract(b.minimum)
  );
  var colors = sphere.getVerticesData(BABYLON.VertexBuffer.ColorKind);
  if (!colors) {
    colors = [];
    var positions = sphere.getVerticesData(BABYLON.VertexBuffer.PositionKind);

    for (var p = 0; p < positions.length / 3; p++) {
      let pos = new BABYLON.Vector4(
        positions[p * 3 + 0],
        positions[p * 3 + 1],
        positions[p * 3 + 2],
        1
      );

      const g =
        color.g * (1 - 0.125) + Math.sin((frequency * pos.x) / range.x) * 0.125;
      const b =
        color.b * (1 - 0.125) + Math.cos((frequency * pos.y) / range.y) * 0.125;
      const r =
        color.r * (1 - 0.125) +
        Math.cos(Math.PI + (frequency * pos.z) / range.z) * 0.125;

      colors.push(r, g, b, 1);
    }
  }
  sphere.setVerticesData(BABYLON.VertexBuffer.ColorKind, colors);
}

export function createGlass() {
  const glass = new GUI.Rectangle("glass");
  glass.zIndex = -1;
  glass.cornerRadius = 20;
  glass.height = `100%`;
  glass.widthInPixels = 400;
  glass.background = Theme.COLOR_WHITE + "33";
  glass.thickness = 0;

  return glass;
}

export function createTextBlock(
  text: string,
  size: number,
  color: string = "white"
) {
  const textBlock = new GUI.TextBlock();
  textBlock.text = text;
  textBlock.fontSize = size;
  textBlock.heightInPixels = size + 10;
  textBlock.paddingBottomInPixels = 5;
  textBlock.paddingTopInPixels = 5;
  textBlock.color = color;
  textBlock.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;

  return textBlock;
}
export function createAnimationTranslate(
  property: string,
  destination: BABYLON.Vector3,
  mesh: BABYLON.AbstractMesh
) {
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
      value: mesh.position
    },
    {
      frame: frameRate,
      value: destination
    }
  ];

  open.setKeys(keyFrames);

  return mesh
    .getScene()
    .beginDirectAnimation(mesh, [open], 0, frameRate, false, 2);
}

export function createAnimationEnter(
  property: string,
  mesh: BABYLON.AbstractMesh
) {
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

export function createAnimationExit(
  property: string,
  mesh: BABYLON.AbstractMesh
) {
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
  const scene = mesh.getScene();

  return scene.beginDirectAnimation(mesh, [open], 0, frameRate, false, 2);
}

export function createAnimationScale(
  property: string,
  mesh: BABYLON.AbstractMesh
) {
  const frameRate = 10;

  const open = new BABYLON.Animation(
    "animation-scale",
    property,
    frameRate,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );

  var easingFunction = new BABYLON.ElasticEase(1);
  easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);

  open.setEasingFunction(easingFunction);

  var keyFrames = [
    {
      frame: 0,
      value: 1.25
    },
    {
      frame: frameRate,
      value: 1
    }
  ];

  open.setKeys(keyFrames);

  return mesh
    .getScene()
    .beginDirectAnimation(mesh, [open], 0, frameRate, false, 2);
}
