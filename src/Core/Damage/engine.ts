import { W3TS_HOOK, addScriptHook } from "w3ts";
import { LinkedList, ListNode } from "Datastruct";
import {ArrayNew, Logger} from "Utils";

/*
 * Introducing to you a ported version of Bribe Damage Engine on TS that have almost same functionality as the original one
 * But with modified userType from just single into flag array
 *
 * Original version in lua by Bribe
 * Ported to TS by Ozzzzymaniac (aka. TranTrungHo71)
 *
 * Version: 2.0 (Complete rewritten to fix bugs that cause by my useless brain)
 * This rewritten version is based on my Damage Engine that i ported to C#
 */

const DEATH_VAL = 0.405; // Value which unit is determined as death
const LIMBO_DEPTH = 8; // How much can the engine will be able to recursive

// Contain all flags for better readability and easily modify
export const enum DamageType {
	None, // Doesn't do anything
	Physical,
	Magical,
	Pure, // Bypass most damage reduction and defense
	Evasion, // Set damage to 0
	Critical, // Dealt extra damage
	Heal, // Is heal
	Shield, // Negated by shield

	// System flags

	Spell, // Came from abilities that not specify damage type by default
	Periodic, // Came from damage over times
	Item, // Came from items
	AOE, // Is an AOE damage

	// Engine Flags

	RAW, // Bypass all modification
	INTERNAL, // Ignore the engine modification
	PET, // PET!
}
class DamageInstance {
	private _source: unit;
	private _target: unit;
	public sourceType: number;
	public targetType: number;
	public sourcePlayer: player;
	public targetPlayer: player;
	public damage: number;
	public isAttack: boolean;
	public isRanged: boolean;
	public flags: boolean[];
	public attackType: attacktype;
	public damageType: damagetype;
	public weaponType?: weapontype;
	public readonly prevAmt: number;
	public readonly prevAttackType: attacktype;
	public readonly prevDamageType: damagetype;
	public readonly prevWeaponType?: weapontype;
	public recursive?: DamageTrigger;

	public get source(): unit { return this._source };
	public get target(): unit { return this._target };
	public set source(val: unit){
		this._source = val;
		this.sourceType = GetUnitTypeId(val);
		this.sourcePlayer = GetOwningPlayer(val);
	}
	public set target(val: unit){
		this._target = val;
		this.targetType = GetUnitTypeId(val);
		this.targetPlayer = GetOwningPlayer(val);
	}

	constructor(src: unit, tgt: unit, dmg: number, iatk: boolean, irgd: boolean, tatk: attacktype, tdmg: damagetype, twpn?: weapontype) {
		this._source = src;
		this._target = tgt;
		this.sourceType = GetUnitTypeId(src);
		this.targetType = GetUnitTypeId(tgt);
		this.sourcePlayer = GetOwningPlayer(src);
		this.targetPlayer = GetOwningPlayer(tgt);
		this.damage = dmg;
		this.attackType = tatk;
		this.damageType = tdmg;
		this.weaponType = twpn;
		this.isAttack = iatk;
		this.isRanged = irgd;
		this.flags = ArrayNew(DamageType.PET, false);
		this.prevAmt = dmg;
		this.prevAttackType = tatk;
		this.prevDamageType = tdmg;
		this.prevWeaponType = twpn;
	}
}

class DamageTrigger {
	public func: DamageAction;
	public isFrozen: boolean;
	public isInception: boolean;
	public dreamDepth: number;
	public weight: number;
	public minAOE: number;

	constructor(func: DamageAction, priority: number) {
		this.func = func;
		this.weight = priority;
		this.dreamDepth = 0;
		this.isFrozen = false;
		this.isInception = false;
		this.minAOE = 1;
	}
}

type DamageAction = ()=>void;

export const enum DamageEvent {
	DAMAGE, // Upon the damage first run
	ARMOR, // Armor event run
	DAMAGED, // Damage almost applied
	AFTER, // After applied
	SOURCE, // For AOE event
	LETHAL
}

let alarmSet = false,
 	canKick = false,
	totem = false,
	dreaming = false,
	kicking = false,
	eventsRun = false,
	skipEngine = false,
	isCurrent = false,
	isLastInstance = false,
	hasSource = false,
	hasLethal = false;
let sourceAOE = 1,
	sourceStacks = 1,
	sleepDepth = 0;

let t1: trigger,t2: trigger,t3: trigger;
let alarm: timer;
let orgSource: unit | undefined,
	orgTarget: unit | undefined;

const recursiveSource: WeakMap<unit, boolean> = new WeakMap(),
	  recursiveTarget: WeakMap<unit, boolean> = new WeakMap();
let	targets: LuaMap<unit, boolean> = new LuaMap();
let userIndex: DamageTrigger;

let current: DamageInstance,
	lastInstance: DamageInstance,
	recursiveStacks: DamageInstance[] = [];
let prepped: DamageInstance;



const internalSkip = () => current.flags[DamageType.INTERNAL];
const breakCheck = [
	() => current.flags[DamageType.Pure] || skipEngine || current.flags[DamageType.INTERNAL],
	() => current.damage <= 0 || current.flags[DamageType.Pure] || current.flags[DamageType.INTERNAL],
	internalSkip,
	internalSkip,
	internalSkip,
	internalSkip
];

const eventList = [
	new LinkedList<DamageTrigger>(), // damage
	new LinkedList<DamageTrigger>(), // armor
	new LinkedList<DamageTrigger>(), // damaged
	new LinkedList<DamageTrigger>(), // after
	new LinkedList<DamageTrigger>(), // source
	new LinkedList<DamageTrigger>()  // lethal
]
const attackImmune = [
	false, // ATTACK_TYPE_NORMAL
	true, // ATTACK_TYPE_MELEE
	true, // ATTACK_TYPE_PIERCE
	true, // ATTACK_TYPE_SIEGE
	false, // ATTACK_TYPE_MAGIC
	true, // ATTACK_TYPE_CHAOS
	true, // ATTACK_TYPE_HERO
];

const damageImmune = [
	true, // DAMAGE_TYPE_UNKNOWN
	false, // NONE
	false, // NONE
	false, // NONE
	true, // DAMAGE_TYPE_NORMAL
	true, // DAMAGE_TYPE_ENHANCED
	false, // NONE
	false, // NONE
	false, // DAMAGE_TYPE_FIRE
	false, // DAMAGE_TYPE_COLD
	false, // DAMAGE_TYPE_LIGHTNING
	true, // DAMAGE_TYPE_POISON
	true, // DAMAGE_TYPE_DISEASE
	false, // DAMAGE_TYPE_DIVINE
	false, // DAMAGE_TYPE_MAGIC
	false, // DAMAGE_TYPE_SONIC
	true, // DAMAGE_TYPE_ACID
	false, // DAMAGE_TYPE_FORCE
	false, // DAMAGE_TYPE_DEATH
	false, // DAMAGE_TYPE_MIND
	false, // DAMAGE_TYPE_PLANT
	false, // DAMAGE_TYPE_DEFENSIVE
	true, // DAMAGE_TYPE_DEMOLITION
	true, // DAMAGE_TYPE_SLOW_POISON
	false, // DAMAGE_TYPE_SPIRIT_LINK
	false, // DAMAGE_TYPE_SHADOW_STRIKE
	true, // DAMAGE_TYPE_UNIVERSAL
];

function runEvent(v: DamageEvent) {
	let head = eventList[v];
	let check = breakCheck[v];
	if (dreaming || !head || check() || head.first == null) return;

	let node = head.first;
	Damage.enable(false);
	EnableTrigger(t3);
	dreaming = true;

	while (true) {
		if (!userIndex.isFrozen || !hasSource || (v != DamageEvent.SOURCE || sourceAOE > userIndex.minAOE)){
			userIndex.func()
		}
		if (node.next == null || check()) break;

		node = node.next;
		userIndex = node.value;
	};

	dreaming = false;
	Damage.enable(true);
	DisableTrigger(t3);
}

function create(src: unit, tgt: unit, dmg: number, iatk: boolean, irgd: boolean, tatk: attacktype, tdmg: damagetype, twpn?: weapontype){
	let d = new DamageInstance(src, tgt, dmg, iatk, irgd, tatk, tdmg, twpn);

	d.flags[DamageType.Spell] = (tatk == ATTACK_TYPE_NORMAL && !iatk);
	d.flags[DamageType.Physical] = iatk;
	return d;
};

function addRecursive(d: DamageInstance){
	if (d.damage == 0) return;
	d.recursive = userIndex;
	if (!kicking && recursiveSource.get(d.source) && recursiveTarget.get(d.target))
	{
		if (!userIndex.isFrozen) userIndex.isFrozen = true;
		else if (!userIndex.isFrozen && userIndex.dreamDepth < sleepDepth)
		{
			userIndex.dreamDepth++;
			userIndex.isFrozen = userIndex.dreamDepth >= LIMBO_DEPTH;
		}
	}
	recursiveStacks.push(d);
}

function AOEEnd(){
	runEvent(DamageEvent.SOURCE);
	sourceAOE = 1;
	sourceStacks = 1;
	orgSource = undefined;
	orgTarget = undefined;
	targets = new LuaMap();
}

function afterDamage(){
	if (isCurrent){
		runEvent(DamageEvent.AFTER);
		isCurrent = false;
	}
	skipEngine = false;
}

function doPreEvent(d: DamageInstance, isNatural: boolean){
	current = d;
	recursiveSource.set(d.source, true);
	recursiveTarget.set(d.target, true);
	if (d.damage == 0.0) return false;
	skipEngine = d.damageType == DAMAGE_TYPE_UNKNOWN || d.flags[DamageType.INTERNAL];
	runEvent(DamageEvent.DAMAGE);
	if (isNatural)
	{
		BlzSetEventAttackType(d.attackType);
		BlzSetEventDamageType(d.damageType);
		BlzSetEventWeaponType(d.weaponType ?? WEAPON_TYPE_WHOKNOWS);
		BlzSetEventDamage(d.damage);
	}
	return true;
}

export class Damage {
	public static get current() { return current }; // The current execution damage context
	public static nextType: DamageType; // The next value to apply if exist
	private static life: number = 0;

	/**
	 * Register a new listener that will fired on specific event
	 * @param whichEvent
	 * @param priority - Lower number run first
	 * @param callback - A function take no arguments, return nothing
	 * @returns A event node
	 */
	public static register(whichEvent: DamageEvent, priority: number, callback: DamageAction) {
		let head = eventList[whichEvent];

		hasLethal = hasLethal || whichEvent == DamageEvent.LETHAL;
		hasSource = hasSource || whichEvent == DamageEvent.SOURCE;

		const data = new DamageTrigger(callback, priority);

		let node = head.first;
		if (node == null) return head.addFirst(data);

		while (true){
			if (node.value.weight > priority) return node.addBefore(data);
			if (node.next == null) break;

			node = node.next;
		}

		return node.addAfter(data);
	}

	public static remove(node: ListNode<DamageTrigger>) {
		return node.remove() != null;
	}

	// Begin system

	public static enable(flag: boolean) {
		if (flag){
			if (dreaming) EnableTrigger(t3);
			else{
				EnableTrigger(t1);
				EnableTrigger(t2);
			}
			return
		}

		if (dreaming) DisableTrigger(t3);
		else
		{
			DisableTrigger(t1);
			DisableTrigger(t2);
		}
	}

	/**
	 * Call this to enable this executing damage trigger to run recursively
	 */
	public static inception() {
		userIndex.isInception = true;
	}
}

addScriptHook(W3TS_HOOK.MAIN_AFTER, ()=>{
	// Add damage init
});