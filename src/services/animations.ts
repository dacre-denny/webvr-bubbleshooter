import * as BABYLON from "babylonjs";

const FRAME_RATE = 5;

const EasingOut = new BABYLON.ElasticEase(1);
EasingOut.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);

const EasingIn = new BABYLON.ElasticEase(1);
EasingIn.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEIN);

export const AnimationSpringOpen = new BABYLON.Animation(
  "animation-spring-open",
  "scaling",
  FRAME_RATE,
  BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
  BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
);

AnimationSpringOpen.setEasingFunction(EasingOut);
AnimationSpringOpen.setKeys([
  {
    frame: 0,
    value: BABYLON.Vector3.Zero()
  },
  {
    frame: FRAME_RATE,
    value: BABYLON.Vector3.One()
  }
]);

export const AnimationSpringClose = new BABYLON.Animation(
  "animation-spring-close",
  "scaling",
  FRAME_RATE,
  BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
  BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
);

AnimationSpringClose.setEasingFunction(EasingIn);
AnimationSpringClose.setKeys([
  {
    frame: 0,
    value: BABYLON.Vector3.One()
  },
  {
    frame: FRAME_RATE,
    value: BABYLON.Vector3.Zero()
  }
]);

export function applyAnimation(mesh: BABYLON.AbstractMesh, animation: BABYLON.Animation) {
  return mesh.getScene().beginDirectAnimation(mesh, [animation], 0, FRAME_RATE, false, 2);
}
