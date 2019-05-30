import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";
import { createAnimationExit, createTextBlock, createAnimationEnter, createGlass } from "../utilities";
import { Theme, Assets } from "../assets";
import { Resources, AssetSounds } from "../services/resources";

export class MenuGUI {
  private texture: GUI.AdvancedDynamicTexture;
  private plane: BABYLON.Mesh;
  private scene: BABYLON.Scene;
  private resource: Resources;
  private onCloseObservable: BABYLON.Observable<void>;

  constructor(scene: BABYLON.Scene, resource: Resources) {
    this.scene = scene;
    this.resource = resource;
    this.onCloseObservable = new BABYLON.Observable<void>();
  }

  public get onClose() {
    return this.onCloseObservable;
  }

  public place(ray: BABYLON.Ray) {
    this.plane.position.copyFrom(ray.origin.add(ray.direction.scale(2)));
    this.plane.setDirection(ray.direction);
  }

  public close() {
    if (!this.plane) {
      return;
    }

    this.resource.getSound(AssetSounds.SOUND_BUTTON).play();

    const exitAnimationEnd = createAnimationExit("scaling", this.plane).onAnimationEndObservable;

    exitAnimationEnd.add(() => {
      this.texture.dispose();
      this.plane.dispose();

      this.texture = null;
      this.plane = null;
    });
  }

  public open() {
    if (this.plane) {
      return;
    }

    const plane = BABYLON.MeshBuilder.CreatePlane(
      "menu",
      {
        size: 5,
        sourcePlane: new BABYLON.Plane(0, -1, 0, 0)
      },
      this.scene
    );
    plane.position.addInPlace(new BABYLON.Vector3(2.5, 0, 2.5));
    const texture = GUI.AdvancedDynamicTexture.CreateForMesh(plane, 800, 800, true);

    var panel = new GUI.StackPanel("panel");
    panel.heightInPixels = 300;

    {
      var title = new GUI.Image("game-title", Assets.GUI_GAMEMENU_MEADING);
      title.left = 0;
      title.top = 0;
      title.heightInPixels = 135;
      title.widthInPixels = 455;

      panel.addControl(title);
    }

    panel.addControl(createTextBlock(`Pull trigger to play!`, 20, Theme.COLOR_BLUE));
    {
      const glass = createGlass();
      glass.height = "70%";
      glass.paddingTop = "30%";

      panel.addControl(glass);
    }

    texture.addControl(panel);

    const position = new BABYLON.Vector3().addInPlace(BABYLON.Vector3.Up()).addInPlace(BABYLON.Vector3.Forward().scale(6));

    plane.setDirection(BABYLON.Vector3.Forward());
    plane.position.copyFrom(position);

    createAnimationEnter("scaling", plane).onAnimationEndObservable.addOnce(() => {
      plane.onBeforeRenderObservable.add(() => {
        const time = Date.now() / 500;
        const scale = 1 + Math.sin(time) * 0.05;
        title.scaleX = scale;
        title.scaleY = scale;
        title.rotation = Math.sin(time * 0.3) * 0.05;
      });
    });

    this.texture = texture;
    this.plane = plane;
  }
}
