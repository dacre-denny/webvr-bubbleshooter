import * as BABYLON from "babylonjs";

type SoundAsset = Record<string, BABYLON.Sound>;
type TextureAsset = Record<string, BABYLON.Texture>;

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

  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
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

  private async loadAssets() {
    const assetsManager = new BABYLON.AssetsManager(this.scene);

    // Load sounds
    for (const key in AssetSounds) {
      const path = AssetSounds[key];
      const task = assetsManager.addBinaryFileTask(key, path);

      task.onSuccess = (t: BABYLON.BinaryFileAssetTask) => {
        this.assetMap.set(t.name, new BABYLON.Sound(t.name, t.data, this.scene));
      };
    }

    // Load textures
    for (const key in AssetTextures) {
      const path = AssetTextures[key];
      const task = assetsManager.addTextureTask(key, path);

      task.onSuccess = (t: BABYLON.TextureAssetTask) => {
        this.assetMap.set(t.name, t.texture);
      };
    }

    await assetsManager.loadAsync();
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

  public async loadResources() {
    this.release();

    this.createMaterial();

    await this.loadAssets();
  }
}
