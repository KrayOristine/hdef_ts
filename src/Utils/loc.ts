let zeroLoc;
let CachedFourCC: {[key: string]: number} = {};
export function LocGetZ(atX: number, atY: number) {
	MoveLocation(zeroLoc, atX, atY);
	return GetLocationZ(zeroLoc);
}

export function SetUnitZ(whichUnit: unit, newZ: number) {
	SetUnitFlyHeight(whichUnit, newZ - LocGetZ(GetUnitX(whichUnit), GetUnitY(whichUnit)), 0);
}

export function UnitGetZ(whichUnit: unit) {
	return LocGetZ(GetUnitX(whichUnit), GetUnitY(whichUnit)) + GetUnitFlyHeight(whichUnit);
}

export function FastCC(s: string): number {
	if (s.length > 4 || s.length == 0) return;

	if (CachedFourCC[s]) return CachedFourCC[s]

	CachedFourCC[s] = FourCC(s);
	return CachedFourCC[s];
}
