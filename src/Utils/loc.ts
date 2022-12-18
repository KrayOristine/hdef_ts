const zeroLoc = Location(0, 0);
const zeroRect = Rect(0, 0, 0, 0);
var cacheCC = {};
export function LocGetZ(atX: number, atY: number) {
  MoveLocation(zeroLoc, atX, atY);
  return GetLocationZ(zeroLoc);
}

export function SetUnitZ(whichUnit: unit, newZ: number) {
  SetUnitFlyHeight(
    whichUnit,
    newZ - LocGetZ(GetUnitX(whichUnit), GetUnitY(whichUnit)),
    0
  );
}

export function UnitGetZ(whichUnit: unit) {
  return (
    LocGetZ(GetUnitX(whichUnit), GetUnitY(whichUnit)) +
    GetUnitFlyHeight(whichUnit)
  );
}

export function FastCC(s: string): number {
  if (s.length > 4) return;
  if (!cacheCC[s]) {
    cacheCC[s] = FourCC(s);
  }
  return cacheCC[s];
}
