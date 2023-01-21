import { addScriptHook, W3TS_HOOK, Unit, Trigger, TextTag, Timer } from "w3ts";
import { Players } from "w3ts/globals";
import { Ability } from "Datastruct/Ability";
import { registerPlayerUnitEvent } from "Libs/regPlayerUnitEvent";
import { Orders } from "wc3-treelib";

const ct = "||||||||||||||||||||";
const cd = 100 / ct.length;
const cc: boolean[] = [];
const co: boolean[] = [];
const tg = new Trigger();
let qq = 0;

function render(rate: number) {
	let a = rate > 100 ? ct.length : Math.floor(rate / cd);
	let c = ct.substring(0, a);
	let u = a == ct.length ? "" : ct.substring(a);

	return string.format("|c00FF0000[|c00FFFF00%s|r|c00000000%s|r|c00FF0000]|r", c, u);
}

function _onCast() {
	let caster = Unit.fromHandle(GetSpellAbilityUnit());
	let owner = caster.owner;
	let abil = Ability.fromEvent();
	let id = GetSpellAbilityId();
	let castTime = abil.getLevelField(ABILITY_RLF_CASTING_TIME, caster.getAbilityLevel(id)) as number;
	if (castTime <= 0) return false;
	cc[owner.id] = false;
	co[owner.id] = true;
	qq++;
	if (!tg.enabled) tg.enabled = true;
	let rate = 3.125 / castTime;
	let now = 0;
	let bar: TextTag;
	if (owner.isLocal()) {
		bar = new TextTag();
		bar.setPermanent(false);
		bar.setLifespan(castTime + 0.5);
		bar.setFadepoint(castTime + 0.25);
		bar.setPos(caster.x, caster.y, 110);
		bar.setText(render(0), 0.03);
	}
	let t = new Timer();
	let t2 = new Timer();
	t.start(0.03125, true, () => {
		if (!bar) return;
		if (cc[owner.id] || castTime < 0) {
			bar.setText(string.format("|c00ff0000[|r%s|c00ff0000]|r", cc[owner.id] ? "CANCELLED" : "CASTED"), 0.03);
			t.pause();
			t.destroy();
			return;
		}
		now += rate;
		castTime -= 0.03125;
		bar.setText(render(now), 0.03);
	});
	t2.start(castTime + 0.15, false, () => {
		if (!bar) return;
		bar.destroy();
		qq--;
		if (qq == 0) tg.enabled = false;
		co[owner.id] = false;
		cc[owner.id] = false;
		t2.pause();
		t2.destroy();
	});
}

function _onOrder() {
	let id = Unit.fromHandle(GetOrderedUnit()).owner.id;
	if (co[id] && !cc[id]) {
		if (GetIssuedOrderId() == Orders.move) cc[id] = true;
	}
	return false;
}

addScriptHook(W3TS_HOOK.MAIN_AFTER, () => {
	for (let i = 0; i < bj_MAX_PLAYERS; i++) {
		tg.registerPlayerUnitEvent(Players[i], EVENT_PLAYER_UNIT_ISSUED_ORDER, null);
	}
	tg.addCondition(_onOrder);
	registerPlayerUnitEvent(EVENT_PLAYER_UNIT_SPELL_CHANNEL, _onCast);
});
