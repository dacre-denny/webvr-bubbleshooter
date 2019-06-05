import * as BABYLON from "babylonjs";
import { Colors, Bubble, ColorMap } from "../objects/bubble";
import { applyColors } from "../utilities";

export enum AssetSounds {
  SOUND_MUSIC = "./audio/music.mp3",
  SOUND_BUTTON = "./audio/button.mp3",
  SOUND_SHOOT = "./audio/shoot.mp3",
  SOUND_GAMEOVER = "./audio/gameover.mp3",
  SOUND_POP = "./audio/pop.mp3"
}

export enum AssetTextures {
  IMAGE_GAMEEND = "./images/game-end.png",
  IMAGE_GAMETITLE = "./images/game-title.png"
}

/**
 * The resources class provides a common/shared service for asset and resource access throughout the app
 */
export class Resources {
  private scene: BABYLON.Scene;
  private assetMap: Map<string, BABYLON.Sound | BABYLON.Texture>;
  private material: BABYLON.StandardMaterial;
  private onFinishObservable: BABYLON.Observable<Error[]>;
  private onProgressObservable: BABYLON.Observable<number>;

  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
    this.assetMap = new Map();
    this.material = null;
    this.onFinishObservable = new BABYLON.Observable<Error[]>();
    this.onProgressObservable = new BABYLON.Observable<number>();
  }

  private release() {
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }

    // Release asset resources
    for (const asset of this.assetMap.values()) {
      asset.dispose();
    }
    this.assetMap.clear();
  }

  private createMaterial() {
    const material = new BABYLON.StandardMaterial("material", this.scene);
    material.diffuseColor = BABYLON.Color3.White();
    material.emissiveColor = BABYLON.Color3.White();
    material.disableLighting = true;
    material.fogEnabled = false;
    material.freeze();
  }

  private createMeshes() {
    const createBubble = (color: Colors) => {
      const mesh = BABYLON.MeshBuilder.CreateSphere(
        `mesh.bubble.${color}`,
        {
          segments: 1,
          diameter: Bubble.RADIUS * 2,
          updatable: true
        },
        this.scene
      );

      applyColors(mesh, ColorMap.get(color));

      mesh.material = this.scene.getMaterialByName("material");
      mesh.isVisible = false;
    };

    createBubble(Colors.BLUE);
    createBubble(Colors.GREEN);
    createBubble(Colors.ORANGE);
    createBubble(Colors.PURPLE);
    createBubble(Colors.RED);
    createBubble(Colors.YELLOW);
  }

  private loadAssets() {
    const assetsManager = new BABYLON.AssetsManager(this.scene);

    // Load sounds
    for (const key in AssetSounds) {
      const path = AssetSounds[key];
      const task = assetsManager.addBinaryFileTask(path, path);

      task.onSuccess = (t: BABYLON.BinaryFileAssetTask) => this.assetMap.set(t.name, new BABYLON.Sound(t.name, t.data, this.scene));
    }

    // Load textures
    for (const key in AssetTextures) {
      const path = AssetTextures[key];
      const task = assetsManager.addTextureTask(path, path);

      task.onSuccess = (t: BABYLON.TextureAssetTask) => {
        this.assetMap.set(t.name, t.texture);
      };
    }

    assetsManager.onProgress = (i: number, n: number) => {
      this.onProgressObservable.notifyObservers(Math.ceil((100 * (n - i)) / n));
    };
    assetsManager.onFinish = (tasks: BABYLON.AbstractAssetTask[]) => {
      const errors = tasks.filter(t => t.isCompleted !== true).map(t => t.errorObject.exception);

      this.onFinishObservable.notifyObservers(errors);
    };

    assetsManager.useDefaultLoadingScreen = false;
    assetsManager.load();
  }

  public get onFinish() {
    return this.onFinishObservable;
  }

  public get onProgress() {
    return this.onProgressObservable;
  }

  public getSound(asset: AssetSounds) {
    return this.assetMap.get(asset) as BABYLON.Sound;
  }

  public getTexture(asset: AssetTextures) {
    return this.assetMap.get(asset) as BABYLON.Texture;
  }

  public getMaterial() {
    return this.material;
  }

  public getBubble(color: Colors) {
    return this.scene.getMeshByName(`mesh.bubble.${color}`) as BABYLON.Mesh;
  }

  public loadResources() {
    this.release();

    this.createMaterial();
    this.createMeshes();

    return this.loadAssets();
  }
}
