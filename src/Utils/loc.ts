import { Unit } from "w3ts";
export const zeroLoc = Location(0, 0);
const cacheCC = {};
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
	if (s.length > 4) return;
	if (!cacheCC[s]) {
		cacheCC[s] = FourCC(s);
	}
	return cacheCC[s];
}
