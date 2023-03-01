//! KEEP 0 DEPENDENCIES FROM OTHER SOURCES

import { TextEncoder } from "./jsNative"; // Polyfill for natives JS environ
import { addScriptHook, W3TS_HOOK } from "w3ts"; // Hook for native war3 initialization req

// Declare used variables
const _mmTb: LuaTable = new LuaTable;
let zeroLoc: location;

export let safeFilter: boolexpr;
export let safeCondition: boolexpr;

// Delay war3 object creation or else the maps is unplayable
addScriptHook(W3TS_HOOK.MAIN_AFTER, ()=>{
	zeroLoc = Location(0,0);
	safeFilter = Filter(function(){return true})
	safeCondition = Condition(function(){return true});
})

// Utility for LuaTable
export function LuaTableContains<T2>(table: LuaTable<number,T2>, data: T2): boolean {
	for (const i of $range(1, table.length())){
		if (table.get(i) == data) return true;
	}
	return false
}

/**
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
	let str = TextEncoder.encode(data),
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
export function Hash_MurMur3(data: string, seed: number): number {
	if (_mmTb.get(data+seed) != null) return _mmTb.get(data+seed);

	let key = TextEncoder.encode(data);
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

export function EXStringHash(str: string): string {
	return string.format("%x", StringHash(str));
}

export function EXGetHeroPrimaryStat(h: unit, includeBonus: boolean = false): number {
	let i = BlzGetHeroPrimaryStat(h);
	switch (i){
		case 1:
			return GetHeroStr(h, includeBonus);
		case 2:
			return GetHeroInt(h, includeBonus);
		case 3:
			return GetHeroAgi(h, includeBonus);
		default:
			return 0;
	}
}

export function EXSetHeroPrimaryStat(h: unit, newValue: number): void {
	BlzSetHeroStatEx(h, BlzGetHeroPrimaryStat(h), newValue);
}

export function EXGetLocationZ(xPos: number, yPos: number): number {
	MoveLocation(zeroLoc, xPos, yPos);
	return GetLocationZ(zeroLoc);
}

export function EXGetUnitZ(u: unit): number {
	return EXGetLocationZ(GetUnitX(u), GetUnitY(u) + GetUnitFlyHeight(u));
}

export function EXSetUnitZ(u: unit, newZPos: number): void {
	SetUnitFlyHeight(u, newZPos - EXGetLocationZ(GetUnitX(u), GetUnitY(u)), 0);
}

export function EXGroupEnumUnitInRect(g: group, r: rect, filter?: boolexpr){
	filter ??= safeFilter;

	GroupEnumUnitsInRect(g, r, filter);
}

export function EXGroupEnumUnitInRange(g: group, x: number, y: number, radius: number, filter?: boolexpr){
	filter ??= safeFilter;

	GroupEnumUnitsInRange(g, x, y, radius, filter);
}

export function EXGroupEnumUnitInRangeOfLoc(g: group, l: location, radius: number, filter?: boolexpr, wantDestroy: boolean = false){
	const x = (l == null ? 0 : GetLocationX(l));
	const y = (l == null ? 0 : GetLocationY(l));
	filter ??= safeFilter;

	GroupEnumUnitsInRange(g, x, y, radius, filter);
	if (wantDestroy) RemoveLocation(l);
}

export function EXGroupEnumUnitOfPlayer(g: group, p: player, filter?: boolexpr){
	filter ??= safeFilter;

	GroupEnumUnitsOfPlayer(g, p, filter);
}

export function EXGroupEnumUnitSelected(g: group, p: player, filter?: boolexpr){
	filter ??= safeFilter;

	GroupEnumUnitsSelected(g, p, filter);
}
