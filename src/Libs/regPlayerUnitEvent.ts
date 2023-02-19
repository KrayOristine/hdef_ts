import { Ability } from "Datastruct";
import { LocGetZ, UnitGetZ } from "Utils";
import { Trigger, MapPlayer, Unit, addScriptHook, W3TS_HOOK } from "w3ts";

//cspell: ignore gtrg,gfun
const gtrg: Trigger[] = [];
const gfun: Function[][] = [];

function addRegister(id: number, e: playerunitevent, code: Function) {
	if (!gtrg[id]) {
		gtrg[id] = new Trigger();
		for (let i = 0; i < bj_MAX_PLAYERS; i++) {
			gtrg[id].registerPlayerUnitEvent(MapPlayer.fromIndex(i), e, null);
		}
		gtrg[id].addCondition(() => {
			gfun[id].forEach((itm) => {
				itm();
			});
			return true;
		});
	}
	if (!gfun[id]) gfun[id] = [];
	gfun[id].push(code);
}

export function registerPlayerUnitEvent(e: playerunitevent, code: Function) {
	addRegister(GetHandleId(e), e, code);
}

export function registerPlayerUnitEventFor(p: MapPlayer, e: playerunitevent, code: Function) {
	addRegister((bj_MAX_PLAYERS + 1) * GetHandleId(e) + p.id, e, code);
}

export function getPlayerUnitEventTrigger(e: playerunitevent) {
	return gtrg[GetHandleId(e)];
}

export function getPlayerUnitEventTriggerFor(p: MapPlayer, e: playerunitevent) {
	return gtrg[(bj_MAX_PLAYERS + 1) * GetHandleId(e) + p.id];
}

const sfu: Function[][] = [];
class Spell {
	public readonly ability: Ability;
	public readonly source: Unit;
	public readonly sourceIsHero: boolean;
	public readonly sourceIsStructure: boolean;
	public readonly target: Unit;
	public readonly targetIsHero: boolean;
	public readonly targetIsStructure: boolean;
	public readonly x: number;
	public readonly y: number;
	public readonly z: number;
	public readonly level: number;
	constructor() {
		this.ability = new Ability(GetSpellAbility());
		this.source = Unit.fromHandle(GetTriggerUnit());
		this.target = Unit.fromHandle(GetSpellTargetUnit());
		this.sourceIsHero = this.source.isUnitType(UNIT_TYPE_HERO);
		this.sourceIsStructure = this.source.isUnitType(UNIT_TYPE_STRUCTURE);
		this.targetIsHero = this.target.isUnitType(UNIT_TYPE_HERO);
		this.targetIsStructure = this.target.isUnitType(UNIT_TYPE_STRUCTURE);
		this.x = GetSpellTargetX();
		this.y = GetSpellTargetY();
		this.z = this.target ? UnitGetZ(this.target) : LocGetZ(this.x, this.y);
	}
}

export let OzSpell: Spell;

function _handleSpellEffect() {
	OzSpell = new Spell();
	sfu[OzSpell.ability.id].forEach((f) => f());
	sfu[-1].forEach((f) => f());
}

addScriptHook(W3TS_HOOK.MAIN_AFTER, () => {
	registerPlayerUnitEvent(EVENT_PLAYER_UNIT_SPELL_EFFECT, _handleSpellEffect);
});

export function registerSpellEffectEvent(abilId: number, callback: Function) {
	if (abilId == 0) {
		if (!sfu[-1]) sfu[-1] = [];
		sfu[-1].push(callback);
		return;
	}
	if (!sfu[abilId]) sfu[abilId] = [];
	sfu[abilId].push(callback);
}
