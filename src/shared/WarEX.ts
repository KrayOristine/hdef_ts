//! KEEP 0 DEPENDENCIES FROM OTHER SOURCES

import * as js from "./jsNative"; // Polyfill for natives JS environ

/*
 * A file contain all useful utility function for maps development
*/

// Declare used variables
const _mmTb: LuaTable = new LuaTable;
const _nt_timerList: timer[] = [];
const _nt_funcList: LuaMap<timer,Func1<timer,boolean|undefined>> = new LuaMap;
let zeroLoc: location;

export let safeFilter: boolexpr;
export let safeCondition: boolexpr;

export function Init(){
  zeroLoc = Location(0,0);
	safeFilter = Filter(function(){return true})
	safeCondition = Condition(function(){return true});
}

// Utility for LuaTable
export function LuaTableContains<T2>(table: LuaTable<number,T2>, data: T2): boolean {
	for (const i of $range(1, table.length())){
		if (table.get(i) == data) return true;
	}
	return false
}

export function ArrContains<T>(arr: T[], data: T): boolean{
  for (const i of $range(1, arr.length)){
    if (arr[i] == data) return true;
  }
  return false
}


function __nt_periodic(){
  let tmr = GetExpiredTimer();
  if (!tmr) error("Timer does not exists or was destroyed!");

  let result = false;
  try {
    let v = _nt_funcList.get(tmr);
    result = (v && v(tmr)) ?? false
  } catch (ex){
    DisplayTimedTextToPlayer(GetLocalPlayer(), 0, 0.5, 15, ex as string);
  }
  if (!result) return;

  PauseTimer(tmr);
  _nt_timerList.push(tmr);
  _nt_funcList.delete(tmr);
}

function __nt_single(){
  let tmr = GetExpiredTimer();
  if (!tmr) error("Timer does not exists or was destroyed!");

  try {
    let v = _nt_funcList.get(tmr);
    v && v(tmr)
  } catch (ex) {
    DisplayTimedTextToPlayer(GetLocalPlayer(), 0, 0.5, 15, ex as string);
  }

  PauseTimer(tmr);
  _nt_timerList.push(tmr);
  _nt_funcList.delete(tmr);
}

/**
 * Create a timer and run, will automatically recycle or you can do it yourself by ```ReleaseTimer()```
 * @param callback A function takes a timer which is the timer that is running that function and return boolean to indicate
 * that this timer is can now be recycled
 */
export function NewTimer(period: number, isPeriodic: boolean, callback: Func1<timer,boolean|undefined>){
  const tmr = (_nt_timerList.length == 0 ? CreateTimer() : _nt_timerList.pop() as timer);
  _nt_funcList.set(tmr, callback);
  if (isPeriodic) TimerStart(tmr, period, isPeriodic, __nt_periodic);
  else TimerStart(tmr, period, isPeriodic, __nt_single)

  return tmr;
}

/**
 * Release a timer to the stack
 */
export function ReleaseTimer(tmr: timer){
  PauseTimer(tmr);
  _nt_timerList.push(tmr);
  _nt_funcList.delete(tmr);
}

/**
 *
 * TS Implementation of MurmurHash2
 *
 * @author Gary Court
 * @author Austin Appleby
 *
 * @param str ASCII only
 * @param seed Positive integer only
 * @return 32-bit positive integer hash
 */
export function Hash_MurMur2(data: string, seed: number): number {
	if (_mmTb.get(data+seed) != null) return _mmTb.get(data+seed);
	let str = js.TEEncode(data),
		l = str.length,
		h = seed ^ l,
		i = 0,
		k: number;

	while (l >= 4) {
		k = (str[i] & 0xff) | ((str[++i] & 0xff) << 8) | ((str[++i] & 0xff) << 16) | ((str[++i] & 0xff) << 24);

		k = (k & 0xffff) * 0x5bd1e995 + ((((k >>> 16) * 0x5bd1e995) & 0xffff) << 16);
		k ^= k >>> 24;
		k = (k & 0xffff) * 0x5bd1e995 + ((((k >>> 16) * 0x5bd1e995) & 0xffff) << 16);

		h = ((h & 0xffff) * 0x5bd1e995 + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16)) ^ k;

		l -= 4;
		++i;
	}

	switch (l) {
		case 3:
			h ^= (str[i + 2] & 0xff) << 16;
			break;
		case 2:
			h ^= (str[i + 1] & 0xff) << 8;
			break;
		case 1:
			h ^= str[i] & 0xff;
			h = (h & 0xffff) * 0x5bd1e995 + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16);
	}

	h ^= h >>> 13;
	h = (h & 0xffff) * 0x5bd1e995 + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16);
	h ^= h >>> 15;
	h = h >>> 0
	_mmTb.set(data+seed, h);
	return h;
}

/**
 * TS Implementation of MurmurHash3 (r136) (as of May 20, 2011)
 *
 * @author Gary Court
 * @author Austin Appleby
 *
 * @param key ASCII only
 * @param seed Positive integer only
 * @return 32-bit positive integer hash
 */
export function HashMM3(data: string, seed: number): number {
	if (_mmTb.get(data+seed) != null) return _mmTb.get(data+seed);

	let key = js.TEEncode(data);
	let remainder: number, bytes: number, h1: number, h1b: number, c1: number, c2: number, k1: number, i: number;

	remainder = key.length & 3; // key.length % 4
	bytes = key.length - remainder;
	h1 = seed;
	c1 = 0xcc9e2d51;
	c2 = 0x1b873593;
	i = 0;

	while (i < bytes) {
		k1 = (key[i] & 0xff) | ((key[++i] & 0xff) << 8) | ((key[++i] & 0xff) << 16) | ((key[++i] & 0xff) << 24);
		++i;

		k1 = ((k1 & 0xffff) * c1 + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
		k1 = (k1 << 15) | (k1 >>> 17);
		k1 = ((k1 & 0xffff) * c2 + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;

		h1 ^= k1;
		h1 = (h1 << 13) | (h1 >>> 19);
		h1b = ((h1 & 0xffff) * 5 + ((((h1 >>> 16) * 5) & 0xffff) << 16)) & 0xffffffff;
		h1 = (h1b & 0xffff) + 0x6b64 + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16);
	}

	k1 = 0;
	if (remainder > 0) {
		switch (remainder) {
			case 3:
				k1 ^= (key[i + 2] & 0xff) << 16;
				break;
			case 2:
				k1 ^= (key[i + 1] & 0xff) << 8;
				break;
			case 1:
				k1 ^= key[i] & 0xff;
		}
		k1 = ((k1 & 0xffff) * c1 + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
		k1 = (k1 << 15) | (k1 >>> 17);
		k1 = ((k1 & 0xffff) * c2 + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
		h1 ^= k1;
	}

	h1 ^= key.length;

	h1 ^= h1 >>> 16;
	h1 = ((h1 & 0xffff) * 0x85ebca6b + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
	h1 ^= h1 >>> 13;
	h1 = ((h1 & 0xffff) * 0xc2b2ae35 + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16)) & 0xffffffff;
	h1 ^= h1 >>> 16;
	h1 = h1 >>> 0;
	_mmTb.set(data + seed, h1);
	return h1;
}

export function HashSimple(str: string): string {
	return string.format("%x", StringHash(str));
}

export function GetHeroPrimaryStat(h: unit, includeBonus: boolean = false): number {
	let i = BlzGetHeroPrimaryStat(h);
  if (i == 1) return GetHeroStr(h, includeBonus);
  if (i == 3) return GetHeroAgi(h, includeBonus);
  if (i == 2) return GetHeroInt(h, includeBonus);

  return 0
}

export function SetHeroPrimaryStat(h: unit, newValue: number): void {
	BlzSetHeroStatEx(h, BlzGetHeroPrimaryStat(h), newValue);
}

export function GetZ(xPos: number, yPos: number): number {
	MoveLocation(zeroLoc, xPos, yPos);
	return GetLocationZ(zeroLoc);
}

export function GetUnitZ(u: unit): number {
	return GetZ(GetUnitX(u), GetUnitY(u) + GetUnitFlyHeight(u));
}

export function SetUnitZ(u: unit, newZPos: number): void {
	SetUnitFlyHeight(u, newZPos - GetZ(GetUnitX(u), GetUnitY(u)), 0);
}

export function GroupEnumUnitInRect(g: group, r: rect, filter?: boolexpr){
	filter ??= safeFilter;

	GroupEnumUnitsInRect(g, r, filter);
}

export function GroupEnumUnitInRange(g: group, x: number, y: number, radius: number, filter?: boolexpr){
	filter ??= safeFilter;

	GroupEnumUnitsInRange(g, x, y, radius, filter);
}

export function GroupEnumUnitInRangeOfLoc(g: group, l: location, radius: number, filter?: boolexpr, wantDestroy: boolean = false){
	const x = (l == null ? 0 : GetLocationX(l));
	const y = (l == null ? 0 : GetLocationY(l));
	filter ??= safeFilter;

	GroupEnumUnitsInRange(g, x, y, radius, filter);
	if (wantDestroy) RemoveLocation(l);
}

export function GroupEnumUnitOfPlayer(g: group, p: player, filter?: boolexpr){
	filter ??= safeFilter;

	GroupEnumUnitsOfPlayer(g, p, filter);
}

export function GroupEnumUnitSelected(g: group, p: player, filter?: boolexpr){
	filter ??= safeFilter;

	GroupEnumUnitsSelected(g, p, filter);
}

/**
 * Determines whether the attacker is behind the attacked with the given tolerance in degrees.
 *
 * A tolerance of 360 would mean the target can be attacked from anywhere while being considered "behind".
 * @param attacker The unit performing the attack.
 * @param attacked The unit being attacked.
 * @param tolerance In degrees.
*/
export function IsBehindOfTarget(source: unit, target: unit, tolerance: number): boolean {
  let num1 = AngleBetweenPointsC(source, target);
  let face = GetUnitFacing(target);
  let num2 = 0.5 * tolerance;
  let num3 = 360 - num2;
  let num4 = Math.abs(num1 - face);
  if (num4 > num3) return num4 > num2;

  return true
}

/**
 * Determines whether the attacker is in front of the attacked with the given tolerance in degrees.
 *
 * A tolerance of 360 means the target can be attacked from anywhere while being considered "in front".
 * @param attacker The unit performing the attack.
 * @param attacked The unit being attacked.
 * @param tolerance In degrees.
*/
export function IsFrontOfTarget(source: unit, target: unit, tolerance: number): boolean {
  let num1 = AngleBetweenPointsC(target, source);
  let face = GetUnitFacing(target);
  let num2 = 0.5 * tolerance;
  let num3 = 360 - num2;
  let num4 = Math.abs(num1 - face);
  if (num4 > num3) return num4 > num2;

  return true
}

/**
 *  Calculates the distance from x1, y1 to x2, y2.
 *
 *  All parameters must be pre-calculated.
*/
export function DistanceBetweenPoints(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(((x1 - x2) * (x1 - x2)) + ((y1 - y2) * (y1 - y2)));
}

/**
 *  Calculates the angle in degrees from source unit to (x2, y2).
 *
 *  source must be pre-calculated.
*/
export function AngleBetweenPointsA(source: unit, x2: number, y2: number): number {
  return 180 + (57.2957764 * Math.atan2(GetUnitY(source) - y2, GetUnitX(source) - x2))

}

/**
 *  Calculates the angle in degrees from (x1, y1) to target unit.
 *
 *  target must be pre-calculated.
*/
export function AngleBetweenPointsB(x1: number, y1: number, target: unit): number {
  return 180 + (57.2957764 * Math.atan2(y1 - GetUnitY(target), x1 - GetUnitX(target)))
}

/**
 *  Calculates the angle in degrees from source unit to target unit.
 *
 *  All parameters must be pre-calculated.
*/
export function AngleBetweenPointsC(source: unit, target: unit): number {
  return 180 + (57.2957764 * Math.atan2(GetUnitY(source) - GetUnitY(target), GetUnitX(source) - GetUnitX(target)))
}

/**
 *  Calculates the angle in degrees from (x1, y1) to (x2, y2).
*/
export function AngleBetweenPointsD(x1: number, y1: number, x2: number, y2: number): number {
  return 180 + (57.2957764 * Math.atan2(y1 - y2, x1 - x2))
}


/**
 *  Calculates the angle in radians from source unit to (x2, y2).
 *
 *  source must be pre-calculated.
*/
export function AngleBetweenPointsRadA(source: unit, x2: number, y2: number): number {
  return 3.14159274 + Math.atan2(GetUnitY(source) - y2, GetUnitX(source) - x2)
}

/**
 *  Calculates the angle in radians from (x1, y1) to target unit.
 *
 *  target must be pre-calculated.
*/
export function AngleBetweenPointsRadB(x1: number, y1: number, target: unit): number {
  return 3.14159274 + Math.atan2(y1 - GetUnitY(target), x1 - GetUnitX(target))
}

/**
 *  Calculates the angle in radians from source unit to target unit.
 *
 *  All parameters must be pre-calculated.
*/
export function AngleBetweenPointsRadC(source: unit, target: unit): number {
  return 3.14159274 + Math.atan2(GetUnitY(source) - GetUnitY(target), GetUnitX(source) - GetUnitX(target))
}

/**
 *  Calculates the angle in radians from (x1, y1) to (x2, y2).
 *
 *  All parameters must be pre-calculated.
*/
export function AngleBetweenPointsRadD(x1: number, y1: number, x2: number, y2: number): number {
  return 3.14159274 + Math.atan2(y1 - y2, x1 - x2)
}
