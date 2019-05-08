import { Game } from "./game";

window.addEventListener("DOMContentLoaded", () => {
  const game = new Game("canvas");

  game.createScene();

  game.launch();
});
