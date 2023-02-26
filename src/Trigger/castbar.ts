import { addScriptHook, W3TS_HOOK } from "w3ts";
import { registerPlayerUnitEvent } from "Libs";
import { Orders } from "wc3-treelib";
import { safeFilter } from "Utils";

const ct = "||||||||||||||||||||";
const cd = 100 / ct.length;
const isCancel: boolean[] = [];
const isCasting: boolean[] = [];
let tg: trigger;
let qq = 0;

function render(rate: number) {
  let a = rate > 100 ? ct.length : Math.floor(rate / cd);
  let c = ct.substring(0, a);
  let u = a == ct.length ? "" : ct.substring(a);

  return string.format(
    "|c00FF0000[|c00FFFF00%s|r|c00000000%s|r|c00FF0000]|r",
    c,
    u
  );
}

function _onCast() {
  let caster = GetSpellAbilityUnit() as unit;
  let owner = GetOwningPlayer(caster);
  let ownerId = GetPlayerId(owner);
  let abil = GetSpellAbility() as ability;
  let id = GetSpellAbilityId();
  let castTime = BlzGetAbilityRealLevelField(
    abil,
    ABILITY_RLF_CASTING_TIME,
    GetUnitAbilityLevel(caster, id)
  );
  if (castTime <= 0) return false;
  isCancel[ownerId] = false;
  isCasting[ownerId] = true;
  qq++;
  if (!IsTriggerEnabled(tg)) EnableTrigger(tg);
  let rate = 3.125 / castTime;
  let now = 0;
  let bar: texttag | undefined;
  if (GetLocalPlayer() == owner) {
    bar = CreateTextTag() as texttag;
    SetTextTagPermanent(bar, false);
    SetTextTagLifespan(bar, castTime + 0.5);
    SetTextTagFadepoint(bar, castTime + 0.25);
    SetTextTagPos(bar, GetUnitX(caster), GetUnitY(caster), 110);
    SetTextTagText(bar, render(0), 0.03);
  }
  let t = CreateTimer();
  let t2 = CreateTimer();
  TimerStart(t, 0.03125, true, () => {
    if (!bar) return;
    if (isCancel[ownerId] || castTime < 0) {
      SetTextTagText(
        bar,
        string.format(
          "|c00ff0000[|r%s|c00ff0000]|r",
          isCancel[ownerId] ? "CANCELLED" : "CASTED"
        ),
        0.03
      );
      PauseTimer(t);
      DestroyTimer(t);
      return;
    }
    now += rate;
    castTime -= 0.03125;
    SetTextTagText(bar, render(now), 0.03);
  });
  TimerStart(t2, castTime + 0.15, false, () => {
    if (!bar) return;
    DestroyTextTag(bar);
    qq--;
    if (qq == 0) DisableTrigger(tg);
    isCasting[ownerId] = false;
    isCancel[ownerId] = false;
    PauseTimer(t2);
    DestroyTimer(t2);
  });
}

function _onOrder() {
  let u = GetOrderedUnit() as unit;
  let id = GetPlayerId(GetOwningPlayer(u));
  if (!isCasting) return false;

  let order = GetIssuedOrderId();
  if (!isCancel[id] && (order == Orders.move || order == Orders.patrol))
    isCancel[id] = true;

  return false;
}

function _onInit() {
  tg = CreateTrigger();
  for (const i of $range(0, bj_MAX_PLAYERS)) {
    TriggerRegisterPlayerUnitEvent(
      tg,
      Player(i) as player,
      EVENT_PLAYER_UNIT_ISSUED_ORDER,
      safeFilter
    );
  }
  TriggerAddCondition(tg, Condition(_onOrder));
  registerPlayerUnitEvent(EVENT_PLAYER_UNIT_SPELL_CHANNEL, _onCast);
}

addScriptHook(W3TS_HOOK.MAIN_AFTER, _onInit);
