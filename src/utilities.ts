import { Colors } from "./bubble";

let n = 0;

export function randomColor() {
  n += 0.77;
  return Math.floor(n % 4) as Colors;
  //return Math.floor(Math.random() * 4) as Colors;
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
