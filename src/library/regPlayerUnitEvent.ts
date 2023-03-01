import { EXGetLocationZ, EXGetUnitZ } from "Utils";

//cspell: ignore trig,gfun
const trig: trigger[] = [];
const func: Func<void>[][] = [];

function getCondition(id: number){
	return Condition(function(){
		func[id].forEach(itm => itm())
		return true;
	})
}

function addRegister(id: number, e: playerunitevent, code: Func<void>) {
	if (!trig[id]){
		const t = CreateTrigger();
		for (const i of $range(0,bj_MAX_PLAYERS))
			TriggerRegisterPlayerUnitEvent(t, Player(i) as player, e);

		TriggerAddCondition(t, getCondition(id));
		trig[id] = t;
		func[id] = [];
	}
	func[id].push(code);
}

export function registerPlayerUnitEvent(e: playerunitevent, code: Func<void>) {
	addRegister(GetHandleId(e), e, code);
}

export function registerPlayerUnitEventFor(p: player, e: playerunitevent, code: Func<void>) {
	addRegister((bj_MAX_PLAYERS + 1) * GetHandleId(e) + GetPlayerId(p), e, code);
}

export function getPlayerUnitEventTrigger(e: playerunitevent) {
	return trig[GetHandleId(e)];
}

export function getPlayerUnitEventTriggerFor(p: player, e: playerunitevent) {
	return trig[(bj_MAX_PLAYERS + 1) * GetHandleId(e) + GetPlayerId(p)];
}

interface Spell {
	readonly ability: ability;
	readonly id: number;
	readonly source: widget | undefined;
	readonly sourceIsHero: boolean;
	readonly sourceIsStructure: boolean;
	readonly target: widget | undefined;
	readonly targetIsHero: boolean;
	readonly targetIsStructure: boolean;
	readonly x: number;
	readonly y: number;
	readonly z: number;
	readonly level: number;
}

let OzSpell: Spell;

export function GetSpellInstance(): Spell | undefined { return OzSpell }

const sFunc: Func<void>[][] = [];
let sTrig: trigger;

function _handleSpellEffect() {
	const abil = GetSpellAbility() as ability
	const abilId = GetSpellAbilityId();
	const src = GetSpellAbilityUnit();
	const target = GetSpellTargetUnit();
	const x = GetSpellTargetX(),
				y = GetSpellTargetY(),
				z = (target !=  null ? EXGetUnitZ(target) : EXGetLocationZ(x,y))
	let srcHero, targetHero, srcStruct, targetStruct;
	if (src != null){
		srcHero = IsUnitType(src, UNIT_TYPE_HERO);
		srcStruct = IsUnitType(src, UNIT_TYPE_STRUCTURE);
	}

	if (target != null){
		targetHero = IsUnitType(target, UNIT_TYPE_HERO);
		targetStruct = IsUnitType(target, UNIT_TYPE_STRUCTURE);
	}

	OzSpell = {
		source: src,
		target: target,
		ability: abil,
		id: abilId,
		level: (src != null ? GetUnitAbilityLevel(src, abilId) : 1),
		x: x,
		y: y,
		z: z,
		sourceIsHero: srcHero || false,
		sourceIsStructure: srcStruct || false,
		targetIsHero: targetHero || false,
		targetIsStructure: targetStruct || false
	}

	sFunc[0].forEach((f) => f());
	sFunc[OzSpell.id].forEach((f) => f());
}

export function registerSpellEffectEvent(abilId: number, callback: Func<void>) {
	if (!sTrig){
		const t = CreateTrigger();
		for (const i of $range(0,bj_MAX_PLAYERS))
			TriggerRegisterPlayerUnitEvent(t, Player(i) as player, EVENT_PLAYER_UNIT_SPELL_EFFECT);

		TriggerAddCondition(t, Condition(_handleSpellEffect));
		sTrig = t;
	}
	if (abilId < 0) abilId = 0;
	if (!sFunc[abilId]) sFunc[abilId] = [];
	sFunc[abilId].push(callback);
}
