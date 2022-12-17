import { SetUnitZ } from "Utils/loc";
import { Timer } from "w3ts";
import { addScriptHook, W3TS_HOOK } from "w3ts";
const g = CreateGroup();
const p = Player(PLAYER_NEUTRAL_PASSIVE);
export const DUMMY_ID = FourCC("dumi");
export const DUMMY_ABIL = FourCC("Amrf");
export class Pool {
  static recycle(u: unit) {
    if (GetUnitTypeId(u) != DUMMY_ID) return;
    GroupAddUnit(g, u);
    SetUnitX(u, 0);
    SetUnitY(u, 0);
    BlzPauseUnitEx(u, true);
  }

  static retrieve(x: number, y: number, z: number, face: number) {
    if (BlzGroupGetSize(g) == 0) {
      let u = CreateUnit(p, DUMMY_ID, x, y, face);
      SetUnitZ(u, z);
      UnitRemoveAbility(u, DUMMY_ABIL);
      return u;
    }
    let u = BlzGroupUnitAt(g, 0);
    GroupRemoveUnit(g, u);
    SetUnitX(u, x);
    SetUnitY(u, y);
    SetUnitZ(u, z);
    BlzSetUnitFacingEx(u, face);
    return u;
  }

  static delay(u: unit, time: number) {
    if (GetUnitTypeId(u) != DUMMY_ID) return;
    new Timer().start(time, false, () => {
      Pool.recycle(u);
    });
  }
}

const onInit = () => {};

addScriptHook(W3TS_HOOK.INIT_BEFORE, onInit);
