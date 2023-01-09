import { OzCreateStat, OzOverrideStat } from "Core";
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
	PIERCE,
	EVASION,
	CRIT_RATE,
	CRIT_DMG,
	DMG_BLOCK,
	DMG_RESIST,
	DMG_BONUS,
	SPELL_BLOCK,
	SPELL_RESIST,
	SPELL_BONUS,
	SU_CRATE, // Super Crit
	SU_CDMG,
	HY_CRATE, // Hyper Crit
	HY_CDMG,
	FINAL_DMG,
	FINAL_RES,
	WAIFU_TOUCH, // Aka. one hit
}
// This is the base id, for the HP and increment by 1 for the next ability, up to 9
const base = 1513107505; // 'Z001'

// This is base 2, for any others
//base2 = base + 16; // 'Z00A'

function incAbil(u: Unit, offset: number, field: abilityintegerlevelfield, amt: number) {
	if (u.getAbilityLevel(base + offset) == 0) {
		u.addAbility(base + offset);
		u.makeAbilityPermanent(true, base + offset);
	}
	if (BlzSetAbilityIntegerLevelField(u.getAbility(base + offset), field, 0, amt)) {
		u.incAbilityLevel(base + offset);
		u.decAbilityLevel(base + offset);
	}
}

function incRealAbil(u: Unit, offset: number, field: abilityreallevelfield, amt: number) {
	if (u.getAbilityLevel(base + offset) == 0) {
		u.addAbility(base + offset);
		u.makeAbilityPermanent(true, base + offset);
	}
	if (BlzSetAbilityRealLevelField(u.getAbility(base + offset), field, 0, amt)) {
		u.incAbilityLevel(base + offset);
		u.decAbilityLevel(base + offset);
	}
}

function onInit() {
	OzCreateStat("STRENGTH", false, (u, _, newAmt, mode) => {
		if (mode == 1) u.setStrength(newAmt, true);
		else incAbil(u, 0, ABILITY_ILF_STRENGTH_BONUS_ISTR, newAmt);
	});

	OzCreateStat("AGILITY", false, (u, _, newAmt, mode) => {
		if (mode == 1) u.setAgility(newAmt, true);
		else incAbil(u, 1, ABILITY_ILF_AGILITY_BONUS, newAmt);
	});

	OzCreateStat("INTELLIGENCE", false, (u, _, newAmt, mode) => {
		if (mode == 1) u.setIntelligence(newAmt, true);
		else incAbil(u, 2, ABILITY_ILF_INTELLIGENCE_BONUS, newAmt);
	});

	OzCreateStat("HEALTH", false, (u, oldAmt, newAmt, mode) => {
		// let the percentage live here till final decision.
		// let percent = GetUnitLifePercent(u.handle);
		if (mode == 2) incAbil(u, 3, ABILITY_ILF_MAX_LIFE_GAINED, newAmt);
		u.maxLife = u.maxLife - oldAmt + newAmt;
		// SetUnitLifePercentBJ(u.handle, percent);
	});

	OzCreateStat("MANA", false, (u, oldAmt, newAmt, mode) => {
		// let the percentage live here till final decision.
		// let percent = GetUnitManaPercent(u.handle);
		if (mode == 2) incAbil(u, 4, ABILITY_ILF_MAX_MANA_GAINED, newAmt);
		u.maxMana = u.maxMana - oldAmt + newAmt;
		// SetUnitManaPercentBJ(u.handle, percent);
	});

	OzCreateStat("DAMAGE", false, (u, oldAmt, newAmt, mode) => {
		if (mode == 1) u.setBaseDamage(u.getBaseDamage(0) - oldAmt + newAmt, 0);
		else incAbil(u, 5, ABILITY_ILF_ATTACK_BONUS, newAmt);
	});

	OzCreateStat("ARMOR", false, (u, oldAmt, newAmt, mode) => {
		if (mode == 1) u.armor = u.armor - oldAmt + newAmt;
		else incAbil(u, 6, ABILITY_ILF_DEFENSE_BONUS_IDEF, newAmt);
	});

	OzCreateStat("MOVESPEED", false, (u, _, newAmt, mode) => {
		if (mode == 1) u.moveSpeed = newAmt;
		else incAbil(u, 7, ABILITY_ILF_MOVEMENT_SPEED_BONUS, newAmt);
	});

	OzCreateStat("ATTACKSPEED", false, (u, _, newAmt, mode) => {
		incRealAbil(u, 7 + mode, ABILITY_RLF_ATTACK_SPEED_INCREASE_ISX1, newAmt);
	});

	OzCreateStat("HP_REGEN", false, (u, _, newAmt, mode) => {
		incRealAbil(u, 15 + mode, ABILITY_RLF_AMOUNT_OF_HIT_POINTS_REGENERATED, newAmt);
	});

	OzCreateStat("MP_REGEN", false, (u, _, newAmt, mode) => {
		incRealAbil(u, 17 + mode, ABILITY_RLF_AMOUNT_REGENERATED, newAmt);
	});
}

addScriptHook(W3TS_HOOK.MAIN_BEFORE, onInit);
