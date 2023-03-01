/*
 *  OzStat Library - Version 1.1
 *
 *  Simple abstract library for custom stats
 *
 *  Featuring:
 * 		+ Ability to create custom class with custom update function that run upon stat is modified
 * 		+ Ability to hook to already created stat or replace the original update function
 */

import { OzLib } from "Utils";
import { Unit } from "w3ts";

// CONFIGURE THESE INSTANCE TO MAKE BASE STAT CALCULATION MORE ACCURATE
const DMG_PER_MAIN = 1.0;
const ARMOR_PER_AGI = 0.3;
const HP_PER_STR = 25.0;
const MP_PER_INT = 15;

// DO NOT TOUCH ANYTHING BELOW

interface StatInstance {
	isFloat: boolean; // Is stat float? (percentage) does not do any thing, just here for anyone to references
	data: WeakMap<Unit, number>[]; // A array holding all stats value
	name: string; // Stat names
	onUpdate: StatUpdateFunc;
}

type StatUpdateFunc = (target: Unit, oldAmt: number, newAmt: number, mode: 1 | 2) => void;

const db: StatInstance[] = [];
const hookFunc: StatUpdateFunc[][] = [];

/**
 * 	Create a new stats
 * @param name for readability
 * @param isFloat mark that this is a percentage value
 * @param onUpdate a function which will be called every time the stats changes
 * @returns
 */
export function OzCreateStat(name: string, isFloat: boolean, onUpdate: StatUpdateFunc) {
	return (
		db.push({
			isFloat: isFloat,
			data: [new WeakMap<Unit, number>(), new WeakMap<Unit, number>()],
			name: name,
			onUpdate: onUpdate,
		}) - 1
	);
}

/**
 * 	A wrapper function to hook previous created stats, but beware as there is no priority
 * @param index stats integer id
 * @param newUpdate the new update function to be called
 * @param isHook is it hook? (will be called before original and not replace it)
 * @returns
 */
export function OzOverrideStat(index: number, newUpdate: StatUpdateFunc, isHook: boolean = true) {
	if (!isHook) {
		db[index].onUpdate = newUpdate;
		return;
	}

	if (!hookFunc[index]) {
		hookFunc[index] = [newUpdate];
		let old = db[index].onUpdate;
		let hook = hookFunc[index];
		db[index].onUpdate = (n, f, u, m) => {
			hook.forEach((v) => v(n, f, u, m));
			old(n, f, u, m);
		};
	}
	hookFunc[index].push(newUpdate);
}

/**
 * 	Initialize a unit stats, This will not work if the base "extension" library isn't exist
 * @param u an Unit object
 */
export function OzInitStat(u: Unit) {
	//Pre-calculate every aspect needed
	let baseStr = u.getStrength(false);
	let Str = u.getStrength(true);
	let baseAgi = u.getAgility(false);
	let Agi = u.getAgility(true);
	let baseInt = u.getIntelligence(false);
	let Int = u.getIntelligence(true);
	let maxHp = u.maxLife;
	let maxMp = u.maxMana;
	let baseDmg = u.getBaseDamage(0);
	let maxArmor = u.armor;
	let bonusHp = (Str - baseStr) * HP_PER_STR;
	let bonusMp = (Int - baseInt) * MP_PER_INT;
	let bonusDmg = (OzLib.getHeroPrimary(u.handle, true) - OzLib.getHeroPrimary(u.handle, false)) * DMG_PER_MAIN;
	let bonusArmor = (Agi - baseAgi) * ARMOR_PER_AGI;

	OzSetStat(u, 0, baseStr, 1, true);
	OzSetStat(u, 0, Str - baseStr, 2, true);
	OzSetStat(u, 1, baseAgi, 1, true);
	OzSetStat(u, 1, Agi - baseAgi, 2, true);
	OzSetStat(u, 2, baseInt, 1, true);
	OzSetStat(u, 2, Int - baseInt, 2, true);
	OzSetStat(u, 3, maxHp - bonusHp, 1, true);
	OzSetStat(u, 3, bonusHp, 2, true);
	OzSetStat(u, 4, maxMp - bonusMp, 1, true);
	OzSetStat(u, 4, bonusMp, 2, true);
	OzSetStat(u, 5, baseDmg, 1, true);
	OzSetStat(u, 5, bonusDmg, 2, true);
	OzSetStat(u, 6, maxArmor - bonusArmor, 1, true);
	OzSetStat(u, 6, bonusArmor, 2, true);
	OzSetStat(u, 7, u.defaultMoveSpeed, 1, true);
}

/**
 *	Set a unit stats to specific value
 * @param u a Unit object
 * @param whichStat a stat integer id
 * @param amount amount to set
 * @param mode 1 is base | 2 is bonus
 * @param ignoreUpdate true to skip the calling of update function
 * @returns true if the action is successful otherwise false
 */
export function OzSetStat(u: Unit, whichStat: number, amount: number, mode: 1 | 2, ignoreUpdate: boolean = true) {
	if (!db[whichStat]) return false; // No stat found
	let si = db[whichStat];
	let old = si.data[mode].get(u);
	si.data[mode].set(u, amount);

	if (ignoreUpdate) return true;
	if (!si.onUpdate) return false;
	si.onUpdate(u, old, amount, mode);
	return true;
}

/**
 *	Add an amount to unit stat
 * @param u a Unit object
 * @param whichStat a stat integer id
 * @param amount amount to add
 * @param mode 1 is base | 2 is bonus
 * @param ignoreUpdate true to skip the calling of update function
 * @returns true if the action is successful otherwise false
 */
export function OzAddStat(u: Unit, whichStat: number, amount: number, mode: 1 | 2, ignoreUpdate: boolean = true) {
	if (!db[whichStat]) return false; // No stat found
	let si = db[whichStat];
	let old = si.data[mode].get(u);
	let newAmt = old + amount;
	si.data[mode].set(u, newAmt);

	if (ignoreUpdate) return true;
	if (!si.onUpdate) return false;
	si.onUpdate(u, old, newAmt, mode);
	return true;
}

/**
 *	Get a unit stats
 * @param u an Unit object
 * @param whichStat a stat integer id
 * @param mode 1 is base | 2 is bonus | 3 is both (total)
 * @returns
 */
export function OzGetStat(u: Unit, whichStat: number, mode: 1 | 2 | 3): number {
	if (!db[whichStat]) return -1;
	let si = db[whichStat];
	if (mode == 3) {
		return (si.data[1].get(u) || 0) + (si.data[2].get(u) || 0);
	}

	return si.data[mode].get(u) || 0;
}
