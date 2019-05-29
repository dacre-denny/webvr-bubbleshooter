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

type AssetTypes = Record<keyof AssetSounds, BABYLON.Sound>;

/**
 * The asset class provides a common/shared service for asset access throughout the app
 */
export class Assets<K extends string, T> {
  private scene: BABYLON.Scene;
  private assetMap: Map<string, any>;

  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
  }

  public getAsset(asset: K): T {
    return;
  }

  public async loadAllAssets() {
    for (const asset of this.assetMap.values()) {
      /// dispose
    }

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
}
