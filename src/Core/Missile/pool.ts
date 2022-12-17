import { SetUnitZ } from "Utils/loc";
import { Unit } from "w3ts";
const g = CreateGroup();
export const DUMMY_ID = FourCC("dumi");
export const DUMMY_ABIL = FourCC("Amrf");
export class Pool {
  recycle(u: unit) {
    if (GetUnitTypeId(u) != DUMMY_ID) return;
    GroupAddUnit(g, u);
    SetUnitX(u, 0);
    SetUnitY(u, 0);
    BlzPauseUnitEx(u, true);
  }

  retrieve(x: number, y: number, z: number, face: number) {
    if (BlzGroupGetSize(g) == 0) {
      let u = new Unit(PLAYER_NEUTRAL_PASSIVE, DUMMY_ID, x, y, face);
      SetUnitZ(u.handle, z);
    }
  }
}
