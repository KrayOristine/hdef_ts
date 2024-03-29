import * as ll from "../shared/LinkedList";
import * as js from "../shared/jsNative";
import * as h from "../shared/hooks";

/*
 * Introducing to you a ported version of Bribe Damage Engine on TS that have almost same functionality as the original one
 * But with modified userType from just single into flag array
 *
 * Original version in lua by Bribe
 * Ported to TS by Ozzzzymaniac (aka. TranTrungHo71)
 *
 * Version: 2.1
 * Now please use `import * as Damage` to reduce local variable usage caused by tstl
 */

const DEATH_VAL = 0.405; // Value which unit is determined as death
const LIMBO_DEPTH = 8; // How much can the engine will be able to recursive

// These are just for user, they can add or remove but please kept the INTERNAL last
export const enum DamageType {
  None, // Doesn't do anything
  Physical,
  Magical,
  Pure, // Bypass most damage reduction and defense
  Evasion, // Set damage to 0
  Critical, // Dealt extra damage
  Heal, // Is heal
  Shield, // Negated by shield

  // System flags (Only as if you want to use them)

  Spell, // Came from abilities that not specify damage type by default
  Periodic, // Came from damage over times
  Item, // Came from items
  AOE, // Is an AOE damage
  PET, // Pet!

  // Engine Flags (These are not intended to be modified)

  RAW, // Bypass all armor, crit, evasion, ignore damage reduction
  INTERNAL, // Ignore the engine, don't fire any event
}

interface DamageInstance {
  source: unit;
  target: unit;
  damage: number;
  isAttack: boolean;
  isRanged: boolean;
  flags: boolean[];
  attackType: attacktype;
  damageType: damagetype;
  weaponType?: weapontype;
  readonly prevAmt: number;
  readonly prevAttackType: attacktype;
  readonly prevDamageType: damagetype;
  readonly prevWeaponType?: weapontype;
  recursive?: DamageTrigger;
}

interface DamageTrigger {
  func: Func<void>;
  isFrozen: boolean;
  isInception: boolean;
  dreamDepth: number;
  weight: number;
  minAOE: number;
  registerAt: number;
}

// const DAMAGE_EVENT = {
// DAMAGE: "damage", // Upon the damage first run
// ARMOR: "armor", // Armor event run
// DAMAGED: "damaged", // Damage almost applied
// AFTER: "after", // After applied
// SOURCE: "source", // For AOE event
// LETHAL: "lethal", // As it name tell us
// } as const;
//
// type DamageEvent = ObjValues<typeof DAMAGE_EVENT>;

export const enum DamageEvent {
  DAMAGE, // Upon the damage first run
  ARMOR, // Armor event run
  DAMAGED, // Damage almost applied
  AFTER, // After applied
  SOURCE, // For AOE event
  LETHAL, // as it name
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
  prep = false,
  hasSource = false,
  hasLethal = false,
  sleepDepth = 0,
  t1: trigger,
  t2: trigger,
  t3: trigger,
  alarm: timer,
  orgSource: unit | undefined,
  orgTarget: unit | undefined,
  recursiveSource: LuaMap<unit, boolean> = new LuaMap(),
  recursiveTarget: LuaMap<unit, boolean> = new LuaMap(),
  targets: LuaMap<unit, boolean> = new LuaMap(),
  userIndex: DamageTrigger,
  recursiveStacks: DamageInstance[] = [];

export let nextType: DamageType; // The next value to apply if exist
export let life = 0; // Should only use on lethal event
export let sourceAOE = 1;
export let sourceStacks = 1;

export let current: DamageInstance, lastInstance: DamageInstance;

const internalSkip = () => current.flags[DamageType.INTERNAL];
const breakCheck = [
  () => current.flags[DamageType.Pure] || skipEngine || current.flags[DamageType.INTERNAL],
  () => current.damage <= 0 || current.flags[DamageType.Pure] || current.flags[DamageType.INTERNAL],
  internalSkip,
  internalSkip,
  internalSkip,
  internalSkip,
];

const eventList = [
  new ll.LinkedList<DamageTrigger>(), // damage
  new ll.LinkedList<DamageTrigger>(), // armor
  new ll.LinkedList<DamageTrigger>(), // damaged
  new ll.LinkedList<DamageTrigger>(), // after
  new ll.LinkedList<DamageTrigger>(), // source
  new ll.LinkedList<DamageTrigger>(), // lethal
];
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
  if (dreaming || head == null || check() || head.first == null) return;

  let node = head.first;
  enable(false);
  EnableTrigger(t3);
  dreaming = true;

  while (true) {
    if (!userIndex.isFrozen || !hasSource || v != DamageEvent.SOURCE || sourceAOE > userIndex.minAOE) {
      userIndex.func();
    }
    if (node.next == null || check()) break;

    node = node.next;
    userIndex = node.value;
  }

  dreaming = false;
  enable(true);
  DisableTrigger(t3);
}

function create(src: unit | undefined, tgt: unit | undefined, dmg: number, iatk: boolean, irgd: boolean, tatk: attacktype, tdmg: damagetype, twpn?: weapontype) {
  if (src == undefined) error("What the fuck are you doing?, why the fuck the source is null?");
  if (tgt == undefined) error("What the fuck are you doing?, why the fuck the target is null?");

  let d: DamageInstance = {
    source: src,
    target: tgt,
    damage: dmg,
    attackType: tatk,
    damageType: tdmg,
    weaponType: twpn,
    isAttack: iatk,
    isRanged: irgd,
    flags: js.ArrayNew(DamageType.PET, false),
    prevAmt: dmg,
    prevAttackType: tatk,
    prevDamageType: tdmg,
    prevWeaponType: twpn,
  };
  if (nextType != 0) {
    d.flags[nextType] = true;
    nextType = 0;
  }
  d.flags[DamageType.Spell] = tatk == ATTACK_TYPE_NORMAL && !iatk;
  d.flags[DamageType.Physical] = iatk;
  return d;
}

function addRecursive(d: DamageInstance) {
  if (d.damage == 0) return;
  d.recursive = userIndex;
  recursiveStacks.push(d);

  if (!kicking && recursiveSource.get(d.source) == undefined && recursiveTarget.get(d.target) == undefined) return;

  if (!userIndex.isFrozen) {
    userIndex.isFrozen = true;
    return;
  }

  if (!userIndex.isFrozen && userIndex.dreamDepth < sleepDepth) {
    userIndex.dreamDepth++;
    userIndex.isFrozen = userIndex.dreamDepth >= LIMBO_DEPTH;
  }
}

function AOEEnd() {
  runEvent(DamageEvent.SOURCE);
  sourceAOE = 1;
  sourceStacks = 1;
  orgSource = undefined;
  orgTarget = undefined;
  targets = new LuaMap();
}

function afterDamage() {
  if (isCurrent) {
    runEvent(DamageEvent.AFTER);
    isCurrent = false;
  }
  skipEngine = false;
}

function doPreEvent(d: DamageInstance, isNatural: boolean) {
  current = d;
  recursiveSource.set(d.source, true);
  recursiveTarget.set(d.target, true);
  if (d.damage == 0.0) return false;
  skipEngine = d.damageType == DAMAGE_TYPE_UNKNOWN || d.flags[DamageType.INTERNAL];
  runEvent(DamageEvent.DAMAGE);
  if (isNatural) {
    BlzSetEventAttackType(d.attackType);
    BlzSetEventDamageType(d.damageType);
    BlzSetEventWeaponType(d.weaponType ?? WEAPON_TYPE_WHOKNOWS);
    BlzSetEventDamage(d.damage);
  }
  return true;
}

function runRecursive(i: number, stack: DamageInstance[]) {
  let ex = stack.length;
  for (const j of $range(i, ex)) {
    prep = true;
    let d = stack[j];
    if (!UnitAlive(d.target)) continue;

    doPreEvent(d, false);
    if (d.damage > 0.0) {
      DisableTrigger(t1);
      EnableTrigger(t2);
      totem = true;
      UnitDamageTarget(d.source, d.target, d.damage, d.isAttack, d.isRanged, d.attackType, d.damageType, d.weaponType ?? WEAPON_TYPE_WHOKNOWS);
    } else {
      runEvent(DamageEvent.DAMAGED);
      if (d.damage < 0) SetWidgetLife(d.target, GetWidgetLife(d.target) - d.damage);
    }
    afterDamage();
  }
  return ex;
}

function finish() {
  if (eventsRun) {
    eventsRun = false;
    afterDamage();
  }
  isCurrent = false;
  skipEngine = false;
  if (!canKick && kicking) return;
  if (recursiveStacks.length > 0) {
    kicking = true;
    let i = 0;
    do {
      sleepDepth++;
      i = runRecursive(i, recursiveStacks);
    } while (i < recursiveStacks.length);

    for (const i of $range(0, recursiveStacks.length)) {
      let rs = recursiveStacks[i].recursive;
      if (rs == null) continue;

      rs.isFrozen = false;
      rs.dreamDepth = 0;
    }
  }
  recursiveStacks = [];
  sleepDepth = 0;
  prep = false;
  kicking = false;
  dreaming = false;
  enable(true);
  recursiveSource = new LuaMap();
  recursiveTarget = new LuaMap();
}

function failsafeClear() {
  canKick = true;
  kicking = false;
  totem = false;
  runEvent(DamageEvent.DAMAGED);
  eventsRun = true;
  finish();
}

function createFromEvent() {
  return create(
    GetEventDamageSource(),
    BlzGetEventDamageTarget(),
    GetEventDamage(),
    BlzGetEventIsAttack(),
    false,
    BlzGetEventAttackType() as attacktype,
    BlzGetEventDamageType() as damagetype,
    BlzGetEventWeaponType()
  );
}

// Creating this seprately may slightly increase performance with timer
function alarmExec() {
  alarmSet = false;
  dreaming = false;
  enable(true);
  if (totem) failsafeClear();
  else {
    canKick = true;
    kicking = false;
    finish();
  }
  AOEEnd();
  isCurrent = false;
}

function __trigger1_action() {
  let d = createFromEvent();
  if (alarmSet) {
    if (totem) {
      const h = GetHandleId(d.damageType);
      if (h == 20 || h == 21 || h == 24) {
        lastInstance = current;
        isLastInstance = true;
        totem = false;
        canKick = true;
      } else {
        failsafeClear();
      }
    } else {
      finish();
    }

    if (d.source != orgSource) {
      AOEEnd();
      orgSource = d.source;
      orgTarget = d.target;
    } else if (d.target == orgTarget) sourceStacks++;
    else if (targets.has(d.target)) sourceAOE++;
  } else {
    alarmSet = true;
    TimerStart(alarm, 0.0, false, alarmExec);
    orgSource = d.source;
    orgTarget = d.target;
  }

  targets.set(d.target, true);
  if (doPreEvent(d, true)) {
    canKick = true;
    finish();
  }

  totem = !isLastInstance || attackImmune[GetHandleId(d.attackType)] || damageImmune[GetHandleId(d.damageType)] || !IsUnitType(d.target, UNIT_TYPE_MAGIC_IMMUNE);

  return false;
}

function __trigger2_action(): boolean {
  let r = GetEventDamage();
  let d = current;

  if (prep) prep = false;
  else if (dreaming || d.prevAmt == 0) return false;
  else if (totem) totem = false;
  else {
    afterDamage();
    d = lastInstance;
    current = d;
    isLastInstance = false;
    canKick = true;
  }

  d.damage = r;
  if (r > 0.0) {
    runEvent(DamageEvent.ARMOR);
    if (hasLethal) {
      life = GetWidgetLife(d.target) - d.damage;
      if (life <= DEATH_VAL) {
        runEvent(DamageEvent.LETHAL);
        d.damage = GetWidgetLife(d.target) - life;
      }
    }
  }

  if (d.damageType != DAMAGE_TYPE_UNKNOWN) runEvent(DamageEvent.DAMAGED);
  BlzSetEventDamage(d.damage);
  eventsRun = true;
  if (d.damage == 0) finish();

  return false;
}

function __trigger3_action(): boolean {
  addRecursive(createFromEvent());
  BlzSetEventDamage(0.0);

  return false;
}

function Init() {
  alarm = CreateTimer();
  t1 = CreateTrigger();
  t2 = CreateTrigger();
  t3 = CreateTrigger();
  for (const i of $range(0, bj_MAX_PLAYERS)) {
    const p = Player(i) as player;
    TriggerRegisterPlayerUnitEvent(t1, p, EVENT_PLAYER_UNIT_DAMAGING);
    TriggerRegisterPlayerUnitEvent(t2, p, EVENT_PLAYER_UNIT_DAMAGED);
    TriggerRegisterPlayerUnitEvent(t3, p, EVENT_PLAYER_UNIT_DAMAGING);
  }

  TriggerAddCondition(t1, Condition(__trigger1_action));
  TriggerAddCondition(t2, Condition(__trigger2_action));
  TriggerAddCondition(t3, Condition(__trigger3_action));
  DisableTrigger(t3);
}

h.mainBefore(Init);

/**
 * Register a new listener that will fired on specific event
 * @param whichEvent
 * @param priority - Lower number run first
 * @param callback - A function take no arguments, return nothing
 * @returns A event node
 */
export function register(whichEvent: DamageEvent, priority: number, callback: Func<void>) {
  let head = eventList[whichEvent];

  hasLethal = hasLethal || whichEvent == DamageEvent.LETHAL;
  hasSource = hasSource || whichEvent == DamageEvent.SOURCE;

  const data: DamageTrigger = {
    func: callback,
    isFrozen: false,
    isInception: false,
    weight: priority,
    dreamDepth: 0,
    minAOE: 1,
    registerAt: whichEvent,
  };

  let node = head.first;
  if (node == null) return head.addFirst(data);

  while (true) {
    if (node.value.weight > priority) return node.addBefore(data);
    if (node.next == null) break;

    node = node.next;
  }

  return node.addAfter(data);
}

/**
 * Remove a given node out of the Damage system
 * @returns boolean indicate the removal is successful or not
 */
export function remove(node: ll.ListNode<DamageTrigger>) {
  let r = node.remove();
  if (r != null && r.registerAt >= 4) {
    if (eventList[DamageEvent.SOURCE].count == 0) {
      hasSource = false;
    }
    if (eventList[DamageEvent.LETHAL].count == 0) {
      hasLethal = false;
    }
  }
  return r != null;
}

// Begin system

/**
 * Call this with flag parameters to either enable or disable the Damage Engine
 */
export function enable(flag: boolean) {
  if (flag) {
    if (dreaming) EnableTrigger(t3);
    else {
      EnableTrigger(t1);
      EnableTrigger(t2);
    }
    return;
  }

  if (dreaming) DisableTrigger(t3);
  else {
    DisableTrigger(t1);
    DisableTrigger(t2);
  }
}

/**
 * Call this to enable current executing damage trigger to run recursively
 */
export function inception() {
  userIndex.isInception = true;
}
