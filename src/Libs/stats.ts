import { Damage, OzDamageEvent, OzCreateStat, FLAG_USER } from "Core/index";
import { Unit, W3TS_HOOK, addScriptHook } from "w3ts";

// Requirement, create 9 ability for these stat!

export const enum STAT {
	STR = 0,
	AGI = 1,
	INT = 2,
	HP = 3,
	MP = 4,
	ATK = 5,
	DEF = 6,
	MS = 7,
	AS = 8,
	HP_REGEN = 9,
	MP_REGEN = 10,

	// Below are special that only available if damage engine is installed
	LIFESTEAL,
	DMG_VAMP,
	PIERCE,
	EVASION,
	ACCURACY,
	CRIT_RATE,
	CRIT_DMG,
	// DMG_BLOCK,
	// DMG_RESIST,
	// DMG_BONUS,
	// SPELL_BLOCK,
	// SPELL_RESIST,
	// SPELL_BONUS,
	// SU_CRATE, // Super Crit
	// SU_CDMG,
	// HY_CRATE, // Hyper Crit
	// HY_CDMG,
	// FINAL_DMG,
	// FINAL_RES,
	// WAIFU_TOUCH, // Aka. one hit
}
// This is the base id, for the HP and increment by 1 for the next ability, up to 9
const base = 1513107505; // 'Z001'

// This is base 2, for any others
//base2 = base + 16; // 'Z00A'

function incAbil(u: Unit, offset: number, field: abilityintegerlevelfield, amt: number, removeAbil: boolean = false) {
	if (u.getAbilityLevel(base + offset) == 0) {
		u.addAbility(base + offset);
		u.makeAbilityPermanent(true, base + offset);
	}
	if (amt == 0 && removeAbil) {
		u.removeAbility(base + offset); // simply remove the ability
		return;
	}
	if (BlzSetAbilityIntegerLevelField(u.getAbility(base + offset), field, 0, amt)) {
		u.incAbilityLevel(base + offset);
		u.decAbilityLevel(base + offset);
	}
}

function incRealAbil(u: Unit, offset: number, field: abilityreallevelfield, amt: number, removeAbil: boolean = false) {
	if (u.getAbilityLevel(base + offset) == 0) {
		u.addAbility(base + offset);
		u.makeAbilityPermanent(true, base + offset);
	}
	if (amt == 0 && removeAbil) {
		u.removeAbility(base + offset);
		return;
	}
	if (BlzSetAbilityRealLevelField(u.getAbility(base + offset), field, 0, amt)) {
		u.incAbilityLevel(base + offset);
		u.decAbilityLevel(base + offset);
	}
}

// For Damage functionality of stats
const lsRatio: WeakMap<Unit, number> = new WeakMap<Unit, number>();
function lifestealDamage() {
	let d = Damage.current;
	if (!lsRatio.has(d.source) || !d.isAttack) return;
	let ratio = lsRatio.get(d.source);
	if (ratio == 0) return lsRatio.delete(d.source);
	let heal = d.damage * (ratio / 100);
	d.source.life = d.source.life + heal;
}

const dvRatio: WeakMap<Unit, number> = new WeakMap<Unit, number>();
function vampDamage() {
	let d = Damage.current;
	if (!dvRatio.has(d.source)) return;
	let ratio = dvRatio.get(d.source);
	let heal = d.damage * (ratio / 100);
	d.source.life = d.source.life + heal;
}

const peAmt: WeakMap<Unit, number> = new WeakMap<Unit, number>();
function pierceDamage() {
	let d = Damage.current;
	if (!peAmt.has(d.source)) return;
	let total = peAmt.get(d.source);
	d.pierceArmor = total;
}

const evaAmt: WeakMap<Unit, number> = new WeakMap<Unit, number>();
const accAmt: WeakMap<Unit, number> = new WeakMap<Unit, number>();
function evasionDamage() {
	let d = Damage.current;
	if (!evaAmt.has(d.target)) return;
	let totalEva = accAmt.get(d.source) - evaAmt.get(d.target);
	if (totalEva < 0) {
		totalEva = Math.abs(totalEva);
		let ratio = Math.min(totalEva / (500000 + totalEva), 0.5);
		if (GetRandomReal(0.0, 100.0) <= ratio) {
			d.damage = 0;
			d.userType[FLAG_USER.EVASION] = true; // is evaded
		}
	}
}

const crtCRate: WeakMap<Unit, number> = new WeakMap<Unit, number>();
const crtDRate: WeakMap<Unit, number> = new WeakMap<Unit, number>();
function criticalDamage() {
	let d = Damage.current;
	if (!crtCRate.has(d.source)) return;
	let crv = crtCRate.get(d.source) / 100;
	if (GetRandomReal(0.0, 100.0) <= crv) {
		let crd = crtDRate.get(d.source) / 100 + 2.0;
		d.damage *= Math.min(Math.max(crd, 1.0), 11.0);
		d.userType[FLAG_USER.CRITICAL] = true; // is crit
	}
}

function onInit() {
	//define base stats

	OzCreateStat("STRENGTH", false, (u: Unit, _: number, newAmt: number, mode: 1 | 2) => {
		if (mode == 1) u.setStrength(newAmt, true);
		else incAbil(u, 0, ABILITY_ILF_STRENGTH_BONUS_ISTR, newAmt);
	});

	OzCreateStat("AGILITY", false, (u: Unit, oldAmt: number, newAmt: number, mode: 1 | 2) => {
		if (mode == 1) u.setAgility(newAmt, true);
		else incAbil(u, 1, ABILITY_ILF_AGILITY_BONUS, newAmt);

		evaAmt.set(u, evaAmt.get(u) - oldAmt + newAmt);
		accAmt.set(u, accAmt.get(u) - (oldAmt - newAmt) * 2);
		if (evaAmt.get(u) == 0) evaAmt.delete(u);
		if (accAmt.get(u) == 0) accAmt.delete(u);
	});

	OzCreateStat("INTELLIGENCE", false, (u: Unit, _: number, newAmt: number, mode: 1 | 2) => {
		if (mode == 1) u.setIntelligence(newAmt, true);
		else incAbil(u, 2, ABILITY_ILF_INTELLIGENCE_BONUS, newAmt);
	});

	OzCreateStat("HEALTH", false, (u: Unit, oldAmt: number, newAmt: number, mode: 1 | 2) => {
		// let the percentage live here till final decision.
		// let percent = GetUnitLifePercent(u.handle);
		if (mode == 2) incAbil(u, 3, ABILITY_ILF_MAX_LIFE_GAINED, newAmt);
		u.maxLife = u.maxLife - oldAmt + newAmt;
		// SetUnitLifePercentBJ(u.handle, percent);
	});

	OzCreateStat("MANA", false, (u: Unit, oldAmt: number, newAmt: number, mode: 1 | 2) => {
		// let the percentage live here till final decision.
		// let percent = GetUnitManaPercent(u.handle);
		if (mode == 2) incAbil(u, 4, ABILITY_ILF_MAX_MANA_GAINED, newAmt);
		u.maxMana = u.maxMana - oldAmt + newAmt;
		// SetUnitManaPercentBJ(u.handle, percent);
	});

	OzCreateStat("DAMAGE", false, (u: Unit, oldAmt: number, newAmt: number, mode: 1 | 2) => {
		if (mode == 1) u.setBaseDamage(u.getBaseDamage(0) - oldAmt + newAmt, 0);
		else incAbil(u, 5, ABILITY_ILF_ATTACK_BONUS, newAmt);
	});

	OzCreateStat("ARMOR", false, (u: Unit, oldAmt: number, newAmt: number, mode: 1 | 2) => {
		if (mode == 1) u.armor = u.armor - oldAmt + newAmt;
		else incAbil(u, 6, ABILITY_ILF_DEFENSE_BONUS_IDEF, newAmt);
	});

	OzCreateStat("MOVESPEED", false, (u: Unit, _: number, newAmt: number, mode: 1 | 2) => {
		if (mode == 1) u.moveSpeed = newAmt;
		else incAbil(u, 7, ABILITY_ILF_MOVEMENT_SPEED_BONUS, newAmt);
	});

	OzCreateStat("ATTACKSPEED", false, (u: Unit, _: number, newAmt: number, mode: 1 | 2) => {
		incRealAbil(u, 7 + mode, ABILITY_RLF_ATTACK_SPEED_INCREASE_ISX1, newAmt);
	});

	OzCreateStat("HP_REGEN", false, (u: Unit, _: number, newAmt: number, mode: 1 | 2) => {
		incRealAbil(u, 15 + mode, ABILITY_RLF_AMOUNT_OF_HIT_POINTS_REGENERATED, newAmt);
	});

	OzCreateStat("MP_REGEN", false, (u: Unit, _: number, newAmt: number, mode: 1 | 2) => {
		incRealAbil(u, 17 + mode, ABILITY_RLF_AMOUNT_REGENERATED, newAmt);
	});

	// Define new stats

	// Percentage value that the source will heal based on it damage from basic auto-attack
	Damage.register(OzDamageEvent.EVENT_ON_ARMOR, 999999, lifestealDamage, null);
	OzCreateStat("LIFESTEAL", true, (u: Unit, oldAmt: number, newAmt: number, _: 1 | 2) => {
		lsRatio.set(u, lsRatio.get(u) - oldAmt + newAmt);
		if (lsRatio.get(u) == 0) lsRatio.delete(u);
	});

	// Like above but for all of damage coming from source
	Damage.register(OzDamageEvent.EVENT_AFTER_DAMAGE, 999999, vampDamage, null);
	OzCreateStat("DAMAGE_VAMP", true, (u: Unit, oldAmt: number, newAmt: number, _: 1 | 2) => {
		dvRatio.set(u, dvRatio.get(u) - oldAmt + newAmt);
		if (dvRatio.get(u) == 0) dvRatio.delete(u);
	});

	// Amount of armor the source will ignore when damage it target
	Damage.register(OzDamageEvent.EVENT_ON_ARMOR, -999999, pierceDamage, null);
	OzCreateStat("ARMOR_PIERCE", false, (u: Unit, oldAmt: number, newAmt: number, _: 1 | 2) => {
		peAmt.set(u, peAmt.get(u) - oldAmt + newAmt);
		if (peAmt.get(u) == 0) peAmt.delete(u);
	});

	// Both evasion and accuracy use the same event
	Damage.register(OzDamageEvent.EVENT_ON_DAMAGED, 999999, evasionDamage, null);
	OzCreateStat("EVASION", false, (u: Unit, oldAmt: number, newAmt: number, _: 1 | 2) => {
		evaAmt.set(u, evaAmt.get(u) - oldAmt + newAmt);
		if (evaAmt.get(u) == 0) evaAmt.delete(u);
	});

	OzCreateStat("ACCURACY", false, (u: Unit, oldAmt: number, newAmt: number, _: 1 | 2) => {
		accAmt.set(u, accAmt.get(u) - oldAmt + newAmt);
		if (accAmt.get(u) == 0) accAmt.delete(u);
	});

	// Both crit rate and damage use the same event
	Damage.register(OzDamageEvent.EVENT_ON_DAMAGED, 999998, criticalDamage, null);
	OzCreateStat("CRIT_RATE", false, (u: Unit, oldAmt: number, newAmt: number, _: 1 | 2) => {
		crtCRate.set(u, crtCRate.get(u) - oldAmt + newAmt);
		if (crtCRate.get(u) == 0) crtCRate.delete(u);
	});

	OzCreateStat("CRIT_DAMAGE", false, (u: Unit, oldAmt: number, newAmt: number, _: 1 | 2) => {
		crtDRate.set(u, crtDRate.get(u) - oldAmt + newAmt);
		if (crtDRate.get(u) == 0) crtDRate.delete(u);
	});
}

addScriptHook(W3TS_HOOK.MAIN_BEFORE, onInit);
