import * as BABYLON from "babylonjs";
import { Bubble } from "./bubble";

export class Particles {
  public static createBubblePopPartciles(
    scene: BABYLON.Scene,
    position: BABYLON.Vector3
  ) {
    const particles = new BABYLON.ParticleSystem("particles", 20, scene);

    particles.particleTexture = new BABYLON.Texture(
      "./images/particle-bubble-burst.png",
      scene
    );

    particles.startDirectionFunction = (
      a: any,
      b: any,
      particle: BABYLON.Particle
    ) => {
      particle.direction.set(Math.random() - 0.5, 0, Math.random() - 0.5);
    };

    particles.maxAngularSpeed = 25;
    particles.minAngularSpeed = -25;

    particles.maxInitialRotation = Math.PI * 2;
    particles.minInitialRotation = 0;

    particles.maxSize = 1;
    particles.minSize = 0.5;
    particles.gravity = new BABYLON.Vector3(0, -9.81, 0);

    particles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;

    particles.emitRate = 500;
    particles.minEmitPower = 15;
    particles.maxEmitPower = 20;
    particles.emitter = position;

    particles.color1 = BABYLON.Color4.FromColor3(BABYLON.Color3.Red());
    particles.color2 = BABYLON.Color4.FromColor3(BABYLON.Color3.Blue());

    const onRender = () => {
      if (!particles.isStarted()) {
        if (!particles.isAlive()) {
          particles.dispose();
          scene.onBeforeRenderObservable.remove(observer);
        }
      }
    };

    const observer = scene.onBeforeRenderObservable.add(onRender);

    return particles;
  }

  public static createConfetti(
    scene: BABYLON.Scene,
    position: BABYLON.Vector3
  ) {
    const particles = new BABYLON.ParticleSystem(
      "particles-confetti",
      100,
      scene
    );

    particles.particleTexture = new BABYLON.Texture(
      "./images/particle-confetti.png",
      scene
    );

    particles.startPositionFunction = (
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
    particles.startDirectionFunction = (
      a: any,
      b: any,
      particle: BABYLON.Particle
    ) => {
      particle.direction.set(Math.random() - 0.5, 0, Math.random() - 0.5);
    };

    particles.maxAngularSpeed = 15;
    particles.minAngularSpeed = -15;

    particles.maxInitialRotation = Math.PI * 2;
    particles.minInitialRotation = 0;

    particles.maxSize = 1;
    particles.minSize = 0.5;
    particles.gravity = new BABYLON.Vector3(0, -5.81, 0);

    particles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;

    particles.emitRate = 25;
    particles.emitter = BABYLON.Vector3.Zero();
    particles.minEmitPower = 5;
    particles.maxEmitPower = 10;
    particles.minLifeTime = 3.5;
    particles.maxLifeTime = 5;

    particles.color1 = BABYLON.Color4.FromColor3(BABYLON.Color3.Red());
    particles.color2 = BABYLON.Color4.FromColor3(BABYLON.Color3.Blue());

    const onRender = () => {
      if (!particles.isStarted()) {
        if (!particles.isAlive()) {
          particles.dispose();
          scene.onBeforeRenderObservable.remove(observer);
        }
      }
    };

    const observer = scene.onBeforeRenderObservable.add(onRender);
    return particles;
  }
}
