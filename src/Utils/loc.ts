import { Unit } from "w3ts";

let zeroLoc;
let CachedFourCC: {[key: string]: number} = {};
export function LocGetZ(atX: number, atY: number) {
	MoveLocation(zeroLoc, atX, atY);
	return GetLocationZ(zeroLoc);
}

export function SetUnitZ(whichUnit: Unit, newZ: number) {
	whichUnit.setflyHeight(newZ - LocGetZ(whichUnit.x, whichUnit.y), 0);
}

export function UnitGetZ(whichUnit: Unit) {
	return LocGetZ(whichUnit.x, whichUnit.y) + whichUnit.getflyHeight();
}

export function FastCC(s: string): number {
	if (s.length > 4 || s.length == 0) return;

	if (CachedFourCC[s]) return CachedFourCC[s]

	CachedFourCC[s] = FourCC(s);
	return CachedFourCC[s];
}
