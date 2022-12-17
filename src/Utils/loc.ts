const zeroLoc = Location(0, 0);
const zeroRect = Rect(0, 0, 0, 0);
var cacheCC = {};
export function LocGetZ(x, y) {
  MoveLocation(zeroLoc, x, y);
  return GetLocationZ(zeroLoc);
}

export function SetUnitZ(u: unit, z: number) {
  SetUnitFlyHeight(u, z - LocGetZ(GetUnitX(u), GetUnitY(u)), 0);
}

export function FastCC(s: string) {
  if (s.length > 4) return;
  return !cacheCC[s] ? FourCC(s) : cacheCC[s];
}
