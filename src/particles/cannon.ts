import * as BABYLON from "babylonjs";
import { Resources, AssetTextures } from "../services/resources";

export class CannonParticles {
  private scene: BABYLON.Scene;
  private particleSystem: BABYLON.ParticleSystem;
  private direction: BABYLON.Vector3;

  constructor(scene: BABYLON.Scene, resources: Resources) {
    const capacity = 15;
    const particleSystem = new BABYLON.ParticleSystem(`particles.cannon`, capacity, scene);

    particleSystem.particleTexture = resources.getTexture(AssetTextures.PARTICLE_BUBBLEBURST);
    particleSystem.startDirectionFunction = this.particleStartDirection.bind(this);

    particleSystem.minAngularSpeed = -15;
    particleSystem.maxAngularSpeed = 15;

    particleSystem.minInitialRotation = 0;
    particleSystem.maxInitialRotation = Math.PI * 2;

    particleSystem.minSize = 0.5;
    particleSystem.maxSize = 2;
    particleSystem.gravity = new BABYLON.Vector3(0, 0, 0);

    particleSystem.preWarmStepOffset = 0;
    particleSystem.emitRate = capacity * 1000;
    particleSystem.minEmitPower = 15;
    particleSystem.maxEmitPower = 20;

    particleSystem.minLifeTime = 0.25;
    particleSystem.maxLifeTime = 0.5;
    particleSystem.emitter = BABYLON.Vector3.Zero();

    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
    particleSystem.textureMask = BABYLON.Color4.FromInts(255, 255, 255, 255);

    particleSystem.color1 = BABYLON.Color4.FromColor3(BABYLON.Color3.White());
    particleSystem.color2 = BABYLON.Color4.FromColor3(BABYLON.Color3.White());
    particleSystem.colorDead = BABYLON.Color4.FromColor3(BABYLON.Color3.White());

    this.particleSystem = particleSystem;
    this.direction = BABYLON.Vector3.Up();
    this.scene = scene;
  }

  private particleStartDirection(_: any, __: any, particle: BABYLON.Particle) {
    particle.direction.set(this.direction.x + Math.random() - 0.5, this.direction.y + Math.random() - 0.5, this.direction.z + Math.random() - 0.5);
  }

  public shoot(position: BABYLON.Vector3, direction: BABYLON.Vector3, color: BABYLON.Color3) {
    this.direction.copyFrom(direction);
    this.particleSystem.emitter = position;
    this.particleSystem.color1 = BABYLON.Color4.FromColor3(color);
    this.particleSystem.color2 = BABYLON.Color4.FromColor3(color, 0.5);
    this.particleSystem.colorDead = BABYLON.Color4.FromColor3(color, 0);

    if (!this.particleSystem.isStarted()) {
      this.particleSystem.start();
    }

    this.scene.onAfterParticlesRenderingObservable.addOnce(() => {
      if (this.particleSystem.isStarted()) {
        this.particleSystem.stop();
      }
    });
  }
}
