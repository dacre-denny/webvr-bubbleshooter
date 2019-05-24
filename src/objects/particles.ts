import * as BABYLON from "babylonjs";
import { Bubble } from "./bubble";

export class Particles {
  public static createBubblePopPartciles(
    scene: BABYLON.Scene,
    position: BABYLON.Vector3,
    color: BABYLON.Color3
  ) {
    const particleSystem = new BABYLON.ParticleSystem(
      "particles-bubble",
      45,
      scene
    );

    particleSystem.particleTexture = new BABYLON.Texture(
      "./images/particle-bubble-burst.png",
      scene
    );

    particleSystem.startDirectionFunction = (
      a: any,
      b: any,
      particle: BABYLON.Particle
    ) => {
      particle.direction.set(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      );
    };

    particleSystem.maxAngularSpeed = 15;
    particleSystem.minAngularSpeed = -15;

    particleSystem.maxInitialRotation = Math.PI * 2;
    particleSystem.minInitialRotation = 0;

    particleSystem.maxSize = 1;
    particleSystem.minSize = 0.5;
    particleSystem.gravity = new BABYLON.Vector3(0, -9.8, 0);

    particleSystem.preWarmStepOffset = 0;
    particleSystem.manualEmitCount = 100;
    particleSystem.minEmitPower = 5;
    particleSystem.maxEmitPower = 20;

    particleSystem.maxLifeTime = 0.75;
    particleSystem.minLifeTime = 0.5;
    particleSystem.emitter = position;
    particleSystem.disposeOnStop = true;

    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
    particleSystem.textureMask = BABYLON.Color4.FromInts(255, 255, 255, 255);

    particleSystem.color1 = BABYLON.Color4.FromColor3(color);
    particleSystem.color2 = BABYLON.Color4.FromColor3(
      color.add(BABYLON.Color3.White().scale(0.5))
    );
    particleSystem.colorDead = BABYLON.Color4.FromColor3(color, 0);

    const onRender = () => {
      if (particleSystem.particles.length > 0) {
        particleSystem.stop();
        scene.onBeforeRenderObservable.remove(observer);
      }
    };

    const observer = scene.onBeforeRenderObservable.add(onRender);

    particleSystem.start();
  }

  public static createConfetti(
    scene: BABYLON.Scene,
    position: BABYLON.Vector3
  ) {
    const particleSystem = new BABYLON.ParticleSystem(
      "particles-confetti",
      100,
      scene
    );

    particleSystem.particleTexture = new BABYLON.Texture(
      "./images/particle-confetti.png",
      scene
    );

    particleSystem.startPositionFunction = (
      a: any,
      b: any,
      particle: BABYLON.Particle
    ) => {
      particle.position
        .copyFrom(position)
        .addInPlace(
          new BABYLON.Vector3(
            10 * (Math.random() - 0.5),
            0,
            10 * (Math.random() - 0.5)
          )
        );
    };
    particleSystem.startDirectionFunction = (
      a: any,
      b: any,
      particle: BABYLON.Particle
    ) => {
      particle.direction.set(Math.random() - 0.5, 0, Math.random() - 0.5);
    };

    particleSystem.maxAngularSpeed = 15;
    particleSystem.minAngularSpeed = -15;

    particleSystem.maxInitialRotation = Math.PI * 2;
    particleSystem.minInitialRotation = 0;

    particleSystem.maxSize = 1;
    particleSystem.minSize = 0.5;
    particleSystem.gravity = new BABYLON.Vector3(0, -5.81, 0);

    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;

    particleSystem.emitRate = 25;
    particleSystem.emitter = BABYLON.Vector3.Zero();
    particleSystem.minEmitPower = 5;
    particleSystem.maxEmitPower = 10;
    particleSystem.minLifeTime = 3.5;
    particleSystem.maxLifeTime = 5;

    particleSystem.color1 = BABYLON.Color4.FromColor3(BABYLON.Color3.Red());
    particleSystem.color2 = BABYLON.Color4.FromColor3(BABYLON.Color3.Blue());
    particleSystem.colorDead = BABYLON.Color4.FromColor3(
      BABYLON.Color3.Yellow(),
      0
    );

    particleSystem.disposeOnStop = true;

    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
    particleSystem.textureMask = BABYLON.Color4.FromInts(255, 255, 255, 255);

    const onRender = () => {
      if (!particleSystem.isStarted()) {
        if (!particleSystem.isAlive()) {
          particleSystem.dispose();
          scene.onBeforeRenderObservable.remove(observer);
        }
      }
    };

    const observer = scene.onBeforeRenderObservable.add(onRender);

    particleSystem.start();

    return particleSystem;
  }
}
