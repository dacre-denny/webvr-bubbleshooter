import { Colors } from "./bubble";

export function randomColor() {
  return Math.floor(Math.random() * 4) as Colors;
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
