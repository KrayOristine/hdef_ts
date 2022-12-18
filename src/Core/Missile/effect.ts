import { WorldBounds } from "Utils/worldBounds";
const reverseMap = new Map();
export class MissileEffect {
  private arr: MissileEffect[];
  public effect: effect;
  public x: number;
  public y: number;
  public z: number;
  public yaw: number;
  public pitch: number;
  public roll: number;
  public path: string;
  public size: number;
  __constructor(x: number, y: number, z: number, modelPath?: string) {
    this.path = modelPath || "";
    this.yaw = 0;
    this.pitch = 0;
    this.roll = 0;
    this.size = 0;
    this.arr = [];
    this.effect = AddSpecialEffect(this.path, x, y);
    BlzSetSpecialEffectZ(this.effect, z);
  }

  destroy() {
    DestroyEffect(this.effect);
    if (this.arr.length > 0) this.arr.forEach((x) => x.destroy());
  }

  scale(v: number) {
    this.size = v;
    BlzSetSpecialEffectScale(this.effect, v);
  }

  orient(yaw: number, pitch: number, roll: number) {
    this.yaw = yaw;
    this.pitch = pitch;
    this.roll = roll;
    BlzSetSpecialEffectOrientation(this.effect, yaw, pitch, roll);
    for (let i = 0; i < this.arr.length; i++) {
      this.arr[i].yaw = yaw;
      this.arr[i].pitch = pitch;
      this.arr[i].roll = roll;
      BlzSetSpecialEffectOrientation(this.arr[i].effect, yaw, pitch, roll);
    }
    return this;
  }

  move(x: number, y: number, z: number) {
    if (
      x > WorldBounds.maxX ||
      x < WorldBounds.minY ||
      y > WorldBounds.maxX ||
      y < WorldBounds.minY
    )
      return false;

    BlzSetSpecialEffectPosition(this.effect, x, y, z);
    this.arr.forEach((eff) => {
      BlzSetSpecialEffectPosition(eff.effect, x - eff.x, y - eff.y, z - eff.z);
    });
    return true;
  }

  attach(x: number, y: number, z: number, scale: number, model?: string) {}
}
