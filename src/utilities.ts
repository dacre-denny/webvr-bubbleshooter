import { Colors } from "./bubble";

export function randomColor() {
  return Math.floor(Math.random() * 4) as Colors;
}
