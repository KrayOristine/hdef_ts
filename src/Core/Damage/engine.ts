//import { LinkedList } from "Datastruct";
import { Group, MapPlayer, Timer, Trigger, Unit, W3TS_HOOK, addScriptHook } from "w3ts";
import { LinkedList, Logger } from "wc3-treelib";

/*
 * Introducing to you a ported version of Bribe Damage Engine on TS that have almost same functionality as the original one
 * But with unlimited userType definition support! as well as slightly improved performance
 *
 * Original version in lua by Bribe
 * Ported to TS by Ozzzzymaniac (aka. TranTrungHo71)
 */

const DEATH_VAL = 0.405; // Value which unit is determined as death
const LIMBO_DEPTH = 8; // How much can the engine will be able to recursive
export interface DamageInstance {
	engineType: boolean[];
	gameType: boolean[];
	userType: boolean[];
	damage: number;
	userAmt?: number;
	source: Unit;
	target: Unit;
	owner: MapPlayer;
	isAttack: boolean;
	isRanged: boolean;
	isMelee: boolean;
	isSpell: boolean;
	attackType: attacktype;
	damageType: damagetype;
	weaponType: weapontype;
	readonly prevAmt: number;
	pierceArmor: number;
	readonly prevAttackType: attacktype;
	readonly prevDamageType: damagetype;
	recursive: OzDamageTrigger;
}

export interface DamageFilter {
	sourceId: number;
	targetId: number;
	sourceItemId: number;
	targetItemId: number;
	sourceBuff: number;
	targetBuff: number;
	minDamage: number;
}

export interface OzDamageTrigger {
	func: Function;
	trig?: Trigger;
	isFrozen: boolean;
	sleepDepth: number;
	isInception: boolean;
	hasFilters: boolean;
	filter: DamageFilter;
	minAOE: number;
	weight: number;
	readonly regAt: string;
}

//Internal type, only references and auto complete
type EventList = {
	hit: LinkedList<OzDamageTrigger>;
	damage: LinkedList<OzDamageTrigger>;
	armor: LinkedList<OzDamageTrigger>;
	damaged: LinkedList<OzDamageTrigger>;
	after: LinkedList<OzDamageTrigger>;
	lethal: LinkedList<OzDamageTrigger>;
	source: LinkedList<OzDamageTrigger>;
};

export const enum OzDamageEvent {
	EVENT_ON_HIT = "hit",
	EVENT_ON_DAMAGE = "damage",
	EVENT_ON_ARMOR = "armor",
	EVENT_ON_DAMAGED = "damaged",
	EVENT_AFTER_DAMAGE = "after",
	EVENT_LETHAL = "lethal",
	EVENT_SOURCE = "source",
}

export const enum OzDamageEngineType {
	raw = 1,
	internal = 2,
	default = 3,
	proc = 4,
	reactive = 5,
	basic = 6,
	spell = 7,
	area = 8,
	persistance = 9,
	pet = 10,
}

export const enum OzDamageScriptType {
	none = 0,
	attack = 1,
	activeSpell = 2,
	AOE = 3,
	periodic = 4,
	item = 5,
}

export const enum OzDamageGameType {
	undefined = 0,
	physical = 1,
	magic = 2,
	pure = 3,
}
export const enum OzDamageUserType {
	none = 0,
	heal = 1,
	crit = 2,
	shield = 3,
	miss = 4,
}

const damagedOrAfter = () => Damage.current.damageType == DAMAGE_TYPE_UNKNOWN;
addScriptHook(W3TS_HOOK.MAIN_AFTER, () => Damage.onInit());
export class Damage {
	private static readonly eventList: EventList = {
		hit: new LinkedList<OzDamageTrigger>(),
		damage: new LinkedList<OzDamageTrigger>(),
		armor: new LinkedList<OzDamageTrigger>(),
		damaged: new LinkedList<OzDamageTrigger>(),
		after: new LinkedList<OzDamageTrigger>(),
		lethal: new LinkedList<OzDamageTrigger>(),
		source: new LinkedList<OzDamageTrigger>(),
	};

	private static initialized: boolean = false;
	public static onInit() {
		if (this.initialized) return;
		this.initialized = true;
		this.alarm = new Timer();
		this.t1 = new Trigger();
		this.t2 = new Trigger();
		this.t3 = new Trigger();
		this.targets = new Group();

		this.t1.registerAnyUnitEvent(EVENT_PLAYER_UNIT_DAMAGING);
		this.t1.addCondition(() => {
			let d = this.createFromEvent();
			if (this.alarmSet) {
				if (this.totem) {
					if (d.damageType == DAMAGE_TYPE_SPIRIT_LINK || d.damageType == DAMAGE_TYPE_DEFENSIVE || d.damageType == DAMAGE_TYPE_PLANT) {
						this.lastInstance = this.current;
						this.totem = false;
						this.canKick = false;
					} else this.failSafeClear();
				} else this.finish();

				if (d.source.handle != this.orgSource) {
					this.onAOEEnd();
					this.orgSource = d.source.handle;
					this.orgTarget = d.target.handle;
				} else if (d.target.handle == this.orgTarget) this.sourceStacks++;
				else if (!this.targets.hasUnit(d.target)) this.sourceAOE++;
			} else {
				this.alarmSet = true;
				this.alarm.start(0, false, () => {
					this.alarmSet = false;
					this.dreaming = false;
					this.enable(true);
					if (this.totem) this.failSafeClear();
					else {
						this.canKick = true;
						this.kicking = false;
						this.finish();
					}
					this.onAOEEnd();
					this.current = null;
				});
				this.orgSource = d.source.handle;
				this.orgTarget = d.target.handle;
			}
			this.targets.addUnit(d.target);
			if (this.doPreEvents(d, true)) {
				this.canKick = true;
				this.finish();
			}
			this.totem =
				!this.lastInstance ||
				this.attackImmune[GetHandleId(d.attackType)] ||
				this.damageImmune[GetHandleId(d.damageType)] ||
				!d.target.isUnitType(UNIT_TYPE_MAGIC_IMMUNE);

			return true; // Decor only, has nothing to do
		});

		this.t2.registerAnyUnitEvent(EVENT_PLAYER_UNIT_DAMAGED);
		this.t2.addCondition(() => {
			let r = GetEventDamage();
			let d = this.current;
			if (this.prepped) this.prepped = null;
			else if (this.dreaming || d.prevAmt == 0) return;
			else if (this.totem) this.totem = false;
			else {
				this.afterDamage();
				d = this.lastInstance;
				this.current = d;
				this.lastInstance = null;
				this.canKick = true;
			}
			this.setArmor(true);
			d.userAmt = d.damage;
			d.damage = r;

			if (r > 0.0) {
				this.runEvent("armor");
				if (this.hasLethal) {
					this.life = GetWidgetLife(d.target.handle) - d.damage;
					if (this.life < DEATH_VAL) {
						this.runEvent("lethal");
						d.damage = GetWidgetLife(d.target.handle) - this.life;
					}
				}
			}

			if (d.damageType != DAMAGE_TYPE_UNKNOWN) this.runEvent("damaged");
			BlzSetEventDamage(d.damage);
			this.eventsRun = true;
			if (d.damage == 0) this.finish();

			return true; // Decor only, has nothing to do
		});

		this.t3.registerAnyUnitEvent(EVENT_PLAYER_UNIT_DAMAGING);
		this.t3.addCondition(() => {
			this.addRecursive(this.createFromEvent());
			BlzSetEventDamage(0.0);

			return true;
		});
		this.t3.enabled = false;
	}
	private static alarm: Timer;
	private static alarmSet: boolean = false;
	private static lastInstance: DamageInstance; // The previous execution damage context
	private static canKick: boolean = true;
	private static totem: boolean = false;
	private static t1: Trigger;
	private static t2: Trigger;
	private static t3: Trigger;
	private static dreaming: boolean = false;
	private static sleepDepth: number = 0;
	private static kicking: boolean = false;
	private static eventsRun: boolean = false;
	public static current: DamageInstance; // The current execution damage context
	private static sourceAOE: number = 0;
	private static sourceStacks: number = 0; // Amount of target hit by the same sources
	private static orgSource: unit;
	private static orgTarget: unit;
	public static next: DamageInstance; // The next value to apply if exist
	private static targets: Group;
	private static attackImmune: boolean[] = [
		false, // ATTACK_TYPE_NORMAL
		true, // ATTACK_TYPE_MELEE
		true, // ATTACK_TYPE_PIERCE
		true, // ATTACK_TYPE_SIEGE
		false, // ATTACK_TYPE_MAGIC
		true, // ATTACK_TYPE_CHAOS
		true, // ATTACK_TYPE_HERO
	];
	private static damageImmune: boolean[] = [
		true, // DAMAGE_TYPE_UNKNOWN
		false, // NONE
		false, // NONE
		false, // NONE
		true, // DAMAGE_TYPE_NORMAL
		true, // DAMAGE_TYPE_ENHANCED
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
	private static recursiveStacks: DamageInstance[] = [];
	private static override: boolean = false;
	private static life: number = 0;
	private static prepped: DamageInstance;
	private static userIndex: OzDamageTrigger;
	private static recursiveSource: WeakMap<unit, boolean> = new WeakMap<unit, boolean>();
	private static recursiveTarget: WeakMap<unit, boolean> = new WeakMap<unit, boolean>();

	private static _lastReg: OzDamageTrigger;

	public static get lastRegistered() {
		return this._lastReg;
	}

	private static hasLethal: boolean = false;
	private static hasSource: boolean = false;
	public static register(whichEvent: string, priority: number, callback?: Function, trig?: Trigger) {
		let head: LinkedList<OzDamageTrigger> = this.eventList[whichEvent];
		if (!head) return;
		if (!callback || !trig) return;

		this.hasLethal = this.hasLethal || whichEvent == "lethal";
		this.hasSource = this.hasSource || whichEvent == "source";

		let dt: OzDamageTrigger = {
			func: callback
				? callback
				: () => {
						if (trig.eval()) trig.exec();
				  },
			trig: trig || null,
			sleepDepth: 0,
			isFrozen: false,
			weight: priority,
			isInception: false,
			minAOE: 0,
			hasFilters: false,
			filter: null,
			regAt: whichEvent,
		};
		this._lastReg = dt;

		// treelib don't provide custom iteration support so this is temporary to dealt with this
		if (head.noOfEntries > 0) {
			let node = head.first;
			while (node != null) {
				if (node.element.weight > priority) break;
				node = node.next;
			}
			node.insertBefore(dt);
		} else head.insertAtStart(dt);
		return dt;
	}

	public static remove(dev: OzDamageTrigger) {
		if (this._lastReg == dev) this._lastReg = null;
		let e = dev.regAt;
		const l: LinkedList<OzDamageTrigger> = this.eventList[e];
		l.search((v) => v == dev).remove();
	}

	public static addFilter(trig: OzDamageTrigger, filter: DamageFilter) {
		trig.hasFilters = true;
		trig.filter = filter;
	}

	private static checkItem(u: unit, id: number) {
		if (!IsUnitType(u, UNIT_TYPE_HERO)) return false;
		let m = UnitInventorySize(u);
		for (let i = 0; i < m; i++) {
			if (GetItemTypeId(UnitItemInSlot(u, i)) == id) return true;
		}
		return false;
	}

	// Begin system

	public static enable(flag: boolean) {
		if (this.dreaming) this.t3.enabled = flag;
		else {
			this.t1.enabled = flag;
			this.t2.enabled = flag;
		}
	}

	/**
	 * Call this to enable this executing damage trigger to run recursively
	 */
	public static inception() {
		this.userIndex.isInception = true;
	}

	private static breakCheck = {
		hit: () => false,
		damage: () => Damage.override || Damage.current.engineType[1],
		armor: () => Damage.current.damage <= 0.0,
		damaged: () => damagedOrAfter,
		after: () => damagedOrAfter,
	};

	private static checkFilter(ev: OzDamageTrigger) {
		if (!ev.hasFilters) return true;
		let f = ev.filter;
		let n = this.current;
		if (f.sourceId && f.sourceId != n.source.typeId) return false;
		else if (f.targetId && f.targetId != n.target.typeId) return false;
		else if (f.sourceBuff && n.source.getAbilityLevel(f.sourceBuff) == 0) return false;
		else if (f.targetBuff && n.target.getAbilityLevel(f.targetBuff) == 0) return false;
		else if (f.sourceItemId && !this.checkItem(n.source.handle, f.sourceItemId)) return false;
		else if (f.targetItemId && !this.checkItem(n.target.handle, f.targetItemId)) return false;
		else if (n.damage >= f.minDamage) return true;
		return false;
	}

	private static runEvent(v: string) {
		let breakPoint: Function = this.breakCheck[v] || DoNothing;
		if (this.dreaming || breakPoint()) return;
		let head: LinkedList<OzDamageTrigger> = this.eventList[v];
		if (!head.first) return;
		let n = head.first;
		this.enable(false);
		this.t3.enabled = true;
		this.dreaming = true;
		Logger.LogDebug("[OzDamageEngine] runEvent is running for: [" + v + "]");
		do {
			this.userIndex = n.element;
			if (
				(!this.userIndex.isFrozen && this.checkFilter(this.userIndex) && !this.hasSource) ||
				head != this.eventList["source"] ||
				(this.userIndex.minAOE && this.sourceAOE > this.userIndex.minAOE)
			)
				this.userIndex.func();
			n = n.next;
		} while (n != null || breakPoint());
		Logger.LogDebug("[OzDamageEngine] runEvent is finished");
		this.dreaming = false;
		this.enable(true);
		this.t3.enabled = false;
	}

	public static create(
		source: unit,
		target: unit,
		amt: number,
		isAttack: boolean,
		isRanged: boolean,
		attackType: attacktype,
		damageType: damagetype,
		weaponType: weapontype
	) {
		let d: DamageInstance = {
			source: Unit.fromHandle(source),
			target: Unit.fromHandle(target),
			owner: MapPlayer.fromHandle(GetOwningPlayer(source)),
			damage: amt,
			isAttack: isAttack,
			isRanged: isRanged,
			attackType: attackType,
			damageType: damageType,
			weaponType: weaponType,
			userType: [],
			engineType: [],
			gameType: [],
			isMelee: IsUnitType(source, UNIT_TYPE_MELEE_ATTACKER) && !isRanged,
			isSpell: attackType == ATTACK_TYPE_NORMAL && damageType != DAMAGE_TYPE_NORMAL,
			prevAmt: amt,
			prevAttackType: attackType,
			prevDamageType: damageType,
			pierceArmor: 0,
			recursive: null, // Will only set on certain time
		};

		if (this.next) {
			d.userType = this.next.userType || d.userType;
			d.engineType = this.next.engineType || d.engineType;
			d.gameType = this.next.gameType || d.gameType;
			d.attackType = this.next.attackType || d.attackType;
			d.damageType = this.next.damageType || d.damageType;
			d.isSpell = this.next.isSpell || d.isSpell;
			d.isAttack = this.next.isAttack || d.isAttack;
			d.isRanged = this.next.isRanged || d.isRanged;

			this.next = {} as DamageInstance; // Empty out / Drop the table
		}

		return d;
	}

	private static addRecursive(d: DamageInstance) {
		if (d.damage == 0) return;
		d.recursive = this.userIndex;
		if (!this.kicking && this.recursiveSource.get(d.source.handle) && this.recursiveTarget.get(d.target.handle)) {
			if (!this.userIndex.isInception) this.userIndex.isFrozen = true;
			else if (!this.userIndex.isFrozen && this.userIndex.sleepDepth < this.sleepDepth){
				this.userIndex.sleepDepth++;
				this.userIndex.isFrozen = this.userIndex.sleepDepth >= LIMBO_DEPTH;
			}
		}
		this.recursiveStacks.push(d);
	}

	public static apply(
		source: Unit,
		target: Unit,
		amt: number,
		isAuto: boolean,
		isRanged: boolean,
		attackType: attacktype,
		damageType: damagetype
	) {
		let d: DamageInstance;
		if (this.dreaming) {
			d = this.create(source.handle, target.handle, amt, isAuto, isRanged, attackType, damageType, null);
			this.addRecursive(d);
		} else {
			source.damageTarget(target.handle, amt, isAuto, isRanged, attackType, damageType, null);
			d = this.current;
			this.finish();
		}
		return d;
	}

	// End System, Begin Just Another Scripting Syntax 2 API

	private static onAOEEnd() {
		this.runEvent("source");
		this.sourceAOE = 1;
		this.sourceStacks = 1;
		this.orgTarget = null;
		this.orgSource = null;
		this.targets.clear();
	}

	private static setArmor(rs: boolean) {
		let p = this.current.pierceArmor * (rs ? 1 : -1);
		if (p != 0) {
			this.current.target.armor = this.current.target.armor + p;
		}
	}

	private static afterDamage() {
		if (this.current) {
			this.runEvent("after");
			this.current = null;
		}
		this.override = false;
	}

	private static doPreEvents(d: DamageInstance, natural: boolean) {
		d.pierceArmor = 0;
		this.current = d;
		this.recursiveSource.set(d.source.handle, true);
		this.recursiveTarget.set(d.target.handle, true);
		if (d.damage == 0) return true;
		this.override = d.damageType == DAMAGE_TYPE_UNKNOWN;
		if (d.isAttack) this.runEvent("hit");
		this.runEvent("damage");
		if (natural) {
			BlzSetEventAttackType(d.attackType);
			BlzSetEventDamageType(d.damageType);
			BlzSetEventWeaponType(d.weaponType);
			BlzSetEventDamage(d.damage);
		}
		this.setArmor(false);
	}

	private static finish() {
		if (this.eventsRun) {
			this.eventsRun = false;
			this.afterDamage();
		}
		this.current = null;
		this.override = false;
		if (!this.canKick && this.kicking) return;
		if (this.recursiveStacks.length > 0) {
			this.kicking = true;
			let i = 1;
			let ex: number;
			do {
				this.sleepDepth++;
				ex = this.recursiveStacks.length;
				do {
					this.prepped = this.recursiveStacks[i];
					if (this.prepped.target.isAlive()) {
						this.doPreEvents(this.prepped, false);
						if (this.prepped.damage > 0) {
							this.t1.enabled = false;
							this.t2.enabled = true;
							this.totem = true;
							this.prepped.source.damageTarget(
								this.prepped.target.handle,
								this.prepped.damage,
								this.prepped.isAttack,
								this.prepped.isRanged,
								this.prepped.attackType,
								this.prepped.damageType,
								this.prepped.weaponType
							);
						} else {
							this.runEvent("damaged");
							if (this.prepped.damage < 0)
								SetWidgetLife(this.prepped.target.handle, GetWidgetLife(this.prepped.target.handle) - this.prepped.damage);
							this.setArmor(true);
						}
						this.afterDamage();
					}
					i++;
				} while (i >= ex);
			} while (i >= this.recursiveStacks.length);
		}
		this.recursiveStacks.forEach((s, i) => {
			s.recursive.isFrozen = false;
			s.recursive.sleepDepth = 0;
			this.recursiveStacks[i] = null;
		});
		this.sleepDepth = 0;
		this.prepped = null;
		this.kicking = false;
		this.dreaming = false;
		this.enable(true);
		this.recursiveSource = new WeakMap<unit, boolean>();
		this.recursiveTarget = new WeakMap<unit, boolean>();
	}

	private static failSafeClear() {
		this.setArmor(true);
		this.canKick = true;
		this.kicking = false;
		this.totem = false;
		this.runEvent("damaged");
		this.eventsRun = true;
		this.finish();
	}

	private static createFromEvent() {
		return this.create(
			GetEventDamageSource(),
			GetTriggerUnit(),
			GetEventDamage(),
			BlzGetEventIsAttack(),
			false,
			BlzGetEventAttackType(),
			BlzGetEventDamageType(),
			BlzGetEventWeaponType()
		);
	}
}
